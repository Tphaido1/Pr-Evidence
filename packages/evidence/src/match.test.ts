import { describe, expect, it } from "vitest";
import type { Hunk } from "./diff";
import { matchClaimToHunk, tokenize } from "./match";

const hunks: Hunk[] = [
  { file: "packages/checks/src/run.ts", lineStart: 12, lineEnd: 31, added: ["const killTimer = setTimeout(() => child.kill(), 60_000)"] },
  { file: "apps/runner/src/jobs/limits.ts", lineStart: 5, lineEnd: 18, added: ["export const MAX_MEMORY_MB = 512"] },
  { file: "README.md", lineStart: 1, lineEnd: 2, added: ["Tài liệu"] },
];

describe("tokenize", () => {
  it("bỏ dấu tiếng Việt, tách camelCase và snake_case", () => {
    const t = tokenize("Giới hạn maxMemory_mb");
    expect(t.has("gioi")).toBe(true);
    expect(t.has("max")).toBe(true);
    expect(t.has("memory")).toBe(true);
    expect(t.has("mb")).toBe(true);
  });
  it("bỏ từ nối tiếng Việt", () => {
    expect(tokenize("của và cho").size).toBe(0);
  });
  it("giữ số", () => {
    expect(tokenize("60 giây").has("60")).toBe(true);
  });
});

describe("matchClaimToHunk", () => {
  it("ghép claim với hunk có con số và thuật ngữ trùng", () => {
    const m = matchClaimToHunk("Giới hạn bộ nhớ 512 MB mỗi job", hunks);
    expect(m?.code.file).toBe("apps/runner/src/jobs/limits.ts");
    expect(m?.code.lineStart).toBe(5);
  });
  it("ghép qua con số khi claim nói 60 giây", () => {
    expect(matchClaimToHunk("Runner dừng job sau 60 giây", hunks)?.code.file).toBe("packages/checks/src/run.ts");
  });
  it("trả null khi không có gì trùng", () => {
    expect(matchClaimToHunk("Đổi màu nút bấm", hunks)).toBeNull();
  });
  it("trả null khi claim chỉ có từ nối", () => {
    expect(matchClaimToHunk("của và cho", hunks)).toBeNull();
  });
  it("trả null khi không có hunk", () => {
    expect(matchClaimToHunk("timeout 60", [])).toBeNull();
  });
  it("snippet ngắn hơn 120 ký tự", () => {
    const long: Hunk = { file: "a.ts", lineStart: 1, lineEnd: 1, added: ["timeout " + "x".repeat(300)] };
    expect(matchClaimToHunk("timeout", [long])?.code.snippet.length).toBeLessThanOrEqual(120);
  });
});
