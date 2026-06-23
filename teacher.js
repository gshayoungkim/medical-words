(function () {
  const TYPES = ["prefix", "root", "suffix"];
  const LABELS = { prefix: "Prefix", root: "Root", suffix: "Suffix" };
  let data = MedicalWordData.getData();

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function toast(message) {
    const element = document.getElementById("toast");
    element.textContent = message;
    element.classList.add("visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("visible"), 2200);
  }

  function persist(message) {
    MedicalWordData.saveData(data);
    renderAll();
    toast(message);
  }

  function setupNavigation() {
    document.querySelectorAll(".teacher-nav button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".teacher-nav button").forEach((item) => item.classList.remove("active"));
        document.querySelectorAll(".teacher-section").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(`section-${button.dataset.section}`).classList.add("active");
      });
    });
  }

  function renderSummary() {
    const values = [
      ["Prefix", data.morphemes.prefix.length],
      ["Root", data.morphemes.root.length],
      ["Suffix", data.morphemes.suffix.length],
      ["Quiz", data.quizzes.length]
    ];
    document.getElementById("summary-cards").innerHTML = values.map(([label, count]) =>
      `<div class="summary-card"><strong>${count}</strong><span>${label} 등록</span></div>`
    ).join("");
  }

  function renderMorphemeList() {
    const typeFilter = document.getElementById("morpheme-filter-type").value;
    const query = document.getElementById("morpheme-filter").value.trim().toLowerCase();
    const list = document.getElementById("morpheme-list");
    const items = TYPES.flatMap((type) => data.morphemes[type].map((item) => ({ ...item, type })))
      .filter((item) => typeFilter === "all" || item.type === typeFilter)
      .filter((item) => [item.text, item.meaning, item.example].join(" ").toLowerCase().includes(query));

    list.innerHTML = items.length ? items.map((item) => `
      <div class="management-item">
        <div><span class="count-badge">${LABELS[item.type]}</span> <span class="term-value">${escapeHtml(item.text)}</span></div>
        <div class="muted">${escapeHtml(item.meaning)}</div>
        <div class="muted">${escapeHtml(item.example || "예시 없음")}</div>
        <div class="item-actions">
          <button class="icon-button" type="button" data-edit-morpheme="${item.id}" data-type="${item.type}">수정</button>
          <button class="icon-button" type="button" data-delete-morpheme="${item.id}" data-type="${item.type}">삭제</button>
        </div>
      </div>`).join("") : '<div class="empty-message">표시할 구성요소가 없습니다.</div>';
  }

  function populateQuizSelects() {
    TYPES.forEach((type) => {
      const select = document.getElementById(`quiz-${type}`);
      const current = select.value;
      select.innerHTML = `<option value="">없음</option>` + data.morphemes[type]
        .map((item) => `<option value="${item.id}">${escapeHtml(item.text)} — ${escapeHtml(item.meaning)}</option>`)
        .join("");
      if ([...select.options].some((option) => option.value === current)) select.value = current;
    });
  }

  function getPartText(id) {
    if (!id) return "없음";
    for (const type of TYPES) {
      const found = data.morphemes[type].find((item) => item.id === id);
      if (found) return found.text;
    }
    return "삭제된 블록";
  }

  function renderQuizList() {
    const query = document.getElementById("quiz-filter").value.trim().toLowerCase();
    const items = data.quizzes.filter((item) =>
      [item.prompt, item.term, item.meaning, item.explanation].join(" ").toLowerCase().includes(query)
    );
    document.getElementById("quiz-list").innerHTML = items.length ? items.map((item) => `
      <div class="management-item quiz-item">
        <div>
          <span class="term-value">${escapeHtml(item.term)}</span>
          <div class="muted">${escapeHtml(item.prompt)}</div>
        </div>
        <div class="muted">${escapeHtml(item.meaning)}</div>
        <div class="muted">${escapeHtml([item.prefixId, item.rootId, item.suffixId].map(getPartText).join(" + "))}</div>
        <div class="item-actions">
          <button class="icon-button" type="button" data-edit-quiz="${item.id}">수정</button>
          <button class="icon-button" type="button" data-delete-quiz="${item.id}">삭제</button>
        </div>
      </div>`).join("") : '<div class="empty-message">표시할 퀴즈가 없습니다.</div>';
  }

  function resetMorphemeForm() {
    document.getElementById("morpheme-form").reset();
    document.getElementById("morpheme-id").value = "";
  }

  function editMorpheme(type, id) {
    const item = data.morphemes[type].find((entry) => entry.id === id);
    if (!item) return;
    document.getElementById("morpheme-id").value = item.id;
    document.getElementById("morpheme-type").value = type;
    document.getElementById("morpheme-text").value = item.text;
    document.getElementById("morpheme-meaning").value = item.meaning;
    document.getElementById("morpheme-example").value = item.example || "";
    document.getElementById("morpheme-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function saveMorpheme(event) {
    event.preventDefault();
    const id = document.getElementById("morpheme-id").value;
    const type = document.getElementById("morpheme-type").value;
    const item = {
      id: id || makeId(type),
      text: document.getElementById("morpheme-text").value.trim(),
      meaning: document.getElementById("morpheme-meaning").value.trim(),
      example: document.getElementById("morpheme-example").value.trim()
    };

    if (id) {
      let previousType = null;
      TYPES.forEach((candidate) => {
        const index = data.morphemes[candidate].findIndex((entry) => entry.id === id);
        if (index >= 0) {
          previousType = candidate;
          data.morphemes[candidate].splice(index, 1);
        }
      });
      data.morphemes[type].push(item);
      resetMorphemeForm();
      persist(previousType === type ? "구성요소를 수정했습니다." : "분류를 변경해 저장했습니다.");
    } else {
      data.morphemes[type].push(item);
      resetMorphemeForm();
      persist("구성요소를 추가했습니다.");
    }
  }

  function deleteMorpheme(type, id) {
    const usedBy = data.quizzes.filter((quiz) => TYPES.some((part) => quiz[`${part}Id`] === id));
    const warning = usedBy.length
      ? `이 블록을 사용하는 퀴즈 ${usedBy.length}개도 함께 삭제됩니다. 계속할까요?`
      : "이 구성요소를 삭제할까요?";
    if (!window.confirm(warning)) return;
    data.morphemes[type] = data.morphemes[type].filter((item) => item.id !== id);
    data.quizzes = data.quizzes.filter((quiz) => !TYPES.some((part) => quiz[`${part}Id`] === id));
    persist("구성요소를 삭제했습니다.");
  }

  function resetQuizForm() {
    document.getElementById("quiz-form").reset();
    document.getElementById("quiz-id").value = "";
  }

  function editQuiz(id) {
    const item = data.quizzes.find((entry) => entry.id === id);
    if (!item) return;
    document.getElementById("quiz-id").value = item.id;
    document.getElementById("quiz-prompt").value = item.prompt;
    document.getElementById("quiz-prefix").value = item.prefixId || "";
    document.getElementById("quiz-root").value = item.rootId || "";
    document.getElementById("quiz-suffix").value = item.suffixId || "";
    document.getElementById("quiz-term").value = item.term;
    document.getElementById("quiz-meaning").value = item.meaning;
    document.getElementById("quiz-explanation").value = item.explanation || "";
    document.getElementById("quiz-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function saveQuiz(event) {
    event.preventDefault();
    const id = document.getElementById("quiz-id").value;
    const item = {
      id: id || makeId("quiz"),
      prompt: document.getElementById("quiz-prompt").value.trim(),
      prefixId: document.getElementById("quiz-prefix").value,
      rootId: document.getElementById("quiz-root").value,
      suffixId: document.getElementById("quiz-suffix").value,
      term: document.getElementById("quiz-term").value.trim(),
      meaning: document.getElementById("quiz-meaning").value.trim(),
      explanation: document.getElementById("quiz-explanation").value.trim()
    };
    if (!item.prefixId && !item.rootId && !item.suffixId) {
      toast("정답 구성요소를 하나 이상 선택하세요.");
      return;
    }
    if (id) {
      const index = data.quizzes.findIndex((entry) => entry.id === id);
      data.quizzes[index] = item;
      resetQuizForm();
      persist("퀴즈를 수정했습니다.");
    } else {
      data.quizzes.push(item);
      resetQuizForm();
      persist("퀴즈를 추가했습니다.");
    }
  }

  function deleteQuiz(id) {
    if (!window.confirm("이 퀴즈를 삭제할까요?")) return;
    data.quizzes = data.quizzes.filter((item) => item.id !== id);
    persist("퀴즈를 삭제했습니다.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medical-word-lab-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast("수업 데이터를 내보냈습니다.");
  }

  async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.morphemes || !parsed.quizzes || !TYPES.every((type) => Array.isArray(parsed.morphemes[type]))) {
        throw new Error("invalid schema");
      }
      data = parsed;
      persist("수업 데이터를 가져왔습니다.");
    } catch {
      toast("올바른 Medical Word Lab JSON 파일이 아닙니다.");
    } finally {
      event.target.value = "";
    }
  }

  function renderAll() {
    renderSummary();
    populateQuizSelects();
    renderMorphemeList();
    renderQuizList();
  }

  function setupEvents() {
    document.getElementById("morpheme-form").addEventListener("submit", saveMorpheme);
    document.getElementById("quiz-form").addEventListener("submit", saveQuiz);
    document.getElementById("cancel-morpheme").addEventListener("click", resetMorphemeForm);
    document.getElementById("cancel-quiz").addEventListener("click", resetQuizForm);
    document.getElementById("morpheme-filter").addEventListener("input", renderMorphemeList);
    document.getElementById("morpheme-filter-type").addEventListener("change", renderMorphemeList);
    document.getElementById("quiz-filter").addEventListener("input", renderQuizList);

    document.getElementById("morpheme-list").addEventListener("click", (event) => {
      const edit = event.target.closest("[data-edit-morpheme]");
      const remove = event.target.closest("[data-delete-morpheme]");
      if (edit) editMorpheme(edit.dataset.type, edit.dataset.editMorpheme);
      if (remove) deleteMorpheme(remove.dataset.type, remove.dataset.deleteMorpheme);
    });

    document.getElementById("quiz-list").addEventListener("click", (event) => {
      const edit = event.target.closest("[data-edit-quiz]");
      const remove = event.target.closest("[data-delete-quiz]");
      if (edit) editQuiz(edit.dataset.editQuiz);
      if (remove) deleteQuiz(remove.dataset.deleteQuiz);
    });

    document.getElementById("export-data").addEventListener("click", exportData);
    document.getElementById("import-trigger").addEventListener("click", () => document.getElementById("import-data").click());
    document.getElementById("import-data").addEventListener("change", importData);
    document.getElementById("reset-data").addEventListener("click", () => {
      if (!window.confirm("추가·수정한 모든 내용을 지우고 PDF 기본 데이터로 되돌릴까요?")) return;
      MedicalWordData.resetData();
      data = MedicalWordData.getData();
      resetMorphemeForm();
      resetQuizForm();
      renderAll();
      toast("기본 데이터로 초기화했습니다.");
    });
  }

  setupNavigation();
  setupEvents();
  renderAll();
})();
