const STORAGE_KEY = "medical-word-lab-data-v1";
const PROGRESS_KEY = "medical-word-lab-progress-v1";
const CURRENT_VERSION = 2;

const serviceContext = {
  "quiz-hyperglycemia": ["CGM 연속혈당, HbA1c, 식사·운동 기록", "혈당 상승 패턴 탐지와 고혈당 위험 예측", "당뇨 관리 앱, 식단 코칭, 의료진 원격 모니터링"],
  "quiz-hypoglycemia": ["CGM 시계열 데이터, 인슐린 투여·식사 기록", "저혈당 발생 가능성 조기 예측", "저혈당 위험 알림, 보호자 공유, 응급 대응 안내"],
  "quiz-tachycardia": ["ECG 심전도, 웨어러블 심박수", "빈맥·부정맥 탐지와 이상 신호 분류", "스마트워치 심장 알림, 원격 심장 모니터링"],
  "quiz-bradycardia": ["ECG 심전도, 웨어러블 심박수", "서맥 구간 탐지와 위험도 분류", "심박수 이상 알림, 심장 환자 추적 관리"],
  "quiz-dyspnea": ["산소포화도, 호흡수, 환자 문진·진료 대화", "증상 추출, 응급도 분류, 악화 위험 예측", "호흡기 환자 문진 챗봇, COPD 원격 모니터링"],
  "quiz-apnea": ["수면다원검사, 산소포화도, 코골이 음성", "무호흡 구간 탐지와 수면 단계 분석", "수면무호흡 선별 앱, 수면검사 판독 보조"],
  "quiz-polyuria": ["배뇨 일지, 혈당, 수분 섭취 기록", "증상 패턴 분석과 당뇨 의심군 선별", "배뇨 기록 앱, 만성질환 사전 문진 서비스"],
  "quiz-oliguria": ["시간당 소변량, 혈압, 크레아티닌 검사", "급성 신손상 위험 조기 예측", "중환자실 경고 시스템, 병원 CDSS"],
  "quiz-cardiomegaly": ["흉부 X-ray 영상, 판독문", "심장 크기 측정과 비정상 소견 탐지", "흉부 X-ray 판독 보조, 건강검진 영상 AI"],
  "quiz-hepatomegaly": ["복부 초음파·CT 영상, 간기능 검사", "장기 분할과 간 크기·이상 소견 측정", "복부 영상 판독 보조, 간질환 추적 대시보드"],
  "quiz-gastritis": ["위내시경 영상, 판독문, 증상 기록", "위 점막 병변 탐지와 중증도 분류", "내시경 실시간 보조, 검진 결과 리포트"],
  "quiz-dermatitis": ["피부 사진, 가려움·증상 설문", "피부 병변 분류와 변화 추적", "피부 질환 사전 선별, 비대면 경과 관리"],
  "quiz-arthritis": ["관절 X-ray·MRI, 통증 점수, 진료기록", "관절 손상 분류와 진행 위험 예측", "류마티스 환자 관리 앱, 영상 판독 보조"],
  "quiz-neuropathy": ["신경전도검사, 감각검사, 증상 설문", "말초신경 이상 패턴 분류", "당뇨 신경병증 선별, 신경 증상 추적 서비스"],
  "quiz-nephropathy": ["eGFR, 크레아티닌, 소변 단백 검사", "신장 기능 저하와 진행 위험 예측", "만성콩팥병 위험 알림, 진료 의사결정 보조"],
  "quiz-angiography": ["혈관조영 영상, CT angiography", "혈관 분할, 협착·폐색 탐지", "심뇌혈관 영상 판독 보조, 시술 계획 지원"],
  "quiz-arthroscopy": ["관절경 수술 영상", "해부학 구조와 병변 실시간 인식", "수술 내비게이션, 수술 영상 교육 플랫폼"],
  "quiz-immunotherapy": ["유전체, 병리영상, 치료 반응·부작용 기록", "반응 환자 예측과 이상반응 위험 분석", "정밀 항암 치료 추천, 환자 맞춤 치료 대시보드"]
};

const expandedQuizRows = [
  ["quiz-anemia", "혈액 내 적혈구나 헤모글로빈이 부족한 빈혈을 조립하세요.", "pre-a", "", "suf-emia", "anemia", "빈혈", "없음·결핍 + 혈액 상태"],
  ["quiz-hyperemia", "조직에 혈액이 과도하게 모인 충혈 상태를 조립하세요.", "pre-hyper", "", "suf-emia", "hyperemia", "충혈", "과도한 + 혈액 상태"],
  ["quiz-tachypnea", "호흡수가 비정상적으로 빠른 상태를 조립하세요.", "pre-tachy", "", "suf-pnea", "tachypnea", "빈호흡", "빠른 + 호흡"],
  ["quiz-bradypnea", "호흡수가 비정상적으로 느린 상태를 조립하세요.", "pre-brady", "", "suf-pnea", "bradypnea", "서호흡", "느린 + 호흡"],
  ["quiz-macrocyte", "정상보다 큰 세포를 뜻하는 용어를 조립하세요.", "pre-macro", "", "suf-cyte", "macrocyte", "대세포", "큰 + 세포"],
  ["quiz-microcyte", "정상보다 작은 세포를 뜻하는 용어를 조립하세요.", "pre-micro", "", "suf-cyte", "microcyte", "소세포", "작은 + 세포"],
  ["quiz-macrocytosis", "큰 적혈구가 증가한 상태를 조립하세요.", "pre-macro", "root-cyt", "suf-osis", "macrocytosis", "대적혈구증", "큰 + 세포 + 병적 상태"],
  ["quiz-microcytosis", "작은 적혈구가 증가한 상태를 조립하세요.", "pre-micro", "root-cyt", "suf-osis", "microcytosis", "소적혈구증", "작은 + 세포 + 병적 상태"],
  ["quiz-cytopenia", "혈액 속 특정 세포 수가 감소한 상태를 조립하세요.", "", "root-cyt", "suf-penia", "cytopenia", "혈구감소증", "세포 + 감소"],
  ["quiz-polycythemia", "혈액 속 적혈구가 과도하게 증가한 상태를 조립하세요.", "pre-poly", "root-cyt", "suf-emia", "polycythemia", "적혈구증가증", "많은 + 세포 + 혈액 상태"],
  ["quiz-polyneuropathy", "여러 말초신경에 동시에 발생한 병증을 조립하세요.", "pre-poly", "root-neur", "suf-pathy", "polyneuropathy", "다발신경병증", "많은 + 신경 + 병증"],
  ["quiz-polyarthritis", "여러 관절에 염증이 생긴 상태를 조립하세요.", "pre-poly", "root-arthr", "suf-itis", "polyarthritis", "다발관절염", "많은 + 관절 + 염증"],
  ["quiz-oligoarthritis", "소수의 관절에 염증이 생긴 상태를 조립하세요.", "pre-oligo", "root-arthr", "suf-itis", "oligoarthritis", "소수관절염", "적은 + 관절 + 염증"],
  ["quiz-polyarthralgia", "여러 관절에서 통증이 느껴지는 상태를 조립하세요.", "pre-poly", "root-arthr", "suf-algia", "polyarthralgia", "다발관절통", "많은 + 관절 + 통증"],
  ["quiz-microangiopathy", "미세혈관에 발생한 병증을 조립하세요.", "pre-micro", "root-angi", "suf-pathy", "microangiopathy", "미세혈관병증", "작은 + 혈관 + 병증"],
  ["quiz-macroangiopathy", "큰 혈관에 발생한 병증을 조립하세요.", "pre-macro", "root-angi", "suf-pathy", "macroangiopathy", "대혈관병증", "큰 + 혈관 + 병증"],
  ["quiz-hyperlipemia", "혈액 속 지방이 과도하게 높은 상태를 조립하세요.", "pre-hyper", "root-lip", "suf-emia", "hyperlipemia", "고지혈증", "높은 + 지방 + 혈액 상태"],
  ["quiz-hypolipemia", "혈액 속 지방이 비정상적으로 낮은 상태를 조립하세요.", "pre-hypo", "root-lip", "suf-emia", "hypolipemia", "저지혈증", "낮은 + 지방 + 혈액 상태"],
  ["quiz-endoscopy", "신체 내부를 관찰하는 검사를 조립하세요.", "pre-endo", "", "suf-scopy", "endoscopy", "내시경검사", "내부 + 관찰 검사"],
  ["quiz-pericarditis", "심장 주변을 싸는 막에 생긴 염증을 조립하세요.", "pre-peri", "root-cardi", "suf-itis", "pericarditis", "심장막염", "주변 + 심장 + 염증"],
  ["quiz-endocarditis", "심장 안쪽 막에 생긴 염증을 조립하세요.", "pre-endo", "root-cardi", "suf-itis", "endocarditis", "심내막염", "안쪽 + 심장 + 염증"],
  ["quiz-carditis", "심장 조직의 염증을 뜻하는 용어를 조립하세요.", "", "root-cardi", "suf-itis", "carditis", "심장염", "심장 + 염증"],
  ["quiz-cardiopathy", "심장에 발생한 질환을 포괄하는 용어를 조립하세요.", "", "root-cardi", "suf-pathy", "cardiopathy", "심장병증", "심장 + 병증"],
  ["quiz-angiopathy", "혈관에 발생한 병증을 조립하세요.", "", "root-angi", "suf-pathy", "angiopathy", "혈관병증", "혈관 + 병증"],
  ["quiz-angioma", "혈관 조직에서 생긴 종양을 조립하세요.", "", "root-angi", "suf-oma", "angioma", "혈관종", "혈관 + 종양"],
  ["quiz-angioplasty", "좁아진 혈관을 넓히거나 재건하는 시술을 조립하세요.", "", "root-angi", "suf-plasty", "angioplasty", "혈관성형술", "혈관 + 성형·재건"],
  ["quiz-hematoma", "혈액이 조직 안에 고여 덩어리를 이룬 상태를 조립하세요.", "", "root-hemat", "suf-oma", "hematoma", "혈종", "혈액 + 덩어리"],
  ["quiz-hematuria", "소변에 혈액이 섞여 나오는 상태를 조립하세요.", "", "root-hemat", "suf-uria", "hematuria", "혈뇨", "혈액 + 소변 상태"],
  ["quiz-hemophilia", "혈액 응고 장애인 혈우병을 조립하세요.", "", "root-hemat", "suf-philia", "hemophilia", "혈우병", "혈액 + 증가·선호"],
  ["quiz-pneumonitis", "폐 조직에 생긴 염증을 조립하세요.", "", "root-pneum", "suf-itis", "pneumonitis", "폐렴증", "폐 + 염증"],
  ["quiz-pneumopathy", "폐에 발생한 병증을 포괄하는 용어를 조립하세요.", "", "root-pneum", "suf-pathy", "pneumopathy", "폐병증", "폐 + 병증"],
  ["quiz-thoracotomy", "흉부를 절개하는 수술을 조립하세요.", "", "root-thorac", "suf-otomy", "thoracotomy", "개흉술", "흉부 + 절개술"],
  ["quiz-thoracostomy", "흉벽에 구멍을 만들어 배액 통로를 만드는 수술을 조립하세요.", "", "root-thorac", "suf-ostomy", "thoracostomy", "흉강개구술", "흉부 + 구멍을 내는 수술"],
  ["quiz-thoracoscopy", "흉강 내부를 관찰하는 검사를 조립하세요.", "", "root-thorac", "suf-scopy", "thoracoscopy", "흉강경검사", "흉부 + 관찰 검사"],
  ["quiz-thoracoplasty", "흉벽을 성형하거나 재건하는 수술을 조립하세요.", "", "root-thorac", "suf-plasty", "thoracoplasty", "흉곽성형술", "흉부 + 성형·재건"],
  ["quiz-neuritis", "신경에 생긴 염증을 조립하세요.", "", "root-neur", "suf-itis", "neuritis", "신경염", "신경 + 염증"],
  ["quiz-neuralgia", "신경을 따라 나타나는 통증을 조립하세요.", "", "root-neur", "suf-algia", "neuralgia", "신경통", "신경 + 통증"],
  ["quiz-neuroma", "신경 조직에서 생긴 종양을 조립하세요.", "", "root-neur", "suf-oma", "neuroma", "신경종", "신경 + 종양"],
  ["quiz-neurography", "신경의 구조나 기능을 기록하는 검사를 조립하세요.", "", "root-neur", "suf-graphy", "neurography", "신경조영·기록검사", "신경 + 촬영·기록 검사"],
  ["quiz-psychopathy", "정신 또는 행동의 병적 상태를 뜻하는 용어를 조립하세요.", "", "root-psych", "suf-pathy", "psychopathy", "정신병질", "정신 + 병증"],
  ["quiz-psychotherapy", "대화와 심리적 기법을 이용한 치료를 조립하세요.", "", "root-psych", "suf-therapy", "psychotherapy", "심리치료", "정신·마음 + 치료"],
  ["quiz-gastropathy", "위에 발생한 병증을 포괄하는 용어를 조립하세요.", "", "root-gastr", "suf-pathy", "gastropathy", "위병증", "위 + 병증"],
  ["quiz-gastralgia", "위 부위의 통증을 조립하세요.", "", "root-gastr", "suf-algia", "gastralgia", "위통", "위 + 통증"],
  ["quiz-gastroscopy", "위를 내시경으로 관찰하는 검사를 조립하세요.", "", "root-gastr", "suf-scopy", "gastroscopy", "위내시경검사", "위 + 관찰 검사"],
  ["quiz-gastrectomy", "위의 일부 또는 전체를 제거하는 수술을 조립하세요.", "", "root-gastr", "suf-ectomy", "gastrectomy", "위절제술", "위 + 절제술"],
  ["quiz-gastrotomy", "위를 절개하는 수술을 조립하세요.", "", "root-gastr", "suf-otomy", "gastrotomy", "위절개술", "위 + 절개술"],
  ["quiz-gastrostomy", "위에 영양 공급용 구멍을 만드는 수술을 조립하세요.", "", "root-gastr", "suf-ostomy", "gastrostomy", "위루술", "위 + 구멍을 내는 수술"],
  ["quiz-enteritis", "장에 생긴 염증을 조립하세요.", "", "root-enter", "suf-itis", "enteritis", "장염", "장 + 염증"],
  ["quiz-enteropathy", "장에 발생한 병증을 조립하세요.", "", "root-enter", "suf-pathy", "enteropathy", "장병증", "장 + 병증"],
  ["quiz-enterostomy", "장에 인공적인 배출구를 만드는 수술을 조립하세요.", "", "root-enter", "suf-ostomy", "enterostomy", "장루형성술", "장 + 구멍을 내는 수술"],
  ["quiz-enterotomy", "장을 절개하는 수술을 조립하세요.", "", "root-enter", "suf-otomy", "enterotomy", "장절개술", "장 + 절개술"],
  ["quiz-hepatitis", "간에 생긴 염증을 조립하세요.", "", "root-hepat", "suf-itis", "hepatitis", "간염", "간 + 염증"],
  ["quiz-hepatopathy", "간에 발생한 병증을 포괄하는 용어를 조립하세요.", "", "root-hepat", "suf-pathy", "hepatopathy", "간병증", "간 + 병증"],
  ["quiz-hepatectomy", "간의 일부를 제거하는 수술을 조립하세요.", "", "root-hepat", "suf-ectomy", "hepatectomy", "간절제술", "간 + 절제술"],
  ["quiz-hepatoma", "간에서 생긴 종양을 조립하세요.", "", "root-hepat", "suf-oma", "hepatoma", "간종양", "간 + 종양"],
  ["quiz-nephritis", "신장에 생긴 염증을 조립하세요.", "", "root-nephr", "suf-itis", "nephritis", "신장염", "신장 + 염증"],
  ["quiz-nephrosis", "신장의 비염증성 병적 상태를 조립하세요.", "", "root-nephr", "suf-osis", "nephrosis", "신장증", "신장 + 병적 상태"],
  ["quiz-nephrectomy", "신장의 일부 또는 전체를 제거하는 수술을 조립하세요.", "", "root-nephr", "suf-ectomy", "nephrectomy", "신장절제술", "신장 + 절제술"],
  ["quiz-nephrotomy", "신장을 절개하는 수술을 조립하세요.", "", "root-nephr", "suf-otomy", "nephrotomy", "신장절개술", "신장 + 절개술"],
  ["quiz-nephrostomy", "신장에 소변 배출 통로를 만드는 수술을 조립하세요.", "", "root-nephr", "suf-ostomy", "nephrostomy", "신루술", "신장 + 구멍을 내는 수술"],
  ["quiz-dermatosis", "피부의 병적 상태를 포괄하는 용어를 조립하세요.", "", "root-dermat", "suf-osis", "dermatosis", "피부병", "피부 + 병적 상태"],
  ["quiz-osteitis", "뼈에 생긴 염증을 조립하세요.", "", "root-oste", "suf-itis", "osteitis", "골염", "뼈 + 염증"],
  ["quiz-osteopathy", "뼈에 발생한 병증을 조립하세요.", "", "root-oste", "suf-pathy", "osteopathy", "골병증", "뼈 + 병증"],
  ["quiz-osteoma", "뼈 조직에서 생긴 종양을 조립하세요.", "", "root-oste", "suf-oma", "osteoma", "골종", "뼈 + 종양"],
  ["quiz-osteotomy", "뼈를 절개하거나 절단하는 수술을 조립하세요.", "", "root-oste", "suf-otomy", "osteotomy", "절골술", "뼈 + 절개술"],
  ["quiz-osteoplasty", "뼈를 성형하거나 재건하는 수술을 조립하세요.", "", "root-oste", "suf-plasty", "osteoplasty", "골성형술", "뼈 + 성형·재건"],
  ["quiz-myositis", "근육에 생긴 염증을 조립하세요.", "", "root-my", "suf-itis", "myositis", "근염", "근육 + 염증"],
  ["quiz-myopathy", "근육에 발생한 병증을 조립하세요.", "", "root-my", "suf-pathy", "myopathy", "근육병증", "근육 + 병증"],
  ["quiz-myalgia", "근육의 통증을 조립하세요.", "", "root-my", "suf-algia", "myalgia", "근육통", "근육 + 통증"],
  ["quiz-myoma", "근육 조직에서 생긴 종양을 조립하세요.", "", "root-my", "suf-oma", "myoma", "근종", "근육 + 종양"],
  ["quiz-myotomy", "근육을 절개하는 수술을 조립하세요.", "", "root-my", "suf-otomy", "myotomy", "근절개술", "근육 + 절개술"],
  ["quiz-arthropathy", "관절에 발생한 병증을 조립하세요.", "", "root-arthr", "suf-pathy", "arthropathy", "관절병증", "관절 + 병증"],
  ["quiz-arthralgia", "관절의 통증을 조립하세요.", "", "root-arthr", "suf-algia", "arthralgia", "관절통", "관절 + 통증"],
  ["quiz-arthrotomy", "관절을 절개하는 수술을 조립하세요.", "", "root-arthr", "suf-otomy", "arthrotomy", "관절절개술", "관절 + 절개술"],
  ["quiz-arthroplasty", "손상된 관절을 성형하거나 재건하는 수술을 조립하세요.", "", "root-arthr", "suf-plasty", "arthroplasty", "관절성형술", "관절 + 성형·재건"],
  ["quiz-ophthalmoscopy", "눈 안쪽을 관찰하는 검사를 조립하세요.", "", "root-ophthalm", "suf-scopy", "ophthalmoscopy", "검안경검사", "눈 + 관찰 검사"],
  ["quiz-ophthalmopathy", "눈에 발생한 병증을 조립하세요.", "", "root-ophthalm", "suf-pathy", "ophthalmopathy", "안병증", "눈 + 병증"],
  ["quiz-rhinitis", "코 점막에 생긴 염증을 조립하세요.", "", "root-rhin", "suf-itis", "rhinitis", "비염", "코 + 염증"],
  ["quiz-rhinorrhea", "코에서 분비물이 흐르는 상태를 조립하세요.", "", "root-rhin", "suf-rrhea", "rhinorrhea", "콧물", "코 + 흐름·분비"],
  ["quiz-rhinoscopy", "코 안쪽을 관찰하는 검사를 조립하세요.", "", "root-rhin", "suf-scopy", "rhinoscopy", "비강경검사", "코 + 관찰 검사"],
  ["quiz-rhinoplasty", "코를 성형하거나 재건하는 수술을 조립하세요.", "", "root-rhin", "suf-plasty", "rhinoplasty", "비성형술", "코 + 성형·재건"],
  ["quiz-otitis", "귀에 생긴 염증을 조립하세요.", "", "root-ot", "suf-itis", "otitis", "이염", "귀 + 염증"],
  ["quiz-otalgia", "귀의 통증을 조립하세요.", "", "root-ot", "suf-algia", "otalgia", "이통", "귀 + 통증"],
  ["quiz-otorrhea", "귀에서 분비물이 흐르는 상태를 조립하세요.", "", "root-ot", "suf-rrhea", "otorrhea", "이루", "귀 + 흐름·분비"],
  ["quiz-otoscopy", "귀 안쪽을 관찰하는 검사를 조립하세요.", "", "root-ot", "suf-scopy", "otoscopy", "이경검사", "귀 + 관찰 검사"],
  ["quiz-lipemia", "혈액 속에 지방이 존재하거나 증가한 상태를 조립하세요.", "", "root-lip", "suf-emia", "lipemia", "지혈증", "지방 + 혈액 상태"],
  ["quiz-lipoma", "지방 조직에서 생긴 양성 종양을 조립하세요.", "", "root-lip", "suf-oma", "lipoma", "지방종", "지방 + 종양"],
  ["quiz-carcinoma", "상피세포에서 발생하는 암종을 조립하세요.", "", "root-carcin", "suf-oma", "carcinoma", "암종", "암 + 종양"]
];

const rootServiceContext = {
  "root-cardi": ["ECG, 심박수, 심장초음파·X-ray", "심장 이상 탐지와 위험도 분류", "심장 모니터링, 영상 판독 보조"],
  "root-angi": ["혈관조영·CT 영상, 혈압·혈류 데이터", "혈관 분할과 협착·폐색 탐지", "심뇌혈관 판독 보조, 시술 계획 지원"],
  "root-hemat": ["CBC 혈액검사, 응고검사, 소변검사", "혈액 이상 패턴 분류와 위험 예측", "검사결과 경고, 혈액질환 의사결정 보조"],
  "root-pneum": ["흉부 X-ray·CT, 산소포화도, 호흡수", "폐 병변 탐지와 호흡 악화 예측", "영상 판독 보조, 호흡기 원격 모니터링"],
  "root-thorac": ["흉부 CT·X-ray, 수술 영상", "흉부 구조 분할과 병변 탐지", "흉부 영상 판독·수술 계획 지원"],
  "root-neur": ["신경전도검사, MRI, 증상 설문", "신경 이상 패턴 분류", "신경질환 선별과 경과 추적"],
  "root-psych": ["정신건강 설문, 상담 기록·음성", "증상 추출과 위험도 분류", "디지털 정신건강 중재, 상담 지원"],
  "root-gastr": ["위내시경 영상, 판독문, 증상 기록", "위 병변 탐지와 중증도 분류", "내시경 판독 보조, 검진 리포트"],
  "root-enter": ["복부 영상, 내시경, 배변·증상 기록", "장 병변 탐지와 증상 패턴 분석", "소화기 판독 보조, 장질환 관리 앱"],
  "root-hepat": ["간기능 검사, 초음파·CT, 병리영상", "간 병변 탐지와 기능 저하 예측", "간질환 판독 보조, 추적 관리"],
  "root-nephr": ["eGFR, 크레아티닌, 소변량·소변검사", "신장 기능 저하와 AKI 위험 예측", "신장질환 경고, 병원 CDSS"],
  "root-dermat": ["피부 사진, 증상 설문", "피부 병변 분류와 변화 추적", "피부질환 선별, 비대면 경과 관리"],
  "root-oste": ["X-ray·CT, 골밀도 검사", "골 병변 탐지와 골절 위험 예측", "근골격 영상 판독 보조, 수술 계획"],
  "root-my": ["근전도, MRI, 통증·근력 기록", "근육 이상 패턴 분류", "재활 모니터링, 근육질환 선별"],
  "root-arthr": ["관절 X-ray·MRI, 통증·운동범위", "관절 손상 분류와 진행 예측", "관절 영상 판독, 재활·수술 계획"],
  "root-ophthalm": ["안저·세극등 영상, 시력검사", "안과 병변 탐지와 중증도 분류", "안저 판독 보조, 안과 선별검사"],
  "root-rhin": ["비강 내시경, 증상·알레르기 검사", "비강 병변 탐지와 증상 분류", "이비인후과 진료 보조, 알레르기 관리"],
  "root-ot": ["이경 영상, 청력검사, 증상 기록", "귀 병변 탐지와 청력 이상 분류", "이경 판독 보조, 청력 관리"],
  "root-lip": ["지질검사, 식사·운동 기록", "심혈관 위험도 예측", "만성질환 코칭, 건강검진 위험 알림"],
  "root-cyt": ["CBC, 세포검사, 병리영상", "세포 수·형태 이상 탐지", "혈액검사 경고, 디지털 병리"],
  "root-carcin": ["병리영상, CT·MRI, 유전체", "암 병변 탐지와 치료 반응 예측", "암 진단 보조, 정밀치료 추천"]
};

function inferServiceContext(quiz) {
  const rootContext = rootServiceContext[quiz.rootId];
  if (rootContext) return rootContext;
  if (quiz.suffixId === "suf-scopy") {
    return ["내시경·관찰 영상과 판독문", "이상 소견 탐지와 영상 분류", "실시간 검사 보조, 자동 판독문 작성"];
  }
  if (quiz.suffixId === "suf-pnea") {
    return ["호흡수, 산소포화도, 호흡 음성", "호흡 이상 탐지와 악화 위험 예측", "호흡기 원격 모니터링, 위험 알림"];
  }
  if (quiz.suffixId === "suf-emia" || quiz.suffixId === "suf-cyte") {
    return ["혈액검사, CBC, 생체신호", "검사 이상 분류와 위험도 예측", "검사결과 알림, 임상 의사결정 보조"];
  }
  return ["진료기록, 검사결과, 의료영상", "이상 소견 탐지·분류·예측", "진료 보조, 환자 모니터링 서비스"];
}

  const defaultData = {
    version: CURRENT_VERSION,
    morphemes: {
      prefix: [
        ["pre-hyper", "hyper", "높은, 과도한", "hyperglycemia · hypertension"],
        ["pre-hypo", "hypo", "낮은, 부족한", "hypoglycemia · hypotension"],
        ["pre-tachy", "tachy", "빠른", "tachycardia"],
        ["pre-brady", "brady", "느린", "bradycardia"],
        ["pre-dys", "dys", "비정상, 어려움", "dyspnea · dysrhythmia"],
        ["pre-a", "a / an", "없음, 결핍", "apnea · anemia"],
        ["pre-anti", "anti", "반대, 억제", "antibiotic · anticoagulant"],
        ["pre-pre", "pre", "이전, 전", "prediabetes · prenatal"],
        ["pre-post", "post", "이후, 후", "postoperative · postprandial"],
        ["pre-peri", "peri", "주변", "pericardium · perinatal"],
        ["pre-endo", "endo", "안쪽, 내부", "endoscopy · endocrine"],
        ["pre-epi", "epi", "위, 표면", "epidermis · epigastric"],
        ["pre-intra", "intra", "내부", "intravenous · intracranial"],
        ["pre-inter", "inter", "사이", "intercostal · interstitial"],
        ["pre-sub", "sub", "아래", "subcutaneous · subdural"],
        ["pre-trans", "trans", "가로질러, 통과", "transdermal · transfusion"],
        ["pre-poly", "poly", "많은", "polyuria · polydipsia"],
        ["pre-oligo", "oligo", "적은", "oliguria"],
        ["pre-macro", "macro", "큰", "macrocyte"],
        ["pre-micro", "micro", "작은", "microalbuminuria"]
      ],
      root: [
        ["root-cardi", "cardi / cardio", "심장", "cardiology · cardiomegaly"],
        ["root-angi", "angi / angio", "혈관", "angiography · angioplasty"],
        ["root-hemat", "hemat / hemo", "혈액", "hematology · hemoglobin"],
        ["root-pneum", "pneum / pneumo", "폐, 공기", "pneumonia · pneumothorax"],
        ["root-pulmon", "pulmon / pulmo", "폐", "pulmonary · pulmonology"],
        ["root-thorac", "thorac / thoraco", "흉부", "thorax · thoracentesis"],
        ["root-neur", "neur / neuro", "신경", "neurology · neuropathy"],
        ["root-psych", "psych / psycho", "정신, 마음", "psychiatry · psychology"],
        ["root-gastr", "gastr / gastro", "위", "gastritis · gastroscopy"],
        ["root-enter", "enter / entero", "장", "enteritis · gastroenteritis"],
        ["root-hepat", "hepat / hepato", "간", "hepatitis · hepatomegaly"],
        ["root-nephr", "nephr / nephro", "신장", "nephrology · nephropathy"],
        ["root-ren", "ren / renal", "신장", "renal failure · renal artery"],
        ["root-dermat", "derm / dermato", "피부", "dermatology · dermatitis"],
        ["root-oste", "oste / osteo", "뼈", "osteoporosis · osteoarthritis"],
        ["root-my", "my / myo", "근육", "myocardium · myopathy"],
        ["root-arthr", "arthr / arthro", "관절", "arthritis · arthroscopy"],
        ["root-ophthalm", "ophthalm / ophthalmo", "눈", "ophthalmology · ophthalmoscopy"],
        ["root-rhin", "rhin / rhino", "코", "rhinitis · rhinorrhea"],
        ["root-ot", "ot / oto", "귀", "otitis · otology"],
        ["root-glyc", "glyc / gluco", "당, 포도당", "glucose · hyperglycemia"],
        ["root-lip", "lip / lipo", "지방", "lipid · lipoprotein"],
        ["root-onc", "onc / onco", "종양", "oncology · oncogene"],
        ["root-carcin", "carcin / carcino", "암", "carcinoma · carcinogenesis"],
        ["root-immun", "immun / immuno", "면역", "immunology · immunotherapy"],
        ["root-path", "path / patho", "질병", "pathology · pathogen"],
        ["root-cyt", "cyt / cyto", "세포", "cytology · leukocyte"],
        ["root-hist", "hist / histo", "조직", "histology · histopathology"]
      ],
      suffix: [
        ["suf-itis", "itis", "염증", "bronchitis · dermatitis"],
        ["suf-osis", "osis", "상태, 병적 상태", "fibrosis · stenosis"],
        ["suf-emia", "emia", "혈액 상태", "anemia · hypoglycemia"],
        ["suf-pathy", "pathy", "질환, 병증", "neuropathy · nephropathy"],
        ["suf-megaly", "megaly", "비대", "cardiomegaly · hepatomegaly"],
        ["suf-algia", "algia", "통증", "neuralgia · myalgia"],
        ["suf-pnea", "pnea", "호흡", "dyspnea · apnea · tachypnea"],
        ["suf-rrhea", "rrhea", "흐름, 분비", "diarrhea · rhinorrhea"],
        ["suf-uria", "uria", "소변 상태", "proteinuria · hematuria"],
        ["suf-cyte", "cyte", "세포", "leukocyte · erythrocyte"],
        ["suf-penia", "penia", "감소, 부족", "leukopenia · thrombocytopenia"],
        ["suf-philia", "philia", "증가, 선호", "eosinophilia · hemophilia"],
        ["suf-oma", "oma", "종양, 덩어리", "carcinoma · lymphoma"],
        ["suf-graphy", "graphy", "촬영, 기록 검사", "mammography · angiography"],
        ["suf-gram", "gram", "기록 결과", "electrocardiogram · angiogram"],
        ["suf-scope", "scope", "관찰 기구", "endoscope · stethoscope"],
        ["suf-scopy", "scopy", "내시경, 관찰 검사", "endoscopy · colonoscopy"],
        ["suf-metry", "metry", "측정", "spirometry · oximetry"],
        ["suf-ectomy", "ectomy", "절제술", "appendectomy · mastectomy"],
        ["suf-otomy", "otomy", "절개술", "tracheotomy · craniotomy"],
        ["suf-ostomy", "ostomy", "구멍을 내는 수술", "colostomy · tracheostomy"],
        ["suf-plasty", "plasty", "성형, 재건", "angioplasty · rhinoplasty"],
        ["suf-therapy", "therapy", "치료", "chemotherapy · immunotherapy"]
      ]
    },
    quizzes: [
      ["quiz-hyperglycemia", "혈당 수치가 정상보다 높은 상태를 조립하세요.", "pre-hyper", "root-glyc", "suf-emia", "hyperglycemia", "고혈당", "높은 + 당 + 혈액 상태"],
      ["quiz-hypoglycemia", "식은땀과 떨림이 있는 환자의 낮은 혈당 상태를 조립하세요.", "pre-hypo", "root-glyc", "suf-emia", "hypoglycemia", "저혈당", "낮은 + 당 + 혈액 상태"],
      ["quiz-tachycardia", "심장이 비정상적으로 빠르게 뛰는 상태를 조립하세요.", "pre-tachy", "root-cardi", "", "tachycardia", "빈맥", "빠른 + 심장"],
      ["quiz-bradycardia", "심장이 비정상적으로 느리게 뛰는 상태를 조립하세요.", "pre-brady", "root-cardi", "", "bradycardia", "서맥", "느린 + 심장"],
      ["quiz-dyspnea", "환자가 숨쉬기 어렵다고 호소합니다. 용어를 조립하세요.", "pre-dys", "", "suf-pnea", "dyspnea", "호흡곤란", "어려움 + 호흡"],
      ["quiz-apnea", "호흡이 일시적으로 없는 상태를 조립하세요.", "pre-a", "", "suf-pnea", "apnea", "무호흡", "없음 + 호흡"],
      ["quiz-polyuria", "소변량이 지나치게 많은 상태를 조립하세요.", "pre-poly", "", "suf-uria", "polyuria", "다뇨", "많은 + 소변 상태"],
      ["quiz-oliguria", "소변량이 감소한 상태를 조립하세요.", "pre-oligo", "", "suf-uria", "oliguria", "핍뇨", "적은 + 소변 상태"],
      ["quiz-cardiomegaly", "영상에서 심장이 커진 소견을 조립하세요.", "", "root-cardi", "suf-megaly", "cardiomegaly", "심장비대", "심장 + 비대"],
      ["quiz-hepatomegaly", "진찰에서 간이 커진 상태를 조립하세요.", "", "root-hepat", "suf-megaly", "hepatomegaly", "간비대", "간 + 비대"],
      ["quiz-gastritis", "위 점막에 염증이 생긴 질환을 조립하세요.", "", "root-gastr", "suf-itis", "gastritis", "위염", "위 + 염증"],
      ["quiz-dermatitis", "피부에 염증이 생긴 질환을 조립하세요.", "", "root-dermat", "suf-itis", "dermatitis", "피부염", "피부 + 염증"],
      ["quiz-arthritis", "관절에 염증이 생긴 질환을 조립하세요.", "", "root-arthr", "suf-itis", "arthritis", "관절염", "관절 + 염증"],
      ["quiz-neuropathy", "신경에 발생한 병증을 조립하세요.", "", "root-neur", "suf-pathy", "neuropathy", "신경병증", "신경 + 병증"],
      ["quiz-nephropathy", "신장에 발생한 병증을 조립하세요.", "", "root-nephr", "suf-pathy", "nephropathy", "신장병증", "신장 + 병증"],
      ["quiz-angiography", "혈관을 촬영하여 기록하는 검사를 조립하세요.", "", "root-angi", "suf-graphy", "angiography", "혈관조영술", "혈관 + 촬영 검사"],
      ["quiz-arthroscopy", "관절 내부를 관찰하는 검사를 조립하세요.", "", "root-arthr", "suf-scopy", "arthroscopy", "관절경검사", "관절 + 관찰 검사"],
      ["quiz-immunotherapy", "면역 체계를 이용한 치료를 조립하세요.", "", "root-immun", "suf-therapy", "immunotherapy", "면역치료", "면역 + 치료"],
      ...expandedQuizRows
    ]
  };

  function normalize(data) {
    const copy = JSON.parse(JSON.stringify(data));
    ["prefix", "root", "suffix"].forEach((type) => {
      copy.morphemes[type] = (copy.morphemes[type] || []).map((item) =>
        Array.isArray(item)
          ? { id: item[0], text: item[1], meaning: item[2], example: item[3] || "" }
          : item
      );
    });
    copy.quizzes = (copy.quizzes || []).map((item) => {
      const normalized = Array.isArray(item)
        ? {
            id: item[0],
            prompt: item[1],
            prefixId: item[2],
            rootId: item[3],
            suffixId: item[4],
            term: item[5],
            meaning: item[6],
            explanation: item[7] || ""
          }
        : item;
      const context = serviceContext[normalized.id] || inferServiceContext(normalized);
      return {
        ...normalized,
        medicalData: normalized.medicalData ?? context[0] ?? "",
        aiTask: normalized.aiTask ?? context[1] ?? "",
        serviceUse: normalized.serviceUse ?? context[2] ?? ""
      };
    });
    return copy;
  }

  function getData() {
    if (typeof window === "undefined") return normalize(defaultData);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return normalize(defaultData);
      const parsed = JSON.parse(saved);
      const normalized = normalize(parsed);
      if ((parsed.version || 1) < CURRENT_VERSION) {
        const defaults = normalize(defaultData);
        const existingIds = new Set(normalized.quizzes.map((quiz) => quiz.id));
        normalized.quizzes.push(...defaults.quizzes.filter((quiz) => !existingIds.has(quiz.id)));
        normalized.version = CURRENT_VERSION;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
      return normalized;
    } catch (error) {
      console.warn("저장 데이터를 읽지 못해 기본값을 사용합니다.", error);
      return normalize(defaultData);
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("medical-data-changed"));
  }

  function resetData() {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("medical-data-changed"));
  }

  function getProgress() {
    if (typeof window === "undefined") {
      return { attempts: 0, correct: 0, streak: 0, mastered: [] };
    }
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {
        attempts: 0,
        correct: 0,
        streak: 0,
        mastered: []
      };
    } catch {
      return { attempts: 0, correct: 0, streak: 0, mastered: [] };
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

export const medicalWordData = {
  STORAGE_KEY,
  defaultData: normalize(defaultData),
  getData,
  saveData,
  resetData,
  getProgress,
  saveProgress
};
