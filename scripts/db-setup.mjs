import { neon } from "@neondatabase/serverless";
import { medicalWordData } from "../lib/medical-data.js";

if (!process.env.DATABASE_URL) {
  throw new Error(".env.local에 DATABASE_URL을 설정하세요.");
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS app_content (
    id TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const existing = await sql`
  SELECT id
  FROM app_content
  WHERE id = 'main'
  LIMIT 1
`;

if (existing.length) {
  console.log("app_content/main 데이터가 이미 존재합니다. 기존 데이터를 유지합니다.");
} else {
  const serialized = JSON.stringify(medicalWordData.defaultData);
  await sql`
    INSERT INTO app_content (id, content)
    VALUES ('main', ${serialized}::jsonb)
  `;
  console.log(`기본 콘텐츠를 저장했습니다: 퀴즈 ${medicalWordData.defaultData.quizzes.length}개`);
}

console.log("Neon 데이터베이스 설정이 완료되었습니다.");
