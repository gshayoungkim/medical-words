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

function toMorpheme(row) {
  return {
    id: row.id,
    text: row.text,
    meaning: row.meaning,
    example: row.example || ""
  };
}

function toQuiz(row) {
  return {
    id: row.id,
    prompt: row.prompt,
    prefixId: row.prefix_id || "",
    rootId: row.root_id || "",
    suffixId: row.suffix_id || "",
    term: row.term,
    meaning: row.meaning,
    explanation: row.explanation || "",
    medicalData: row.medical_data || "",
    aiTask: row.ai_task || "",
    serviceUse: row.service_use || ""
  };
}

export async function getContent() {
  const sql = getSql();
  const [morphemeRows, quizRows] = await sql.transaction((tx) => [
    tx`
      SELECT id, type, text, meaning, example, sort_order
      FROM morphemes
      ORDER BY
        CASE type WHEN 'prefix' THEN 1 WHEN 'root' THEN 2 ELSE 3 END,
        sort_order,
        created_at
    `,
    tx`
      SELECT
        id, prompt, prefix_id, root_id, suffix_id, term, meaning,
        explanation, medical_data, ai_task, service_use, sort_order
      FROM quizzes
      ORDER BY sort_order, created_at
    `
  ], { readOnly: true });

  const content = {
    version: 3,
    morphemes: { prefix: [], root: [], suffix: [] },
    quizzes: quizRows.map(toQuiz)
  };

  morphemeRows.forEach((row) => {
    content.morphemes[row.type].push(toMorpheme(row));
  });

  return content;
}

export async function upsertMorpheme({ id, type, text, meaning, example = "" }) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO morphemes (id, type, text, meaning, example, sort_order)
    VALUES (
      ${id},
      ${type},
      ${text},
      ${meaning},
      ${example},
      COALESCE((SELECT MAX(sort_order) + 1 FROM morphemes WHERE type = ${type}), 0)
    )
    ON CONFLICT (id) DO UPDATE
    SET text = EXCLUDED.text,
        meaning = EXCLUDED.meaning,
        example = EXCLUDED.example,
        updated_at = NOW()
    RETURNING id
  `;
  return rows[0];
}

export async function deleteMorpheme(id) {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM morphemes
    WHERE id = ${id}
    RETURNING id
  `;
  return rows[0] || null;
}

export async function upsertQuiz(quiz) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO quizzes (
      id, prompt, prefix_id, root_id, suffix_id, term, meaning,
      explanation, medical_data, ai_task, service_use, sort_order
    )
    VALUES (
      ${quiz.id},
      ${quiz.prompt},
      ${quiz.prefixId || null},
      ${quiz.rootId || null},
      ${quiz.suffixId || null},
      ${quiz.term},
      ${quiz.meaning},
      ${quiz.explanation || ""},
      ${quiz.medicalData || ""},
      ${quiz.aiTask || ""},
      ${quiz.serviceUse || ""},
      COALESCE((SELECT MAX(sort_order) + 1 FROM quizzes), 0)
    )
    ON CONFLICT (id) DO UPDATE
    SET prompt = EXCLUDED.prompt,
        prefix_id = EXCLUDED.prefix_id,
        root_id = EXCLUDED.root_id,
        suffix_id = EXCLUDED.suffix_id,
        term = EXCLUDED.term,
        meaning = EXCLUDED.meaning,
        explanation = EXCLUDED.explanation,
        medical_data = EXCLUDED.medical_data,
        ai_task = EXCLUDED.ai_task,
        service_use = EXCLUDED.service_use,
        updated_at = NOW()
    RETURNING id
  `;
  return rows[0];
}

export async function deleteQuiz(id) {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM quizzes
    WHERE id = ${id}
    RETURNING id
  `;
  return rows[0] || null;
}

export async function replaceContent(content) {
  const sql = getSql();
  const morphemes = ["prefix", "root", "suffix"].flatMap((type) =>
    content.morphemes[type].map((item, index) => ({
      id: item.id,
      type,
      text: item.text,
      meaning: item.meaning,
      example: item.example || "",
      sortOrder: index
    }))
  );
  const quizzes = content.quizzes.map((quiz, index) => ({
    id: quiz.id,
    prompt: quiz.prompt,
    prefixId: quiz.prefixId || null,
    rootId: quiz.rootId || null,
    suffixId: quiz.suffixId || null,
    term: quiz.term,
    meaning: quiz.meaning,
    explanation: quiz.explanation || "",
    medicalData: quiz.medicalData || "",
    aiTask: quiz.aiTask || "",
    serviceUse: quiz.serviceUse || "",
    sortOrder: index
  }));

  const morphemeJson = JSON.stringify(morphemes);
  const quizJson = JSON.stringify(quizzes);

  await sql.transaction((tx) => [
    tx`DELETE FROM quizzes`,
    tx`DELETE FROM morphemes`,
    tx`
      INSERT INTO morphemes (id, type, text, meaning, example, sort_order)
      SELECT id, type, text, meaning, example, "sortOrder"
      FROM jsonb_to_recordset(${morphemeJson}::jsonb) AS item(
        id TEXT,
        type TEXT,
        text TEXT,
        meaning TEXT,
        example TEXT,
        "sortOrder" INTEGER
      )
    `,
    tx`
      INSERT INTO quizzes (
        id, prompt, prefix_id, root_id, suffix_id, term, meaning,
        explanation, medical_data, ai_task, service_use, sort_order
      )
      SELECT
        id, prompt, "prefixId", "rootId", "suffixId", term, meaning,
        explanation, "medicalData", "aiTask", "serviceUse", "sortOrder"
      FROM jsonb_to_recordset(${quizJson}::jsonb) AS item(
        id TEXT,
        prompt TEXT,
        "prefixId" TEXT,
        "rootId" TEXT,
        "suffixId" TEXT,
        term TEXT,
        meaning TEXT,
        explanation TEXT,
        "medicalData" TEXT,
        "aiTask" TEXT,
        "serviceUse" TEXT,
        "sortOrder" INTEGER
      )
    `
  ]);

  return getContent();
}
