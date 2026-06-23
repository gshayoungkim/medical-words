export async function fetchSharedContent() {
  const response = await fetch("/api/content", { cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "공용 콘텐츠를 불러오지 못했습니다.");
  }
  return response.json();
}

export async function verifyAdminKey(adminKey) {
  const response = await fetch("/api/admin/verify", {
    method: "POST",
    headers: {
      "x-admin-key": adminKey || ""
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || "관리 코드를 확인하지 못했습니다.");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function saveSharedContent(content, adminKey) {
  const response = await fetch("/api/content", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey || ""
    },
    body: JSON.stringify({ content })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || "공용 콘텐츠를 저장하지 못했습니다.");
    error.status = response.status;
    throw error;
  }
  return body;
}

async function mutate(path, method, adminKey, body) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey || ""
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "DB 작업을 완료하지 못했습니다.");
    error.status = response.status;
    throw error;
  }
  return result;
}

export function saveMorpheme(item, adminKey) {
  return mutate("/api/morphemes", "POST", adminKey, { item });
}

export function removeMorpheme(id, adminKey) {
  return mutate(`/api/morphemes?id=${encodeURIComponent(id)}`, "DELETE", adminKey);
}

export function saveQuiz(item, adminKey) {
  return mutate("/api/quizzes", "POST", adminKey, { item });
}

export function removeQuiz(id, adminKey) {
  return mutate(`/api/quizzes?id=${encodeURIComponent(id)}`, "DELETE", adminKey);
}

export async function registerStudent(student) {
  const response = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "학생 정보를 등록하지 못했습니다.");
  return body;
}

export async function fetchStudentStats(adminKey) {
  const response = await fetch("/api/students", {
    headers: { "x-admin-key": adminKey || "" },
    cache: "no-store"
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "학생 현황을 불러오지 못했습니다.");
  return body;
}
