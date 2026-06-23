export function isAdminAuthorized(request) {
  const expected = process.env.TEACHER_ADMIN_KEY;
  if (!expected) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-admin-key") === expected;
}
