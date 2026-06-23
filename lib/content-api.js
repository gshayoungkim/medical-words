export async function fetchSharedContent() {
  const response = await fetch("/api/content", { cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "공용 콘텐츠를 불러오지 못했습니다.");
  }
  return response.json();
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
