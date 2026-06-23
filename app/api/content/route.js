import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getContent, hasDatabase, replaceContent } from "@/lib/db";

export const dynamic = "force-dynamic";

function isValidContent(content) {
  return Boolean(
    content &&
    content.morphemes &&
    Array.isArray(content.morphemes.prefix) &&
    Array.isArray(content.morphemes.root) &&
    Array.isArray(content.morphemes.suffix) &&
    Array.isArray(content.quizzes)
  );
}

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL이 설정되지 않았습니다." }, { status: 503 });
  }
  try {
    const content = await getContent();
    if (!content.morphemes.prefix.length && !content.morphemes.root.length && !content.morphemes.suffix.length) {
      return NextResponse.json({ error: "DB 초기 데이터가 없습니다. npm run db:setup을 실행하세요." }, { status: 404 });
    }
    return NextResponse.json({ content });
  } catch (error) {
    console.error("GET /api/content failed", error);
    return NextResponse.json({ error: "Neon에서 콘텐츠를 읽지 못했습니다." }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL이 설정되지 않았습니다." }, { status: 503 });
  }
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "교사용 관리 키가 올바르지 않습니다." }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!isValidContent(body.content)) {
      return NextResponse.json({ error: "콘텐츠 데이터 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const content = await replaceContent(body.content);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("PUT /api/content failed", error);
    return NextResponse.json({ error: "Neon에 콘텐츠를 저장하지 못했습니다." }, { status: 500 });
  }
}
