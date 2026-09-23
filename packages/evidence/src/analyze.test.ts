import { describe, expect, it } from "vitest";
import { analyze, type AnalyzeInput } from "./analyze";

const base: AnalyzeInput = {
  repo: "acme/pr-evidence",
  number: 42,
  title: "Thêm giới hạn thời gian",
  author: "minh",
  headBranch: "feature/timeout",
  baseBranch: "main",
  description: "Thay đổi này làm gì:\n- Runner dừng job sau 60 giây\n- Đổi màu nút bấm\n\nCách kiểm tra:\n- test\n\nPhần nào do AI viết (nếu có):\nKhông\n",
  commits: [
    { message: "feat: runner có timeout\n\nCo-authored-by: Claude <a@b.c>", additions: 30 },
    { message: "fix: dọn log", additions: 70 },
  ],
  diff: `diff --git a/packages/checks/src/run.ts b/packages/checks/src/run.ts
--- a/packages/checks/src/run.ts
+++ b/packages/checks/src/run.ts
@@ -1 +12,2 @@
+const killTimer = setTimeout(() => child.kill(), 60_000)
+clearTimeout(killTimer)
`,
  tests: [{ file: "packages/checks/src/run.timeout.test.ts", passed: 3, failed: 0 }],
  lints: [],
  now: new Date("2026-09-22T00:00:00Z"),
};

describe("analyze", () => {
  const pr = analyze(base);

  it("dựng id, metadata và thời gian", () => {
    expect(pr.id).toBe("acme/pr-evidence#42");
    expect(pr.updatedAt).toBe("2026-09-22T00:00:00.000Z");
  });

  it("tính phần trăm AI theo dòng thêm vào", () => {
    expect(pr.aiPercent).toBe(30);
  });

  it("claim ghép được có code và test_pass", () => {
    const c = pr.claims.find((x) => x.text.includes("60 giây"));
    expect(c?.code.file).toBe("packages/checks/src/run.ts");
    expect(c?.code.lineStart).toBe(12);
    expect(c?.evidence.kind).toBe("test_pass");
    expect(c?.review).toBe("pending");
  });

  it("claim không ghép được ghi rõ là chưa có evidence", () => {
    const c = pr.claims.find((x) => x.text.includes("nút bấm"));
    expect(c?.code.file).toBe("");
    expect(c?.evidence).toEqual({ kind: "none", detail: "Chưa ghép được đoạn code" });
  });

  it("claim từ commit của AI được gắn nhãn AI, claim từ mô tả theo lời khai", () => {
    const fromCommit = pr.claims.find((x) => x.text.includes("timeout"));
    expect(fromCommit?.aiWritten).toBe(true);
    const fromDesc = pr.claims.find((x) => x.text.includes("60 giây"));
    expect(fromDesc?.aiWritten).toBe(false);
  });

  it("id claim đánh số từ c1 và không trùng", () => {
    const ids = pr.claims.map((c) => c.id);
    expect(ids[0]).toBe("c1");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("PR không có claim vẫn trả về hợp lệ", () => {
    const empty = analyze({ ...base, description: "", commits: [] });
    expect(empty.claims).toEqual([]);
    expect(empty.aiPercent).toBe(0);
  });
});
