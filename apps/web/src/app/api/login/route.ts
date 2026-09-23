import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const secret = process.env.SESSION_SECRET;
  const password = process.env.REVIEWER_PASSWORD;
  if (!secret || !password) return new Response("Thiếu REVIEWER_PASSWORD hoặc SESSION_SECRET", { status: 500 });

  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  if (body?.password !== password) {
    return Response.json({ error: "Sai mật khẩu" }, { status: 401 });
  }

  const token = await createSessionToken(secret);
  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return res;
}
