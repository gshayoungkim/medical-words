import { neon } from "@neondatabase/serverless";

let client;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

export async function getContent() {
  const sql = getSql();
  const rows = await sql`
    SELECT content, revision, updated_at
    FROM app_content
    WHERE id = 'main'
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function saveContent(content) {
  const sql = getSql();
  const serialized = JSON.stringify(content);
  const rows = await sql`
    INSERT INTO app_content (id, content, revision, updated_at)
    VALUES ('main', ${serialized}::jsonb, 1, NOW())
    ON CONFLICT (id) DO UPDATE
    SET content = EXCLUDED.content,
        revision = app_content.revision + 1,
        updated_at = NOW()
    RETURNING content, revision, updated_at
  `;
  return rows[0];
}
