import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { deleteMorpheme, getContent, hasDatabase, upsertMorpheme } from "@/lib/db";

export const dynamic = "force-dynamic";

function isValidMorpheme(item) {
  return Boolean(
    item &&
    item.id &&
    ["prefix", "root", "suffix"].includes(item.type) &&
    item.text?.trim() &&
    item.meaning?.trim()
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
    if (!isValidMorpheme(body.item)) {
      return NextResponse.json({ error: "구성요소 데이터가 올바르지 않습니다." }, { status: 400 });
    }
    await upsertMorpheme(body.item);
    return NextResponse.json({ content: await getContent() });
  } catch (error) {
    console.error("POST /api/morphemes failed", error);
    return NextResponse.json({ error: "구성요소를 저장하지 못했습니다." }, { status: 500 });
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
    const deleted = await deleteMorpheme(id);
    if (!deleted) return NextResponse.json({ error: "구성요소를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ content: await getContent() });
  } catch (error) {
    console.error("DELETE /api/morphemes failed", error);
    return NextResponse.json({ error: "구성요소를 삭제하지 못했습니다." }, { status: 500 });
  }
}
