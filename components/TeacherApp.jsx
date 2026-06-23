"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchSharedContent,
  fetchStudentStats,
  removeMorpheme,
  removeQuiz,
  saveMorpheme as saveMorphemeRequest,
  saveQuiz as saveQuizRequest,
  saveSharedContent,
  verifyAdminKey
} from "@/lib/content-api";
import { medicalWordData } from "@/lib/medical-data";

const TYPES = ["prefix", "root", "suffix"];
const LABELS = { prefix: "Prefix", root: "Root", suffix: "Suffix" };
const EMPTY_MORPHEME = { id: "", type: "prefix", text: "", meaning: "", example: "" };
const EMPTY_QUIZ = {
  id: "",
  prompt: "",
  prefixId: "",
  rootId: "",
  suffixId: "",
  term: "",
  meaning: "",
  explanation: "",
  medicalData: "",
  aiTask: "",
  serviceUse: ""
};

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function TeacherApp() {
  const [data, setData] = useState(medicalWordData.defaultData);
  const [section, setSection] = useState("overview");
  const [morpheme, setMorpheme] = useState(EMPTY_MORPHEME);
  const [quiz, setQuiz] = useState(EMPTY_QUIZ);
  const [morphemeQuery, setMorphemeQuery] = useState("");
  const [morphemeType, setMorphemeType] = useState("all");
  const [quizQuery, setQuizQuery] = useState("");
  const [toast, setToast] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [authStatus, setAuthStatus] = useState("checking");
  const [authError, setAuthError] = useState("");
  const [dbStatus, setDbStatus] = useState("loading");
  const [isSaving, setIsSaving] = useState(false);
  const [studentStats, setStudentStats] = useState({ total: 0, activeWeek: 0 });

  useEffect(() => {
    const savedKey = sessionStorage.getItem("medical-word-lab-admin-key") || "";
    if (!savedKey) {
      // 브라우저 세션 전용 값이므로 hydration 이후 잠금 상태를 결정한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthStatus("locked");
      return;
    }
    verifyAdminKey(savedKey)
      .then(() => {
        setAdminKey(savedKey);
        setAuthStatus("unlocked");
      })
      .catch(() => {
        sessionStorage.removeItem("medical-word-lab-admin-key");
        setAuthStatus("locked");
      });
  }, []);

  useEffect(() => {
    if (authStatus !== "unlocked") return;
    let active = true;
    Promise.all([fetchSharedContent(), fetchStudentStats(adminKey)])
      .then(([result, stats]) => {
        if (!active) return;
        setData(result.content);
        setStudentStats(stats);
        setDbStatus("connected");
      })
      .catch((error) => {
        console.warn("Neon 콘텐츠 로드 실패", error);
        if (active) setDbStatus("offline");
      });
    return () => { active = false; };
  }, [authStatus, adminKey]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const morphemeItems = useMemo(() => TYPES
    .flatMap((type) => data.morphemes[type].map((item) => ({ ...item, type })))
    .filter((item) => morphemeType === "all" || item.type === morphemeType)
    .filter((item) => [item.text, item.meaning, item.example].join(" ").toLowerCase().includes(morphemeQuery.toLowerCase())),
  [data, morphemeQuery, morphemeType]);

  const quizItems = useMemo(() => data.quizzes.filter((item) =>
    [item.prompt, item.term, item.meaning, item.explanation].join(" ").toLowerCase().includes(quizQuery.toLowerCase())
  ), [data, quizQuery]);

  async function unlockTeacherPage(event) {
    event.preventDefault();
    setAuthError("");
    setAuthStatus("checking");
    try {
      await verifyAdminKey(adminKey);
      sessionStorage.setItem("medical-word-lab-admin-key", adminKey);
      setAuthStatus("unlocked");
    } catch (error) {
      setAuthError(error.message);
      setAuthStatus("locked");
    }
  }

  function logoutTeacherPage() {
    sessionStorage.removeItem("medical-word-lab-admin-key");
    setAdminKey("");
    setAuthError("");
    setAuthStatus("locked");
  }

  async function persist(nextData, message) {
    setIsSaving(true);
    try {
      const result = await saveSharedContent(nextData, adminKey);
      setData(result.content);
      setDbStatus("connected");
      setToast(message);
      return true;
    } catch (error) {
      setDbStatus("offline");
      setToast(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function runMutation(action, message) {
    setIsSaving(true);
    try {
      const result = await action();
      setData(result.content);
      setDbStatus("connected");
      setToast(message);
      return true;
    } catch (error) {
      setDbStatus("offline");
      setToast(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function partText(id) {
    if (!id) return "없음";
    for (const type of TYPES) {
      const found = data.morphemes[type].find((item) => item.id === id);
      if (found) return found.text;
    }
    return "삭제된 블록";
  }

  async function saveMorpheme(event) {
    event.preventDefault();
    const item = {
      id: morpheme.id || makeId(morpheme.type),
      type: morpheme.type,
      text: morpheme.text.trim(),
      meaning: morpheme.meaning.trim(),
      example: morpheme.example.trim()
    };
    const saved = await runMutation(
      () => saveMorphemeRequest(item, adminKey),
      morpheme.id ? "구성요소를 수정했습니다." : "구성요소를 추가했습니다."
    );
    if (saved) setMorpheme(EMPTY_MORPHEME);
  }

  async function deleteMorpheme(type, id) {
    const usedCount = data.quizzes.filter((item) => TYPES.some((part) => item[`${part}Id`] === id)).length;
    const message = usedCount
      ? `이 블록을 사용하는 퀴즈 ${usedCount}개도 함께 삭제됩니다. 계속할까요?`
      : "이 구성요소를 삭제할까요?";
    if (!window.confirm(message)) return;
    await runMutation(() => removeMorpheme(id, adminKey), "구성요소를 삭제했습니다.");
  }

  async function saveQuiz(event) {
    event.preventDefault();
    if (!quiz.prefixId && !quiz.rootId && !quiz.suffixId) {
      setToast("정답 구성요소를 하나 이상 선택하세요.");
      return;
    }
    const item = {
      ...quiz,
      id: quiz.id || makeId("quiz"),
      prompt: quiz.prompt.trim(),
      term: quiz.term.trim(),
      meaning: quiz.meaning.trim(),
      explanation: quiz.explanation.trim()
    };
    const saved = await runMutation(
      () => saveQuizRequest(item, adminKey),
      quiz.id ? "퀴즈를 수정했습니다." : "퀴즈를 추가했습니다."
    );
    if (saved) setQuiz(EMPTY_QUIZ);
  }

  async function deleteQuiz(id) {
    if (!window.confirm("이 퀴즈를 삭제할까요?")) return;
    await runMutation(() => removeQuiz(id, adminKey), "퀴즈를 삭제했습니다.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medical-word-lab-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("수업 데이터를 내보냈습니다.");
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.morphemes || !parsed.quizzes || !TYPES.every((type) => Array.isArray(parsed.morphemes[type]))) {
        throw new Error("Invalid schema");
      }
      await persist(parsed, "수업 데이터를 가져왔습니다.");
    } catch {
      setToast("올바른 Medical Word Lab JSON 파일이 아닙니다.");
    }
    event.target.value = "";
  }

  if (authStatus !== "unlocked") {
    return (
      <>
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark">M</span>
            <span className="brand-text">Medical Word Lab · Teacher</span>
          </Link>
          <nav className="top-actions"><Link className="top-link" href="/">학생 페이지로 돌아가기</Link></nav>
        </header>
        <main className="teacher-lock-page">
          <section className="teacher-lock-card">
            <div className="lock-illustration" aria-hidden="true">🔐</div>
            <p className="eyebrow">Teacher only</p>
            <h1>교사용 페이지</h1>
            <p>수업 콘텐츠를 관리하려면 교사용 코드를 입력하세요.</p>
            <form onSubmit={unlockTeacherPage}>
              <label className="form-group" htmlFor="teacher-entry-code">
                <span>교사용 코드</span>
                <input
                  className="form-control teacher-code-input"
                  id="teacher-entry-code"
                  type="password"
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  placeholder="관리 코드를 입력하세요"
                  autoComplete="current-password"
                  autoFocus
                  required
                />
              </label>
              {authError && <p className="auth-error" role="alert">{authError}</p>}
              <button className="primary-button wide-button" disabled={authStatus === "checking"} type="submit">
                {authStatus === "checking" ? "확인 중…" : "교사용 페이지 열기"}
              </button>
            </form>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          <span className="brand-text">Medical Word Lab · Teacher</span>
        </Link>
        <nav className="top-actions"><Link className="top-link" href="/">학생 페이지 보기</Link></nav>
      </header>

      <main className="page-shell">
        <section className="hero-copy teacher-hero">
          <p className="eyebrow">Teacher workspace</p>
          <h1>수업 콘텐츠 관리</h1>
          <p>접두사·어근·접미사와 조립 퀴즈를 추가하거나 수정할 수 있습니다.</p>
        </section>

        <div className={`notice db-notice ${dbStatus}`}>
          <div>
            <strong>{dbStatus === "connected" ? "● Neon 연결됨" : dbStatus === "loading" ? "● Neon 연결 확인 중" : "● Neon 연결 안 됨"}</strong>
            <span>{dbStatus === "connected" ? " 변경 내용이 모든 학생에게 공유됩니다." : " 환경변수와 DB 초기화를 확인하세요."}</span>
          </div>
          <button className="secondary-button" onClick={logoutTeacherPage} type="button">교사용 페이지 잠그기</button>
        </div>

        <div className="teacher-layout">
          <nav className="panel teacher-nav" aria-label="교사용 메뉴">
            {[["overview", "현황"], ["morphemes", "구성요소 관리"], ["quizzes", "퀴즈 관리"], ["data", "백업 및 복원"]].map(([value, label]) => (
              <button className={section === value ? "active" : ""} key={value} onClick={() => setSection(value)} type="button">{label}</button>
            ))}
          </nav>

          <div>
            {section === "overview" && (
              <section className="teacher-section active">
                <div className="summary-cards">
                  {[
                    ["Prefix", data.morphemes.prefix.length],
                    ["Root", data.morphemes.root.length],
                    ["Suffix", data.morphemes.suffix.length],
                    ["Quiz", data.quizzes.length],
                    ["학생", studentStats.total]
                  ].map(([label, count]) => (
                    <div className="summary-card" key={label}><strong>{count}</strong><span>{label} 등록</span></div>
                  ))}
                </div>
                <p className="student-stat-note">최근 7일 접속 학생: {studentStats.activeWeek}명</p>
                <section className="panel">
                  <div className="panel-header"><div><h2>운영 안내</h2><p>수업 전 아래 순서로 점검하세요.</p></div></div>
                  <ol>
                    <li>필요한 Prefix, Root, Suffix를 등록합니다.</li>
                    <li>문제와 정답 조합, 완성 용어를 지정합니다.</li>
                    <li>학생 페이지에서 퀴즈가 의도대로 출제되는지 확인합니다.</li>
                    <li>수업 데이터를 JSON으로 백업합니다.</li>
                  </ol>
                </section>
              </section>
            )}

            {section === "morphemes" && (
              <section className="teacher-section active">
                <section className="panel">
                  <div className="panel-header"><div><h2>구성요소 추가·수정</h2><p>수정할 항목은 아래 목록에서 ‘수정’을 누르세요.</p></div></div>
                  <form onSubmit={saveMorpheme}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="morpheme-type">분류</label>
                        <select className="form-control" disabled={Boolean(morpheme.id)} id="morpheme-type" value={morpheme.type} onChange={(event) => setMorpheme({ ...morpheme, type: event.target.value })}>
                          {TYPES.map((type) => <option value={type} key={type}>{LABELS[type]}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="morpheme-text">표기</label>
                        <input className="form-control" id="morpheme-text" required value={morpheme.text} onChange={(event) => setMorpheme({ ...morpheme, text: event.target.value })} placeholder="예: hyper" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="morpheme-meaning">의미</label>
                        <input className="form-control" id="morpheme-meaning" required value={morpheme.meaning} onChange={(event) => setMorpheme({ ...morpheme, meaning: event.target.value })} placeholder="예: 높은, 과도한" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="morpheme-example">예시</label>
                        <input className="form-control" id="morpheme-example" value={morpheme.example} onChange={(event) => setMorpheme({ ...morpheme, example: event.target.value })} placeholder="예: hyperglycemia" />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "저장 중…" : "저장"}</button>
                      <button className="secondary-button" onClick={() => setMorpheme(EMPTY_MORPHEME)} type="button">입력 초기화</button>
                    </div>
                  </form>
                  <div className="dictionary-tools teacher-filter">
                    <input className="search-input" type="search" value={morphemeQuery} onChange={(event) => setMorphemeQuery(event.target.value)} placeholder="구성요소 검색" />
                    <select className="form-control narrow-control" value={morphemeType} onChange={(event) => setMorphemeType(event.target.value)}>
                      <option value="all">전체 분류</option>
                      {TYPES.map((type) => <option value={type} key={type}>{LABELS[type]}</option>)}
                    </select>
                  </div>
                  <div className="management-list">
                    {morphemeItems.map((item) => (
                      <div className="management-item" key={item.id}>
                        <div><span className="count-badge">{LABELS[item.type]}</span> <span className="term-value">{item.text}</span></div>
                        <div className="muted">{item.meaning}</div>
                        <div className="muted">{item.example || "예시 없음"}</div>
                        <div className="item-actions">
                          <button className="icon-button" onClick={() => { setMorpheme(item); window.scrollTo({ top: 0, behavior: "smooth" }); }} type="button">수정</button>
                          <button className="icon-button" onClick={() => deleteMorpheme(item.type, item.id)} type="button">삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </section>
            )}

            {section === "quizzes" && (
              <section className="teacher-section active">
                <section className="panel">
                  <div className="panel-header"><div><h2>퀴즈 추가·수정</h2><p>사용하지 않는 구성요소 칸은 ‘없음’으로 두세요.</p></div></div>
                  <form onSubmit={saveQuiz}>
                    <div className="form-grid">
                      <div className="form-group full">
                        <label htmlFor="quiz-prompt">문제</label>
                        <textarea className="form-control" id="quiz-prompt" rows="3" required value={quiz.prompt} onChange={(event) => setQuiz({ ...quiz, prompt: event.target.value })} />
                      </div>
                      {TYPES.map((type) => (
                        <div className="form-group" key={type}>
                          <label htmlFor={`quiz-${type}`}>{LABELS[type]} 정답</label>
                          <select className="form-control" id={`quiz-${type}`} value={quiz[`${type}Id`]} onChange={(event) => setQuiz({ ...quiz, [`${type}Id`]: event.target.value })}>
                            <option value="">없음</option>
                            {data.morphemes[type].map((item) => <option value={item.id} key={item.id}>{item.text} — {item.meaning}</option>)}
                          </select>
                        </div>
                      ))}
                      <div className="form-group"><label htmlFor="quiz-term">완성 용어</label><input className="form-control" id="quiz-term" required value={quiz.term} onChange={(event) => setQuiz({ ...quiz, term: event.target.value })} /></div>
                      <div className="form-group"><label htmlFor="quiz-meaning">한국어 뜻</label><input className="form-control" id="quiz-meaning" required value={quiz.meaning} onChange={(event) => setQuiz({ ...quiz, meaning: event.target.value })} /></div>
                      <div className="form-group"><label htmlFor="quiz-explanation">구조 설명</label><input className="form-control" id="quiz-explanation" value={quiz.explanation} onChange={(event) => setQuiz({ ...quiz, explanation: event.target.value })} /></div>
                      <div className="form-group full service-form-title">의료 AI 서비스 연결</div>
                      <div className="form-group">
                        <label htmlFor="quiz-medical-data">📊 연관 의료데이터</label>
                        <textarea className="form-control" id="quiz-medical-data" rows="3" value={quiz.medicalData || ""} onChange={(event) => setQuiz({ ...quiz, medicalData: event.target.value })} placeholder="예: ECG 심전도, 웨어러블 심박수" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="quiz-ai-task">🤖 AI 기능</label>
                        <textarea className="form-control" id="quiz-ai-task" rows="3" value={quiz.aiTask || ""} onChange={(event) => setQuiz({ ...quiz, aiTask: event.target.value })} placeholder="예: 부정맥 탐지와 이상 신호 분류" />
                      </div>
                      <div className="form-group full">
                        <label htmlFor="quiz-service-use">📱 실제 서비스 활용</label>
                        <textarea className="form-control" id="quiz-service-use" rows="2" value={quiz.serviceUse || ""} onChange={(event) => setQuiz({ ...quiz, serviceUse: event.target.value })} placeholder="예: 스마트워치 심장 알림, 원격 모니터링" />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "저장 중…" : "저장"}</button>
                      <button className="secondary-button" onClick={() => setQuiz(EMPTY_QUIZ)} type="button">입력 초기화</button>
                    </div>
                  </form>
                  <div className="dictionary-tools teacher-filter">
                    <input className="search-input" type="search" value={quizQuery} onChange={(event) => setQuizQuery(event.target.value)} placeholder="문제, 용어, 뜻 검색" />
                  </div>
                  <div className="management-list">
                    {quizItems.map((item) => (
                      <div className="management-item quiz-item" key={item.id}>
                        <div><span className="term-value">{item.term}</span><div className="muted">{item.prompt}</div></div>
                        <div className="muted">{item.meaning}</div>
                        <div className="muted">{[item.prefixId, item.rootId, item.suffixId].map(partText).join(" + ")}</div>
                        <div className="item-actions">
                          <button className="icon-button" onClick={() => { setQuiz(item); window.scrollTo({ top: 0, behavior: "smooth" }); }} type="button">수정</button>
                          <button className="icon-button" onClick={() => deleteQuiz(item.id)} type="button">삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </section>
            )}

            {section === "data" && (
              <section className="teacher-section active">
                <section className="panel">
                  <div className="panel-header"><div><h2>데이터 백업 및 복원</h2><p>다른 컴퓨터나 브라우저로 수업 콘텐츠를 옮길 때 사용합니다.</p></div></div>
                  <div className="data-actions">
                    <button className="primary-button" onClick={exportData} type="button">JSON 내보내기</button>
                    <label className="secondary-button import-label">JSON 가져오기<input className="file-input" type="file" accept="application/json,.json" onChange={importData} /></label>
                    <button className="danger-button" disabled={isSaving} onClick={async () => {
                      if (!window.confirm("추가·수정한 모든 내용을 지우고 PDF 기본 데이터로 되돌릴까요?")) return;
                      const saved = await persist(medicalWordData.defaultData, "DB를 기본 데이터로 초기화했습니다.");
                      if (saved) {
                        setMorpheme(EMPTY_MORPHEME);
                        setQuiz(EMPTY_QUIZ);
                      }
                    }} type="button">PDF 기본 데이터로 초기화</button>
                  </div>
                </section>
              </section>
            )}
          </div>
        </div>
      </main>
      <div className={`toast${toast ? " visible" : ""}`} role="status">{toast}</div>
    </>
  );
}
