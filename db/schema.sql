CREATE TABLE IF NOT EXISTS morphemes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('prefix', 'root', 'suffix')),
  text TEXT NOT NULL,
  meaning TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS morphemes_type_sort_idx
  ON morphemes (type, sort_order);

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
);

CREATE INDEX IF NOT EXISTS quizzes_sort_idx ON quizzes (sort_order);
CREATE INDEX IF NOT EXISTS quizzes_prefix_idx ON quizzes (prefix_id);
CREATE INDEX IF NOT EXISTS quizzes_root_idx ON quizzes (root_id);
CREATE INDEX IF NOT EXISTS quizzes_suffix_idx ON quizzes (suffix_id);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS students_last_seen_idx ON students (last_seen_at DESC);
