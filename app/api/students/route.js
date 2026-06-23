import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getStudentStats, hasDatabase, upsertStudent } from "@/lib/db";

export const dynamic = "force-dynamic";

function validStudent(student) {
  return Boolean(
    student &&
    typeof student.id === "string" &&
    student.id.length >= 8 &&
    student.id.length <= 100 &&
    typeof student.nickname === "string" &&
    student.nickname.trim().length >= 1 &&
    student.nickname.trim().length <= 20
  );
}

export async function POST(request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL이 설정되지 않았습니다." }, { status: 503 });
  }
  try {
    const body = await request.json();
    if (!validStudent(body.student)) {
      return NextResponse.json({ error: "닉네임은 1~20자로 입력하세요." }, { status: 400 });
    }
    const student = await upsertStudent({
      id: body.student.id,
      nickname: body.student.nickname.trim()
    });
    return NextResponse.json({
      student: { id: student.id, nickname: student.nickname }
    });
  } catch (error) {
    console.error("POST /api/students failed", error);
    return NextResponse.json({ error: "학생 정보를 등록하지 못했습니다." }, { status: 500 });
  }
}

export async function GET(request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL이 설정되지 않았습니다." }, { status: 503 });
  }
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "교사용 관리 키가 올바르지 않습니다." }, { status: 401 });
  }
  try {
    const stats = await getStudentStats();
    return NextResponse.json({
      total: stats.total,
      activeWeek: stats.active_week
    });
  } catch (error) {
    console.error("GET /api/students failed", error);
    return NextResponse.json({ error: "학생 현황을 불러오지 못했습니다." }, { status: 500 });
  }
}
