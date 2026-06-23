import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "관리 코드가 올바르지 않습니다." }, { status: 401 });
  }
  return NextResponse.json({ authorized: true });
}
