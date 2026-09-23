export const SESSION_COOKIE = "pr_evidence_session";
const ONE_WEEK_S = 60 * 60 * 24 * 7;

// Dùng Web Crypto (globalThis.crypto.subtle) thay vì node:crypto vì middleware.ts
// chạy trên Edge runtime, không có module node:crypto.
async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(secret: string, value: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toHex(sig);
}

/** Token = "<hạn dùng theo epoch giây>.<chữ ký HMAC>". Không lưu session ở server. */
export async function createSessionToken(secret: string, ttlSeconds = ONE_WEEK_S): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${exp}.${await sign(secret, String(exp))}`;
}

export async function verifySessionToken(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await sign(secret, expStr);
  // Độ dài cố định (hex SHA-256 = 64 ký tự) nên so sánh từng ký tự vẫn không rò rỉ nhiều qua thời gian.
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
