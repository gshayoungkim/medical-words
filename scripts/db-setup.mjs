import { neon } from "@neondatabase/serverless";
import { replaceContent } from "../lib/db.js";
import { medicalWordData } from "../lib/medical-data.js";

if (!process.env.DATABASE_URL) {
  throw new Error(".env.local에 DATABASE_URL을 설정하세요.");
}

const sql = neon(process.env.DATABASE_URL);

await sql.transaction((tx) => [
  tx`
    CREATE TABLE IF NOT EXISTS morphemes (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('prefix', 'root', 'suffix')),
      text TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  tx`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      prefix_id TEXT REFERENCES morphemes(id) ON DELETE CASCADE,
      root_id TEXT REFERENCES morphemes(id) ON DELETE CASCADE,
      suffix_id TEXT REFERENCES morphemes(id) ON DELETE CASCADE,
      term TEXT NOT NULL,
      meaning TEXT NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      medical_data TEXT NOT NULL DEFAULT '',
      ai_task TEXT NOT NULL DEFAULT '',
      service_use TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (prefix_id IS NOT NULL OR root_id IS NOT NULL OR suffix_id IS NOT NULL)
    )
  `,
  tx`CREATE INDEX IF NOT EXISTS morphemes_type_sort_idx ON morphemes (type, sort_order)`,
  tx`CREATE INDEX IF NOT EXISTS quizzes_sort_idx ON quizzes (sort_order)`,
  tx`CREATE INDEX IF NOT EXISTS quizzes_prefix_idx ON quizzes (prefix_id)`,
  tx`CREATE INDEX IF NOT EXISTS quizzes_root_idx ON quizzes (root_id)`,
  tx`CREATE INDEX IF NOT EXISTS quizzes_suffix_idx ON quizzes (suffix_id)`,
  tx`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  tx`CREATE INDEX IF NOT EXISTS students_last_seen_idx ON students (last_seen_at DESC)`
]);

const [{ count }] = await sql`SELECT COUNT(*)::INTEGER AS count FROM morphemes`;

if (count === 0) {
  const [{ legacy_table }] = await sql`
    SELECT to_regclass('public.app_content')::TEXT AS legacy_table
  `;
  let source = medicalWordData.defaultData;

  if (legacy_table) {
    const rows = await sql`
      SELECT content
      FROM app_content
      WHERE id = 'main'
      LIMIT 1
    `;
    if (rows[0]?.content) {
      source = rows[0].content;
      console.log("기존 app_content JSONB 데이터를 정규화 테이블로 마이그레이션합니다.");
    }
  }

  await replaceContent(source);
  console.log(`구성요소와 퀴즈를 저장했습니다: 퀴즈 ${source.quizzes.length}개`);
} else {
  console.log("정규화 테이블에 데이터가 이미 있어 기존 데이터를 유지합니다.");
}

await sql`DROP TABLE IF EXISTS app_content`;

const [morphemeCounts, quizCounts] = await sql.transaction((tx) => [
  tx`
    SELECT type, COUNT(*)::INTEGER AS count
    FROM morphemes
    GROUP BY type
    ORDER BY type
  `,
  tx`SELECT COUNT(*)::INTEGER AS count FROM quizzes`
], { readOnly: true });

console.log("구성요소:", morphemeCounts);
console.log("퀴즈:", quizCounts[0]?.count || 0);
console.log("Neon 정규화 마이그레이션이 완료되었습니다.");
