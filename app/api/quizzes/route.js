import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { deleteQuiz, getContent, hasDatabase, upsertQuiz } from "@/lib/db";

export const dynamic = "force-dynamic";

function isValidQuiz(item) {
  return Boolean(
    item &&
    item.id &&
    item.prompt?.trim() &&
    item.term?.trim() &&
    item.meaning?.trim() &&
    (item.prefixId || item.rootId || item.suffixId)
  );
}

export async function POST(request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL이 설정되지 않았습니다." }, { status: 503 });
  }
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "교사용 관리 키가 올바르지 않습니다." }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!isValidQuiz(body.item)) {
      return NextResponse.json({ error: "퀴즈 데이터가 올바르지 않습니다." }, { status: 400 });
    }
    await upsertQuiz(body.item);
    return NextResponse.json({ content: await getContent() });
  } catch (error) {
    console.error("POST /api/quizzes failed", error);
    if (error.code === "23503") {
      return NextResponse.json({ error: "선택한 구성요소가 DB에 없습니다." }, { status: 409 });
    }
    return NextResponse.json({ error: "퀴즈를 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL이 설정되지 않았습니다." }, { status: 503 });
  }
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "교사용 관리 키가 올바르지 않습니다." }, { status: 401 });
  }
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "삭제할 ID가 없습니다." }, { status: 400 });
    const deleted = await deleteQuiz(id);
    if (!deleted) return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ content: await getContent() });
  } catch (error) {
    console.error("DELETE /api/quizzes failed", error);
    return NextResponse.json({ error: "퀴즈를 삭제하지 못했습니다." }, { status: 500 });
  }
}
