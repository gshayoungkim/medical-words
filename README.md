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

GitHub 저장소를 Vercel에 연결하면 Next.js 프로젝트로 자동 감지됩니다. 별도 빌드 설정은 필요하지 않습니다.

## 데이터 관리

- 교사용 페이지에서 Prefix, Root, Suffix와 퀴즈를 추가·수정·삭제할 수 있습니다.
- 변경 내용은 현재 브라우저의 `localStorage`에 저장됩니다.
- `백업 및 복원` 메뉴에서 JSON 파일로 내보내거나 가져올 수 있습니다.
- 현재 교사용 페이지에는 서버 인증 기능이 없고 데이터는 브라우저별로 저장됩니다.
- 여러 교사가 데이터를 공유하거나 학생별 결과를 수집하려면 서버 데이터베이스와 인증 기능이 필요합니다.
