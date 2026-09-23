import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySignature } from "./github-signature";

const sign = (secret: string, body: string) =>
  "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

describe("verifySignature", () => {
  it("nhận chữ ký đúng", () => {
    expect(verifySignature("s3", "{}", sign("s3", "{}"))).toBe(true);
  });
  it("từ chối chữ ký sai secret", () => {
    expect(verifySignature("s3", "{}", sign("khac", "{}"))).toBe(false);
  });
  it("từ chối khi body bị sửa", () => {
    expect(verifySignature("s3", '{"a":1}', sign("s3", "{}"))).toBe(false);
  });
  it("từ chối khi thiếu header hoặc sai định dạng", () => {
    expect(verifySignature("s3", "{}", null)).toBe(false);
    expect(verifySignature("s3", "{}", "abc")).toBe(false);
  });
});
