# Medical Word Lab

의료용어 PDF의 Prefix, Root, Suffix를 레고 블록처럼 조립하며 학습하는 Next.js 웹앱입니다.

## 실행

프로젝트 폴더에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

- 학생 페이지: <http://localhost:3000>
- 교사용 페이지: <http://localhost:3000/teacher>

프로덕션 빌드는 `npm run build`로 확인할 수 있습니다.

## Vercel 배포

GitHub 저장소를 Vercel에 연결하면 루트의 `package.json`과 `vercel.json`을 기준으로 Next.js 프로젝트로 감지됩니다.

- Framework Preset: `Next.js`
- Root Directory: 저장소 루트
- Build Command: `npm run build`
- Output Directory: 비워 둠

Vercel 프로젝트가 기존에 `Other`로 생성됐다면 Project Settings → Build & Development Settings에서 Framework Preset을 `Next.js`로 변경하거나 프로젝트를 다시 Import하세요.

## Neon 연결

1. Neon 프로젝트에서 연결 문자열을 복사합니다.
2. `.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
DATABASE_URL=postgresql://...
TEACHER_ADMIN_KEY=충분히-긴-임의의-관리키
```

3. 최초 한 번 정규화 테이블과 기본 콘텐츠를 생성합니다. 기존 `app_content` JSONB 데이터가 있으면 자동으로 마이그레이션한 뒤 기존 테이블을 제거합니다.

```bash
npm run db:setup
```

4. Vercel 프로젝트의 Environment Variables에도 `DATABASE_URL`과 `TEACHER_ADMIN_KEY`를 동일하게 등록합니다.

학생 페이지는 Neon 콘텐츠를 공개적으로 읽습니다. 교사용 페이지의 쓰기 요청은 `TEACHER_ADMIN_KEY`로 보호되며, 입력한 키는 브라우저의 `sessionStorage`에만 보관됩니다.

## 데이터 관리

- 교사용 페이지에서 Prefix, Root, Suffix와 퀴즈를 추가·수정·삭제할 수 있습니다.
- Prefix, Root, Suffix는 `morphemes` 테이블에 행 단위로 저장됩니다.
- 퀴즈는 `quizzes` 테이블에 저장되며 구성요소를 외래키로 참조합니다.
- 교사용 추가·수정·삭제는 각 행을 대상으로 처리되어 모든 기기에 공유됩니다.
- `백업 및 복원` 메뉴에서 JSON 파일로 내보내거나 가져올 수 있습니다.
- 학생의 개인 정답률과 연속 정답 기록은 개인정보 수집을 피하기 위해 현재 브라우저에만 저장됩니다.
- 관리 키 방식은 초기 운영용입니다. 다수의 교사가 사용한다면 추후 정식 계정 인증으로 교체해야 합니다.
