"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchSharedContent, registerStudent } from "@/lib/content-api";
import { medicalWordData } from "@/lib/medical-data";

const TYPES = ["prefix", "root", "suffix"];
const LABELS = { prefix: "Prefix", root: "Root", suffix: "Suffix" };
const SLOT_HELP = {
  prefix: "상태·정도",
  root: "부위·물질",
  suffix: "질병·검사·처치"
};
const EMPTY_SELECTION = { prefix: "", root: "", suffix: "" };
const EMPTY_PROGRESS = { attempts: 0, correct: 0, streak: 0, mastered: [], attemptedQuizIds: [] };
const STUDENT_PROFILE_KEY = "medical-word-lab-student-v1";

function findMorpheme(data, id) {
  if (!id) return null;
  for (const type of TYPES) {
    const item = data.morphemes[type].find((entry) => entry.id === id);
    if (item) return { ...item, type };
  }
  return null;
}

function canonicalText(item) {
  return item?.text.split("/")[0].trim().replace(/[^a-z]/gi, "") || "";
}

function BlockBank({ data, query, onQueryChange, onSelect, mode }) {
  return (
    <>
      <div className="panel-header">
        <div>
          <h2>{mode === "quiz" ? "블록 보관함" : "전체 블록"}</h2>
          <p>{mode === "quiz" ? "클릭하거나 조립판으로 끌어 놓으세요." : "원하는 조합을 자유롭게 실험해 보세요."}</p>
        </div>
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={mode === "quiz" ? "블록 검색" : "뜻 또는 철자"}
          aria-label={`${mode === "quiz" ? "퀴즈" : "자유 조립"} 블록 검색`}
        />
      </div>
      <div className="bank-grid">
        {TYPES.map((type) => {
          const matches = data.morphemes[type].filter((item) =>
            [item.text, item.meaning, item.example].join(" ").toLowerCase().includes(query.toLowerCase())
          );
          return (
            <div className="bank-column" key={type}>
              <div className="bank-title">
                <span>{LABELS[type]}</span>
                <span className="count-badge">{matches.length}</span>
              </div>
              <div className="brick-list">
                {!matches.length && <div className="empty-message">검색 결과가 없습니다.</div>}
                {matches.map((item) => (
                  <button
                    className={`brick brick-${type}`}
                    draggable
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(type, item.id)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("application/json", JSON.stringify({ type, id: item.id }));
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                  >
                    <strong>{item.text}</strong>
                    <small>{item.meaning}</small>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AssemblyBoard({ data, selection, onSelect, lastPlaced, onClearPart, onWrongDrop }) {
  const [dragOver, setDragOver] = useState("");

  return (
    <div className="assembly-board" aria-label="의학용어 조립판">
      {TYPES.map((type) => {
        const item = findMorpheme(data, selection[type]);
        return (
          <div
            className={`slot${item ? " filled" : ""}${lastPlaced === type ? " just-filled" : ""}${dragOver === type ? " drag-over" : ""}`}
            key={type}
            onClick={() => item && onClearPart(type)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(type);
            }}
            onDragLeave={() => setDragOver("")}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver("");
              try {
                const payload = JSON.parse(event.dataTransfer.getData("application/json"));
                if (payload.type !== type) {
                  onWrongDrop(payload.type, type);
                  return;
                }
                onSelect(type, payload.id);
              } catch {
                onWrongDrop();
              }
            }}
          >
            {item ? (
              <div className={`slot-brick brick-${type}`} title="클릭하면 제거됩니다">
                <strong>{item.text}</strong>
                <small>{item.meaning}</small>
              </div>
            ) : (
              <span>{LABELS[type]}<br /><small>{SLOT_HELP[type]}</small></span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResultCard({ result }) {
  if (!result) return null;
  return (
    <article className={`result-card visible ${result.status || ""}`} aria-live="polite">
      <div className="result-kicker">{result.kicker}</div>
      <div className="result-term">{result.term}</div>
      {result.meaning && <div className="result-meaning">{result.meaning}</div>}
      {result.breakdown && <p className="result-breakdown">{result.breakdown}</p>}
      {(result.medicalData || result.aiTask || result.serviceUse) && (
        <div className="service-connection">
          <div className="service-flow-title">이 용어가 실제 의료 AI 서비스에서는?</div>
          <div className="service-flow">
            <div className="service-box data-box">
              <span className="service-icon">📊</span>
              <div><strong>의료데이터</strong><p>{result.medicalData || "등록된 데이터 설명이 없습니다."}</p></div>
            </div>
            <span className="flow-arrow" aria-hidden="true">→</span>
            <div className="service-box ai-task-box">
              <span className="service-icon">🤖</span>
              <div><strong>AI 기능</strong><p>{result.aiTask || "등록된 AI 기능이 없습니다."}</p></div>
            </div>
            <span className="flow-arrow" aria-hidden="true">→</span>
            <div className="service-box service-use-box">
              <span className="service-icon">📱</span>
              <div><strong>서비스 활용</strong><p>{result.serviceUse || "등록된 서비스 활용이 없습니다."}</p></div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Confetti({ burst }) {
  if (!burst) return <div className="celebration-layer" aria-hidden="true" />;
  const colors = ["#4aa8ff", "#f4b83f", "#ef6b72", "#16a394", "#9b6bdf", "#ff8f3d"];
  const pieces = Array.from({ length: 54 }, (_, index) => {
    const pseudo = (index * 47 + burst * 31) % 100;
    return {
      left: `${pseudo}%`,
      color: colors[index % colors.length],
      duration: `${1.8 + (index % 11) * 0.12}s`,
      drift: `${-90 + ((index * 37) % 180)}px`,
      rotation: `${(index * 67) % 360}deg`,
      delay: `${(index % 9) * 0.035}s`,
      round: index % 4 === 0
    };
  });
  return (
    <div className="celebration-layer" aria-hidden="true">
      {pieces.map((piece, index) => (
        <i
          className="confetti"
          key={`${burst}-${index}`}
          style={{
            left: piece.left,
            background: piece.color,
            "--duration": piece.duration,
            "--drift": piece.drift,
            "--rotation": piece.rotation,
            animationDelay: piece.delay,
            borderRadius: piece.round ? "50%" : undefined
          }}
        />
      ))}
    </div>
  );
}

export default function StudentApp() {
  const [data, setData] = useState(medicalWordData.defaultData);
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [tab, setTab] = useState("quiz");
  const [quizIndex, setQuizIndex] = useState(0);
  const [missionPulse, setMissionPulse] = useState(0);
  const [hint, setHint] = useState(false);
  const [quizSelection, setQuizSelection] = useState(EMPTY_SELECTION);
  const [freeSelection, setFreeSelection] = useState(EMPTY_SELECTION);
  const [quizSearch, setQuizSearch] = useState("");
  const [freeSearch, setFreeSearch] = useState("");
  const [dictionarySearch, setDictionarySearch] = useState("");
  const [quizResult, setQuizResult] = useState(null);
  const [freeResult, setFreeResult] = useState(null);
  const [lastPlaced, setLastPlaced] = useState({ quiz: "", free: "" });
  const [toast, setToast] = useState("");
  const [burst, setBurst] = useState(0);
  const [student, setStudent] = useState(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [showNicknameForm, setShowNicknameForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [nicknameError, setNicknameError] = useState("");

  useEffect(() => {
    // 개인 진도는 브라우저 전용 데이터이므로 hydration 이후 읽는다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(medicalWordData.getProgress());
    let active = true;
    fetchSharedContent()
      .then((result) => {
        if (active) setData(result.content);
      })
      .catch((error) => {
        console.warn("Neon 콘텐츠를 불러오지 못해 기본 데이터를 사용합니다.", error);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STUDENT_PROFILE_KEY);
    if (!saved) {
      // 첫 방문 여부는 브라우저 저장소 확인 후 결정한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowNicknameForm(true);
      return;
    }
    try {
      const profile = JSON.parse(saved);
      setStudent(profile);
      setNicknameDraft(profile.nickname || "");
      registerStudent(profile).catch((error) => {
        console.warn("학생 최근 접속 갱신 실패", error);
      });
    } catch {
      localStorage.removeItem(STUDENT_PROFILE_KEY);
      setShowNicknameForm(true);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const quiz = data.quizzes[quizIndex] || null;
  const accuracy = progress.attempts ? Math.round((progress.correct / progress.attempts) * 100) : 0;

  const hintText = useMemo(() => {
    if (!quiz) return "";
    return TYPES.map((type) => findMorpheme(data, quiz[`${type}Id`]))
      .filter(Boolean)
      .map((item) => `${LABELS[item.type]}: ${item.meaning}`)
      .join(" / ");
  }, [data, quiz]);

  function selectBlock(mode, type, id) {
    const setter = mode === "quiz" ? setQuizSelection : setFreeSelection;
    setter((current) => ({ ...current, [type]: id }));
    setLastPlaced((current) => ({ ...current, [mode]: type }));
    window.setTimeout(() => setLastPlaced((current) => ({ ...current, [mode]: "" })), 450);
    mode === "quiz" ? setQuizResult(null) : setFreeResult(null);
  }

  function clearPart(mode, type) {
    const setter = mode === "quiz" ? setQuizSelection : setFreeSelection;
    setter((current) => ({ ...current, [type]: "" }));
    mode === "quiz" ? setQuizResult(null) : setFreeResult(null);
  }

  function wrongDrop(source, target) {
    setToast(source && target ? `${LABELS[source]} 블록은 ${LABELS[target]} 칸에 놓을 수 없습니다.` : "블록을 다시 놓아주세요.");
  }

  function nextQuiz() {
    if (!data.quizzes.length) return;
    const attemptedIds = new Set(progress.attemptedQuizIds || []);
    const unattemptedIndexes = data.quizzes
      .map((item, index) => ({ id: item.id, index }))
      .filter((item) => !attemptedIds.has(item.id) && item.index !== quizIndex)
      .map((item) => item.index);
    const fallbackIndexes = data.quizzes
      .map((_, index) => index)
      .filter((index) => index !== quizIndex);
    const pool = unattemptedIndexes.length ? unattemptedIndexes : fallbackIndexes;
    const nextIndex = pool.length ? pool[Math.floor(Math.random() * pool.length)] : 0;
    setQuizIndex(nextIndex);
    setQuizSelection(EMPTY_SELECTION);
    setQuizResult(null);
    setHint(false);
    setMissionPulse((current) => current + 1);
  }

  function checkQuiz() {
    if (!quiz) return;
    const correct = TYPES.every((type) => (quizSelection[type] || "") === (quiz[`${type}Id`] || ""));
    const nextProgress = {
      ...progress,
      attempts: progress.attempts + 1,
      correct: progress.correct + (correct ? 1 : 0),
      streak: correct ? progress.streak + 1 : 0,
      mastered: correct && !progress.mastered.includes(quiz.id) ? [...progress.mastered, quiz.id] : progress.mastered,
      attemptedQuizIds: (progress.attemptedQuizIds || []).includes(quiz.id)
        ? (progress.attemptedQuizIds || [])
        : [...(progress.attemptedQuizIds || []), quiz.id]
    };
    setProgress(nextProgress);
    medicalWordData.saveProgress(nextProgress);

    if (correct) {
      setQuizResult({
        status: "success",
        kicker: "정답입니다 🎉",
        term: quiz.term,
        meaning: quiz.meaning,
        breakdown: quiz.explanation,
        medicalData: quiz.medicalData,
        aiTask: quiz.aiTask,
        serviceUse: quiz.serviceUse
      });
      setBurst((current) => current + 1);
      return;
    }

    const selected = TYPES.map((type) => findMorpheme(data, quizSelection[type]))
      .filter(Boolean)
      .map((item) => item.meaning)
      .join(" + ");
    setQuizResult({
      status: "error",
      kicker: "다시 조립해 보세요",
      term: selected || "선택된 블록이 없습니다",
      meaning: "문장의 상태·부위·사건을 나누어 보세요.",
      breakdown: "힌트가 필요하면 위의 ‘힌트 보기’를 눌러도 됩니다."
    });
  }

  function checkFree() {
    const match = data.quizzes.find((item) =>
      TYPES.every((type) => (freeSelection[type] || "") === (item[`${type}Id`] || ""))
    );
    if (match) {
      setFreeResult({
        status: "success",
        kicker: "표준 조합 ✨",
        term: match.term,
        meaning: match.meaning,
        breakdown: match.explanation,
        medicalData: match.medicalData,
        aiTask: match.aiTask,
        serviceUse: match.serviceUse
      });
      setBurst((current) => current + 1);
      return;
    }
    const parts = TYPES.map((type) => findMorpheme(data, freeSelection[type])).filter(Boolean);
    setFreeResult(parts.length ? {
      status: "",
      kicker: "구조 해석",
      term: parts.map(canonicalText).join(""),
      meaning: parts.map((item) => item.meaning).join(" + "),
      breakdown: "가능한 문자 조합입니다. 표준 의학용어 여부는 강의자 또는 의학 사전에서 확인하세요."
    } : {
      status: "error",
      kicker: "블록이 비어 있습니다",
      term: "먼저 블록을 선택하세요"
    });
  }

  async function submitNickname(event) {
    event.preventDefault();
    const nickname = nicknameDraft.trim();
    if (!nickname || nickname.length > 20) {
      setNicknameError("닉네임은 1~20자로 입력하세요.");
      return;
    }
    setIsRegistering(true);
    setNicknameError("");
    try {
      const id = student?.id || crypto.randomUUID();
      const result = await registerStudent({ id, nickname });
      setStudent(result.student);
      localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(result.student));
      setShowNicknameForm(false);
      setToast(student ? "닉네임을 변경했습니다." : "닉네임을 등록했습니다.");
    } catch (error) {
      setNicknameError(error.message);
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <>
      <div className="floating-decor decor-pill" aria-hidden="true">💊</div>
      <div className="floating-decor decor-heart" aria-hidden="true">💗</div>
      <div className="floating-decor decor-bandage" aria-hidden="true">🩹</div>
      <div className="floating-decor decor-sparkle" aria-hidden="true">✨</div>

      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          <span className="brand-text">Medical Word Lab</span>
        </Link>
        <nav className="top-actions" aria-label="주요 메뉴">
          <a className="top-link" href="#learn">학습하기</a>
          <Link className="top-link" href="/teacher">교사용 페이지</Link>
          {student && (
            <button className="student-nickname" onClick={() => {
              setNicknameDraft(student.nickname);
              setNicknameError("");
              setShowNicknameForm(true);
            }} type="button" title="닉네임 변경">
              <span aria-hidden="true">👤</span>
              {student.nickname}
            </button>
          )}
        </nav>
      </header>

      <main className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-sticker" aria-hidden="true">🩺</div>
            <p className="eyebrow">Medical terminology workshop</p>
            <h1>의학용어를<br /><span className="highlight-text">레고처럼 조립해요!</span></h1>
            <p>Prefix는 상태, Root는 신체 부위와 물질, Suffix는 질병·검사·처치를 설명합니다. 블록을 선택해 직접 조립해 보세요.</p>
            <div className="hero-legend" aria-label="블록 색상 안내">
              <span className="legend-prefix">앞 · Prefix</span>
              <span className="legend-root">몸통 · Root</span>
              <span className="legend-suffix">끝 · Suffix</span>
            </div>
          </div>
          <aside className="progress-card" aria-label="학습 현황">
            <div>
              <p className="eyebrow">My progress</p>
              <div className="score-number">{accuracy}<small>% 정답률</small></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${accuracy}%` }} /></div>
            </div>
            <div className="mini-stats">
              <div className="mini-stat"><strong>{progress.attempts}</strong><span>도전</span></div>
              <div className="mini-stat"><strong>{progress.correct}</strong><span>정답</span></div>
              <div className="mini-stat"><strong>{progress.streak}</strong><span>연속 정답</span></div>
            </div>
          </aside>
        </section>

        <div className="mode-tabs" id="learn" role="tablist" aria-label="학습 모드">
          {[
            ["quiz", "미션 퀴즈"],
            ["free", "자유 조립"],
            ["dictionary", "블록 사전"]
          ].map(([value, label]) => (
            <button className={`tab-button${tab === value ? " active" : ""}`} key={value} onClick={() => setTab(value)} type="button">
              {label}
            </button>
          ))}
        </div>

        {tab === "quiz" && (
          <section className="mode-panel active">
            <div className="workspace">
              <section className="panel">
                <BlockBank data={data} query={quizSearch} onQueryChange={setQuizSearch} onSelect={(type, id) => selectBlock("quiz", type, id)} mode="quiz" />
              </section>
              <section className="panel">
                <article className={`mission-card${missionPulse ? " new-mission" : ""}`} key={missionPulse}>
                  <div className="mission-heading">
                    <div className="mission-label">TODAY&apos;S MISSION</div>
                    <div className="mission-count">
                      푼 문제 {Math.min(progress.attemptedQuizIds?.length || 0, data.quizzes.length)} / 총 {data.quizzes.length}
                    </div>
                  </div>
                  <h3>{quiz?.prompt || "등록된 퀴즈가 없습니다."}</h3>
                  <div className="mission-meta">{hint ? `힌트 — ${hintText}` : "빈 칸은 사용하지 않아도 됩니다."}</div>
                  <div className="mission-actions">
                    <button className="secondary-button" onClick={() => setHint((current) => !current)} type="button">힌트 보기</button>
                    <button className="secondary-button" onClick={nextQuiz} type="button">다른 문제</button>
                  </div>
                </article>
                <AssemblyBoard
                  data={data}
                  selection={quizSelection}
                  onSelect={(type, id) => selectBlock("quiz", type, id)}
                  onClearPart={(type) => clearPart("quiz", type)}
                  onWrongDrop={wrongDrop}
                  lastPlaced={lastPlaced.quiz}
                />
                <button className="primary-button wide-button" onClick={checkQuiz} type="button">정답 확인</button>
                <ResultCard result={quizResult} />
              </section>
            </div>
          </section>
        )}

        {tab === "free" && (
          <section className="mode-panel active">
            <div className="workspace">
              <section className="panel">
                <BlockBank data={data} query={freeSearch} onQueryChange={setFreeSearch} onSelect={(type, id) => selectBlock("free", type, id)} mode="free" />
              </section>
              <section className="panel">
                <div className="panel-header">
                  <div><h2>자유 조립판</h2><p>등록된 퀴즈 조합이면 표준 용어와 뜻을 보여줍니다.</p></div>
                  <button className="secondary-button" onClick={() => { setFreeSelection(EMPTY_SELECTION); setFreeResult(null); }} type="button">비우기</button>
                </div>
                <AssemblyBoard
                  data={data}
                  selection={freeSelection}
                  onSelect={(type, id) => selectBlock("free", type, id)}
                  onClearPart={(type) => clearPart("free", type)}
                  onWrongDrop={wrongDrop}
                  lastPlaced={lastPlaced.free}
                />
                <button className="primary-button wide-button" onClick={checkFree} type="button">조합 해석하기</button>
                <ResultCard result={freeResult} />
              </section>
            </div>
          </section>
        )}

        {tab === "dictionary" && (
          <section className="mode-panel active">
            <section className="panel">
              <div className="panel-header">
                <div><h2>Prefix · Root · Suffix 사전</h2><p>강의 PDF 27–37페이지의 핵심 구성요소를 정리했습니다.</p></div>
              </div>
              <div className="dictionary-tools">
                <input className="search-input" type="search" value={dictionarySearch} onChange={(event) => setDictionarySearch(event.target.value)} placeholder="예: 심장, cardi, 염증" />
              </div>
              <div className="dictionary-grid">
                {TYPES.map((type) => {
                  const matches = data.morphemes[type].filter((item) =>
                    [item.text, item.meaning, item.example].join(" ").toLowerCase().includes(dictionarySearch.toLowerCase())
                  );
                  return (
                    <section className={`dictionary-section ${type}`} key={type}>
                      <h3>{LABELS[type]}</h3>
                      {!matches.length && <div className="empty-message">검색 결과 없음</div>}
                      {matches.map((item) => (
                        <div className="dictionary-item" key={item.id}>
                          <strong>{item.text}</strong><span>{item.meaning}</span><small>{item.example || "예시 없음"}</small>
                        </div>
                      ))}
                    </section>
                  );
                })}
              </div>
            </section>
          </section>
        )}
      </main>

      <Confetti burst={burst} />
      <div className={`toast${toast ? " visible" : ""}`} role="status">{toast}</div>
      {showNicknameForm && (
        <div className="nickname-overlay" role="dialog" aria-modal="true" aria-labelledby="nickname-title">
          <section className="nickname-card">
            <div className="nickname-illustration" aria-hidden="true">👋</div>
            <p className="eyebrow">Welcome to Medical Word Lab</p>
            <h2 id="nickname-title">{student ? "닉네임 변경" : "수업에 참여할게요!"}</h2>
            <p>수업에서 사용할 닉네임을 입력하세요.<br />이름 대신 별명을 사용해도 됩니다.</p>
            <form onSubmit={submitNickname}>
              <input
                className="form-control nickname-input"
                type="text"
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                placeholder="예: 심장박사"
                maxLength={20}
                autoFocus
                required
              />
              {nicknameError && <p className="auth-error" role="alert">{nicknameError}</p>}
              <button className="primary-button wide-button" disabled={isRegistering} type="submit">
                {isRegistering ? "등록 중…" : student ? "닉네임 저장" : "학습 시작하기"}
              </button>
              {student && (
                <button className="nickname-cancel" onClick={() => setShowNicknameForm(false)} type="button">취소</button>
              )}
            </form>
          </section>
        </div>
      )}
    </>
  );
}
