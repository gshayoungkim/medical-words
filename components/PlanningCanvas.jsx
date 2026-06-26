"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const PURPOSE_OPTIONS = [
  "예방",
  "진단 보조",
  "치료 보조",
  "예후 관리",
  "생활습관 관리",
  "행정/문서 자동화",
  "기타"
];

const AI_ROLE_OPTIONS = ["탐지", "분류", "예측", "요약", "추천", "생성", "모니터링", "알림"];

const EMPTY_FORM = {
  serviceName: "",
  primaryUser: "",
  stakeholder: "",
  service: "",
  condition: "",
  medicalTerms: "",
  dataIn: "",
  aiTask: "",
  productOut: "",
  purpose: "생활습관 관리",
  aiRoles: [],
  includeWarning: true
};

const STEPS = [
  {
    key: "service",
    label: "서비스",
    question: "무엇을 만들어 제공하는가?",
    placeholder: "예) 사용자의 흡연 욕구와 스트레스 상태를 기록하고, 재흡연 위험이 높아질 때 알림과 대처 방법을 제공하는 앱"
  },
  {
    key: "condition",
    label: "질환/상태",
    question: "어떤 질환, 상태, 증상, 위험요인, 생활습관 문제를 다루는가?",
    placeholder: "예) 니코틴 의존, 금단증상, 스트레스, 재흡연 위험"
  },
  {
    key: "medicalTerms",
    label: "의학 용어",
    question: "이해에 필요한 핵심 의학용어는 무엇인가?",
    placeholder: "예) 니코틴 의존, craving, withdrawal symptom, relapse, 금단증상"
  },
  {
    key: "dataIn",
    label: "데이터 IN",
    question: "어떤 의료데이터 또는 라이프로그가 들어가는가?",
    placeholder: "예) 흡연량, 흡연 욕구 점수, 스트레스 점수, 수면 시간, 심박수, 앱 사용 기록"
  },
  {
    key: "aiTask",
    label: "AI task",
    question: "AI는 무엇을 탐지, 분류, 예측, 요약, 추천하는가?",
    placeholder: "예) 재흡연 위험 예측, 고위험 상황 분류, 개인화 메시지 추천"
  },
  {
    key: "productOut",
    label: "제품 OUT",
    question: "결과가 어떤 화면, 알림, 리포트, 행동 제안으로 나오는가?",
    placeholder: "예) 위험 점수, 알림, 오늘의 대처 전략, 주간 리포트, 상담사 공유용 요약"
  }
];

const EXAMPLES = [
  {
    name: "금연 AI 코치",
    data: {
      serviceName: "금연 실패 위험을 알려주는 AI 코치",
      primaryUser: "금연을 시도하는 20~40대 직장인",
      stakeholder: "보건소 금연 상담사",
      service: "사용자의 흡연 욕구, 스트레스, 수면 상태를 기록하고 재흡연 위험이 높아질 때 알림과 대처 전략을 제공하는 앱",
      condition: "니코틴 의존, 금단증상, 스트레스, 재흡연 위험",
      medicalTerms: "니코틴 의존, craving, withdrawal symptom, relapse, 금단증상",
      dataIn: "하루 흡연량, 흡연 욕구 점수, 스트레스 점수, 수면 시간, 심박수, 앱 기록",
      aiTask: "재흡연 위험 예측, 고위험 상황 분류, 개인화 메시지 추천",
      productOut: "위험 점수, 알림, 오늘의 대처 전략, 주간 리포트, 상담사 공유용 요약",
      purpose: "생활습관 관리",
      aiRoles: ["예측", "분류", "추천", "알림"],
      includeWarning: true
    }
  },
  {
    name: "혈당 관리 앱",
    data: {
      serviceName: "식후 혈당 변화를 예측하는 AI 혈당 코치",
      primaryUser: "당뇨 전단계 또는 제2형 당뇨병 환자",
      stakeholder: "의료진, 영양상담사",
      service: "연속혈당측정기와 식사 기록을 바탕으로 식후 혈당 상승 위험을 알려주고 식사 선택을 돕는 앱",
      condition: "당뇨병, 당뇨 전단계, 고혈당, 저혈당, 대사증후군",
      medicalTerms: "혈당, HbA1c, hyperglycemia, hypoglycemia, CGM, postprandial glucose",
      dataIn: "연속혈당측정값, 식사 사진, 탄수화물 섭취량, 운동량, 수면 시간",
      aiTask: "식후 혈당 상승 예측, 식사 패턴 분류, 개인화 코칭 추천",
      productOut: "혈당 예측 그래프, 식사 알림, 위험 알림, 주간 혈당 리포트",
      purpose: "생활습관 관리",
      aiRoles: ["예측", "추천", "모니터링", "알림"],
      includeWarning: true
    }
  },
  {
    name: "병동 악화 예측",
    data: {
      serviceName: "입원환자 급성 악화 위험 알림 시스템",
      primaryUser: "병동 간호사와 담당 의사",
      stakeholder: "신속대응팀, 환자안전팀",
      service: "입원환자의 활력징후와 검사결과를 바탕으로 급성 악화 위험을 예측하고 고위험 환자를 우선 확인하도록 돕는 시스템",
      condition: "급성 상태악화, 패혈증, 심정지 위험, 호흡부전",
      medicalTerms: "vital sign, blood pressure, respiratory rate, oxygen saturation, sepsis, cardiac arrest",
      dataIn: "혈압, 맥박, 호흡수, 체온, 산소포화도, 혈액검사, 의식상태, 입원기록",
      aiTask: "급성 악화 위험 예측, 고위험 환자 분류, 알림 우선순위 추천",
      productOut: "위험 점수, 고위험 환자 리스트, 알림, 환자별 근거 요약, 대응 체크리스트",
      purpose: "예후 관리",
      aiRoles: ["예측", "분류", "요약", "알림"],
      includeWarning: true
    }
  }
];

function valueOrDefault(value, fallback) {
  return value.trim() || fallback;
}

function generateDraft(form) {
  const serviceName = valueOrDefault(form.serviceName, "나의 의료 AI 서비스");
  const primaryUser = valueOrDefault(form.primaryUser, "서비스 사용자");
  const stakeholder = form.stakeholder.trim();
  const condition = valueOrDefault(form.condition, "특정 건강 문제");
  const medicalTerms = valueOrDefault(form.medicalTerms, "핵심 의학용어");
  const dataIn = valueOrDefault(form.dataIn, "의료데이터 또는 라이프로그");
  const aiTask = valueOrDefault(form.aiTask, "위험 예측, 분류, 요약 또는 추천");
  const productOut = valueOrDefault(form.productOut, "화면, 알림, 리포트 또는 행동 제안");
  const service = valueOrDefault(form.service, `${primaryUser}가 ${condition}을 더 쉽게 이해하고 관리하도록 돕는 서비스`);
  const purposeLine = form.purpose ? `서비스 목적은 ${form.purpose}입니다.` : "서비스 목적은 수업에서 정한 목적에 따라 구체화할 수 있습니다.";
  const roleLine = form.aiRoles.length ? `선택한 AI 역할은 ${form.aiRoles.join(", ")}입니다.` : "AI 역할은 탐지, 분류, 예측, 요약, 추천 중에서 구체화할 수 있습니다.";
  const stakeholderLine = stakeholder
    ? `${stakeholder}도 서비스 결과를 참고할 수 있습니다.`
    : "필요한 경우 의료진, 상담자, 보호자도 서비스 결과를 참고할 수 있습니다.";
  const assistiveLine = form.includeWarning
    ? "\n\n이때 AI는 의료진의 판단을 대체하는 것이 아니라, 위험 신호를 빠르게 파악하거나 사용자의 행동을 돕는 보조 도구로 사용됩니다."
    : "";
  const warningSection = form.includeWarning
    ? `\n## 8. 주의할 점\n이 서비스는 진단을 확정하거나 치료를 결정하는 도구가 아닙니다.\n실제 진단, 치료, 약물 조정, 응급 판단은 반드시 의료진의 판단이 필요합니다.`
    : "";

  return `# ${serviceName}
## 한 줄 소개
${primaryUser}를 위한 의료 AI 서비스입니다. 이 서비스는 ${condition}와 관련된 문제를 다루며, ${aiTask}를 통해 ${productOut}을 제공합니다.

## 1. 해결하려는 문제
이 서비스는 ${condition}와 관련된 문제를 가진 사용자를 대상으로 합니다.
현재 사용자는 자신의 상태를 지속적으로 파악하거나, 위험 신호를 제때 알아차리기 어렵습니다.
따라서 이 서비스는 사용자의 상태를 데이터로 기록하고, 필요한 순간에 적절한 정보를 제공하는 것을 목표로 합니다.

## 2. 주 사용자
주 사용자는 ${primaryUser}입니다.
${stakeholderLine}

## 3. 필요한 의료 지식
이 서비스를 이해하기 위해 필요한 핵심 의학용어는 다음과 같습니다.

${medicalTerms}

이 용어들은 사용자의 건강 상태, 위험요인, 증상 또는 관리 목표를 설명하는 데 사용됩니다.

## 4. 입력 데이터
서비스에는 다음과 같은 데이터가 입력됩니다.

${dataIn}

이 데이터는 사용자의 상태를 이해하고, AI가 판단을 보조하기 위한 기초 자료로 활용됩니다.

## 5. AI의 역할
AI는 입력된 데이터를 바탕으로 다음 역할을 수행합니다.

${aiTask}

${purposeLine}
${roleLine}${assistiveLine}

## 6. 제품 결과
사용자는 최종적으로 다음과 같은 결과를 받습니다.

${productOut}

결과는 화면, 알림, 리포트, 점수, 행동 제안 등의 형태로 제공될 수 있습니다.

## 7. 기대 효과
이 서비스는 사용자가 자신의 건강 상태를 더 쉽게 이해하고, 필요한 행동을 더 빠르게 선택하도록 돕습니다.
또한 의료진이나 상담자가 참고할 수 있는 요약 정보를 제공하여 의사소통을 보조할 수 있습니다.

## 서비스 개요 메모
${service}${warningSection}
`;
}

function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function PlanningCanvas() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedExample, setSelectedExample] = useState("0");
  const [toast, setToast] = useState("");
  const draft = useMemo(() => generateDraft(form), [form]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAiRole(role) {
    setForm((current) => ({
      ...current,
      aiRoles: current.aiRoles.includes(role)
        ? current.aiRoles.filter((item) => item !== role)
        : [...current.aiRoles, role]
    }));
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2200);
  }

  function loadSelectedExample() {
    const example = EXAMPLES[Number(selectedExample)] || EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setForm(example.data);
    showToast(`${example.name} 예시를 불러왔습니다.`);
  }

  function loadRandomExample() {
    const index = Math.floor(Math.random() * EXAMPLES.length);
    setSelectedExample(String(index));
    setForm(EXAMPLES[index].data);
    showToast(`${EXAMPLES[index].name} 예시를 불러왔습니다.`);
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      showToast("기획서 초안을 복사했습니다.");
    } catch {
      showToast("복사 권한이 없어 직접 선택해 복사하세요.");
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    showToast("캔버스를 초기화했습니다.");
  }

  function handleDownload() {
    const safeName = valueOrDefault(form.serviceName, "나의 의료 AI 서비스").replace(/[\\/:*?"<>|]/g, "_");
    downloadMarkdown(`${safeName}-기획서-초안.md`, draft);
    showToast("마크다운 파일을 다운로드했습니다.");
  }

  return (
    <>
      <div className="floating-decor decor-pill" aria-hidden="true">🧠</div>
      <div className="floating-decor decor-heart" aria-hidden="true">📝</div>
      <div className="floating-decor decor-bandage" aria-hidden="true">📊</div>
      <div className="floating-decor decor-sparkle" aria-hidden="true">✨</div>

      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          <span className="brand-text">Medical Word Lab · OUTRO</span>
        </Link>
        <nav className="top-actions" aria-label="주요 메뉴">
          <Link className="top-link" href="/">의학용어 조립기로 돌아가기</Link>
          <Link className="top-link" href="/teacher">교사용 페이지</Link>
        </nav>
      </header>

      <main className="page-shell planning-shell">
        <section className="planning-hero">
          <div className="hero-copy planning-hero-copy">
            <div className="hero-sticker" aria-hidden="true">🧩</div>
            <p className="eyebrow">OUTRO ACTIVITY</p>
            <h1>OUTRO. 의료 AI 서비스 6단계 기획 캔버스</h1>
            <p className="planning-subtitle">서비스를 보고 끝내지 말고, 직접 하나 설계해보기</p>
            <div className="planning-description">
              이 활동은 의료 AI 서비스를 기획하는 연습입니다.
              실제 진단, 치료, 의학적 판단을 대신하지 않으며, 질환·데이터·AI 역할을 구조적으로 연결해보는 것이 목적입니다.
            </div>
          </div>
          <aside className="planning-flow-card">
            <p className="eyebrow">How it works</p>
            <ol className="planning-flow-list">
              <li><strong>1단계 입력</strong><span>서비스 아이디어를 6단계로 채웁니다.</span></li>
              <li><strong>2단계 초안 생성</strong><span>오른쪽 문서가 자동 업데이트됩니다.</span></li>
              <li><strong>3단계 복사 또는 수정</strong><span>마크다운으로 저장하거나 다듬습니다.</span></li>
            </ol>
          </aside>
        </section>

        <section className="stepper-panel" aria-label="6단계 진행 흐름">
          {STEPS.map((step, index) => (
            <div className={`stepper-card step-${index + 1}`} key={step.key}>
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.question}</small>
            </div>
          ))}
        </section>

        <section className="planning-workspace">
          <form className="planning-form panel" onSubmit={(event) => event.preventDefault()}>
            <div className="panel-header">
              <div>
                <h2>입력 캔버스</h2>
                <p>비워둔 항목은 초안에서 자연스러운 기본 문구로 채워집니다.</p>
              </div>
            </div>

            <div className="planning-actions">
              <label className="example-select-wrap" htmlFor="example-select">
                <span>예시 선택</span>
                <select id="example-select" className="form-control" value={selectedExample} onChange={(event) => setSelectedExample(event.target.value)}>
                  {EXAMPLES.map((example, index) => (
                    <option key={example.name} value={index}>{example.name}</option>
                  ))}
                </select>
              </label>
              <button className="secondary-button" type="button" onClick={loadSelectedExample}>예시 불러오기</button>
              <button className="secondary-button" type="button" onClick={loadRandomExample}>랜덤 예시</button>
              <button className="danger-button" type="button" onClick={resetForm}>초기화</button>
            </div>

            <section className="canvas-section">
              <h3>기본 정보</h3>
              <div className="canvas-basic-grid">
                <label className="form-group" htmlFor="service-name">
                  <span>서비스 이름</span>
                  <input id="service-name" className="form-control" value={form.serviceName} onChange={(event) => updateField("serviceName", event.target.value)} placeholder="예) 금연 실패 위험을 알려주는 AI 코치" />
                </label>
                <label className="form-group" htmlFor="primary-user">
                  <span>주 사용자</span>
                  <input id="primary-user" className="form-control" value={form.primaryUser} onChange={(event) => updateField("primaryUser", event.target.value)} placeholder="예) 금연을 시도하는 20~40대 직장인" />
                </label>
                <label className="form-group full" htmlFor="stakeholder">
                  <span>보조 사용자 또는 이해관계자 <small>선택</small></span>
                  <input id="stakeholder" className="form-control" value={form.stakeholder} onChange={(event) => updateField("stakeholder", event.target.value)} placeholder="예) 보건소 상담사, 의료진, 가족" />
                </label>
              </div>
            </section>

            <section className="canvas-section">
              <h3>6단계 입력</h3>
              <div className="canvas-step-grid">
                {STEPS.map((step, index) => (
                  <label className={`canvas-input-card step-${index + 1}`} htmlFor={`canvas-${step.key}`} key={step.key}>
                    <span className="canvas-step-label">{index + 1}. {step.label}</span>
                    <strong>{step.question}</strong>
                    <textarea
                      id={`canvas-${step.key}`}
                      className="form-control"
                      value={form[step.key]}
                      onChange={(event) => updateField(step.key, event.target.value)}
                      placeholder={step.placeholder}
                      rows={4}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="canvas-section">
              <h3>추가 선택</h3>
              <div className="canvas-options-grid">
                <label className="form-group" htmlFor="purpose-select">
                  <span>서비스 목적 선택</span>
                  <select id="purpose-select" className="form-control" value={form.purpose} onChange={(event) => updateField("purpose", event.target.value)}>
                    {PURPOSE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <fieldset className="checkbox-panel">
                  <legend>AI 역할 선택</legend>
                  <div className="checkbox-grid">
                    {AI_ROLE_OPTIONS.map((role) => (
                      <label key={role}>
                        <input type="checkbox" checked={form.aiRoles.includes(role)} onChange={() => toggleAiRole(role)} />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="warning-checkbox">
                  <input type="checkbox" checked={form.includeWarning} onChange={(event) => updateField("includeWarning", event.target.checked)} />
                  <span>“의료진 판단을 대체하지 않는 보조 도구” 문구 포함</span>
                </label>
              </div>
            </section>
          </form>

          <aside className="planning-output panel">
            <div className="panel-header">
              <div>
                <h2>{valueOrDefault(form.serviceName, "나의 의료 AI 서비스")} 기획서 초안</h2>
                <p>입력값을 바탕으로 자동 생성된 마크다운 문서입니다.</p>
              </div>
            </div>
            <div className="output-actions">
              <button className="primary-button" type="button" onClick={copyDraft}>기획서 복사</button>
              <button className="secondary-button" type="button" onClick={handleDownload}>마크다운 다운로드</button>
            </div>
            <article className="paper-preview" aria-live="polite">
              <pre>{draft}</pre>
            </article>
          </aside>
        </section>
      </main>

      <div className={`toast${toast ? " visible" : ""}`} role="status">{toast}</div>
    </>
  );
}
