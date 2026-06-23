(function () {
  const TYPES = ["prefix", "root", "suffix"];
  const LABELS = { prefix: "Prefix", root: "Root", suffix: "Suffix" };
  let data = MedicalWordData.getData();
  let quiz = null;
  let quizSelection = emptySelection();
  let freeSelection = emptySelection();
  let lastPlaced = { quiz: "", free: "" };

  function emptySelection() {
    return { prefix: null, root: null, suffix: null };
  }

  function findMorpheme(id) {
    if (!id) return null;
    for (const type of TYPES) {
      const found = data.morphemes[type].find((item) => item.id === id);
      if (found) return { ...found, type };
    }
    return null;
  }

  function getCanonicalText(item) {
    return item ? item.text.split("/")[0].trim().replace(/[^a-z]/gi, "") : "";
  }

  function toast(message) {
    const element = document.getElementById("toast");
    element.textContent = message;
    element.classList.add("visible");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => element.classList.remove("visible"), 2200);
  }

  function renderBank(containerId, searchId, mode) {
    const container = document.getElementById(containerId);
    const query = document.getElementById(searchId).value.trim().toLowerCase();
    container.innerHTML = "";

    TYPES.forEach((type) => {
      const column = document.createElement("div");
      column.className = "bank-column";
      const matches = data.morphemes[type].filter((item) =>
        [item.text, item.meaning, item.example].join(" ").toLowerCase().includes(query)
      );
      column.innerHTML = `
        <div class="bank-title">
          <span>${LABELS[type]}</span>
          <span class="count-badge">${matches.length}</span>
        </div>
        <div class="brick-list"></div>`;
      const list = column.querySelector(".brick-list");
      if (!matches.length) {
        list.innerHTML = '<div class="empty-message">검색 결과가 없습니다.</div>';
      }
      matches.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `brick brick-${type}`;
        button.draggable = true;
        button.innerHTML = `<strong>${escapeHtml(item.text)}</strong><small>${escapeHtml(item.meaning)}</small>`;
        button.addEventListener("click", () => selectBlock(mode, type, item.id));
        button.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData("application/json", JSON.stringify({ type, id: item.id, mode }));
          event.dataTransfer.effectAllowed = "copy";
        });
        list.appendChild(button);
      });
      container.appendChild(column);
    });
  }

  function renderBoard(containerId, mode) {
    const board = document.getElementById(containerId);
    const selection = mode === "quiz" ? quizSelection : freeSelection;
    board.innerHTML = "";

    TYPES.forEach((type) => {
      const slot = document.createElement("div");
      const item = findMorpheme(selection[type]);
      const justFilled = lastPlaced[mode] === type;
      slot.className = `slot${item ? " filled" : ""}${justFilled ? " just-filled" : ""}`;
      slot.dataset.type = type;
      slot.innerHTML = item
        ? `<div class="slot-brick brick-${type}" title="클릭하면 제거됩니다"><strong>${escapeHtml(item.text)}</strong><small>${escapeHtml(item.meaning)}</small></div>`
        : `<span>${LABELS[type]}<br><small>${type === "prefix" ? "상태·정도" : type === "root" ? "부위·물질" : "질병·검사·처치"}</small></span>`;
      slot.addEventListener("click", () => {
        if (!selection[type]) return;
        selection[type] = null;
        hideResult(mode);
        renderBoard(containerId, mode);
      });
      slot.addEventListener("dragover", (event) => {
        event.preventDefault();
        slot.classList.add("drag-over");
      });
      slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        slot.classList.remove("drag-over");
        try {
          const payload = JSON.parse(event.dataTransfer.getData("application/json"));
          if (payload.type !== type) {
            toast(`${LABELS[payload.type]} 블록은 ${LABELS[type]} 칸에 놓을 수 없습니다.`);
            return;
          }
          selectBlock(mode, type, payload.id);
        } catch {
          toast("블록을 다시 놓아주세요.");
        }
      });
      board.appendChild(slot);
    });
    lastPlaced[mode] = "";
  }

  function selectBlock(mode, type, id) {
    const selection = mode === "quiz" ? quizSelection : freeSelection;
    selection[type] = id;
    lastPlaced[mode] = type;
    hideResult(mode);
    renderBoard(mode === "quiz" ? "quiz-board" : "free-board", mode);
  }

  function nextQuiz() {
    if (!data.quizzes.length) {
      quiz = null;
      document.getElementById("mission-prompt").textContent = "등록된 퀴즈가 없습니다.";
      document.getElementById("mission-meta").textContent = "교사용 페이지에서 퀴즈를 추가해 주세요.";
      return;
    }
    const pool = data.quizzes.filter((item) => !quiz || item.id !== quiz.id);
    quiz = pool[Math.floor(Math.random() * pool.length)] || data.quizzes[0];
    quizSelection = emptySelection();
    document.getElementById("mission-prompt").textContent = quiz.prompt;
    document.getElementById("mission-meta").textContent = "빈 칸은 사용하지 않아도 됩니다.";
    const missionCard = document.getElementById("mission-card");
    missionCard.classList.remove("new-mission");
    void missionCard.offsetWidth;
    missionCard.classList.add("new-mission");
    hideResult("quiz");
    renderBoard("quiz-board", "quiz");
  }

  function showHint() {
    if (!quiz) return;
    const parts = TYPES.map((type) => findMorpheme(quiz[`${type}Id`]))
      .filter(Boolean)
      .map((item) => `${LABELS[item.type]}: ${item.meaning}`);
    document.getElementById("mission-meta").textContent = parts.length
      ? `힌트 — ${parts.join(" / ")}`
      : "이 문제에는 조립 블록이 없습니다.";
  }

  function checkQuiz() {
    if (!quiz) return;
    const isCorrect = TYPES.every((type) => (quizSelection[type] || "") === (quiz[`${type}Id`] || ""));
    const progress = MedicalWordData.getProgress();
    progress.attempts += 1;

    if (isCorrect) {
      progress.correct += 1;
      progress.streak += 1;
      if (!progress.mastered.includes(quiz.id)) progress.mastered.push(quiz.id);
      showResult("quiz", "success", "정답입니다", quiz.term, quiz.meaning, quiz.explanation);
      celebrate();
    } else {
      progress.streak = 0;
      const selectedMeanings = TYPES.map((type) => findMorpheme(quizSelection[type]))
        .filter(Boolean)
        .map((item) => item.meaning)
        .join(" + ");
      showResult(
        "quiz",
        "error",
        "다시 조립해 보세요",
        selectedMeanings || "선택된 블록이 없습니다",
        "문장의 상태·부위·사건을 나누어 보세요.",
        "힌트가 필요하면 위의 ‘힌트 보기’를 눌러도 됩니다."
      );
    }
    MedicalWordData.saveProgress(progress);
    renderProgress();
  }

  function checkFree() {
    const match = data.quizzes.find((item) =>
      TYPES.every((type) => (freeSelection[type] || "") === (item[`${type}Id`] || ""))
    );
    if (match) {
      showResult("free", "success", "표준 조합", match.term, match.meaning, match.explanation);
      celebrate();
      return;
    }
    const parts = TYPES.map((type) => findMorpheme(freeSelection[type])).filter(Boolean);
    if (!parts.length) {
      showResult("free", "error", "블록이 비어 있습니다", "먼저 블록을 선택하세요", "", "");
      return;
    }
    const literal = parts.map(getCanonicalText).join("");
    const breakdown = parts.map((item) => item.meaning).join(" + ");
    showResult(
      "free",
      "",
      "구조 해석",
      literal,
      breakdown,
      "가능한 문자 조합입니다. 표준 의학용어 여부는 강의자 또는 의학 사전에서 확인하세요."
    );
  }

  function showResult(mode, status, kicker, term, meaning, breakdown) {
    const element = document.getElementById(`${mode}-result`);
    element.className = `result-card visible ${status}`;
    element.innerHTML = `
      <div class="result-kicker">${escapeHtml(kicker)}</div>
      <div class="result-term">${escapeHtml(term)}</div>
      ${meaning ? `<div class="result-meaning">${escapeHtml(meaning)}</div>` : ""}
      ${breakdown ? `<p class="result-breakdown">${escapeHtml(breakdown)}</p>` : ""}`;
  }

  function celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.getElementById("celebration-layer");
    const colors = ["#4aa8ff", "#f4b83f", "#ef6b72", "#16a394", "#9b6bdf", "#ff8f3d"];
    layer.innerHTML = "";
    for (let index = 0; index < 54; index += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--duration", `${1.8 + Math.random() * 1.6}s`);
      piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      piece.style.setProperty("--rotation", `${Math.random() * 360}deg`);
      piece.style.animationDelay = `${Math.random() * 0.32}s`;
      if (index % 4 === 0) piece.style.borderRadius = "50%";
      layer.appendChild(piece);
    }
    window.setTimeout(() => { layer.innerHTML = ""; }, 3600);
  }

  function hideResult(mode) {
    const element = document.getElementById(`${mode}-result`);
    element.className = "result-card";
    element.innerHTML = "";
  }

  function renderProgress() {
    const progress = MedicalWordData.getProgress();
    const accuracy = progress.attempts ? Math.round((progress.correct / progress.attempts) * 100) : 0;
    document.getElementById("accuracy").textContent = accuracy;
    document.getElementById("progress-fill").style.width = `${accuracy}%`;
    document.getElementById("attempt-count").textContent = progress.attempts;
    document.getElementById("correct-count").textContent = progress.correct;
    document.getElementById("streak-count").textContent = progress.streak;
  }

  function renderDictionary() {
    const query = document.getElementById("dictionary-search").value.trim().toLowerCase();
    const grid = document.getElementById("dictionary-grid");
    grid.innerHTML = "";
    TYPES.forEach((type) => {
      const section = document.createElement("section");
      section.className = `dictionary-section ${type}`;
      section.innerHTML = `<h3>${LABELS[type]}</h3>`;
      const matches = data.morphemes[type].filter((item) =>
        [item.text, item.meaning, item.example].join(" ").toLowerCase().includes(query)
      );
      if (!matches.length) section.insertAdjacentHTML("beforeend", '<div class="empty-message">검색 결과 없음</div>');
      matches.forEach((item) => {
        section.insertAdjacentHTML(
          "beforeend",
          `<div class="dictionary-item">
            <strong>${escapeHtml(item.text)}</strong>
            <span>${escapeHtml(item.meaning)}</span>
            <small>${escapeHtml(item.example || "예시 없음")}</small>
          </div>`
        );
      });
      grid.appendChild(section);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function setupTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("active"));
        document.querySelectorAll(".mode-panel").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(`panel-${button.dataset.tab}`).classList.add("active");
      });
    });
  }

  function init() {
    setupTabs();
    renderBank("quiz-bank", "quiz-search", "quiz");
    renderBank("free-bank", "free-search", "free");
    renderBoard("quiz-board", "quiz");
    renderBoard("free-board", "free");
    renderDictionary();
    renderProgress();
    nextQuiz();

    document.getElementById("quiz-search").addEventListener("input", () => renderBank("quiz-bank", "quiz-search", "quiz"));
    document.getElementById("free-search").addEventListener("input", () => renderBank("free-bank", "free-search", "free"));
    document.getElementById("dictionary-search").addEventListener("input", renderDictionary);
    document.getElementById("hint-button").addEventListener("click", showHint);
    document.getElementById("next-button").addEventListener("click", nextQuiz);
    document.getElementById("check-quiz").addEventListener("click", checkQuiz);
    document.getElementById("check-free").addEventListener("click", checkFree);
    document.getElementById("clear-free").addEventListener("click", () => {
      freeSelection = emptySelection();
      hideResult("free");
      renderBoard("free-board", "free");
    });
  }

  init();
})();
