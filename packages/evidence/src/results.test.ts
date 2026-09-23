import { describe, expect, it } from "vitest";
import { evidenceFor, relatedTests } from "./results";

const tests = [
  { file: "packages/checks/src/run.timeout.test.ts", passed: 3, failed: 0 },
  { file: "packages/checks/src/run.short.test.ts", passed: 0, failed: 1 },
  { file: "packages/checks/src/runner.test.ts", passed: 9, failed: 0 },
  { file: "packages/other/src/run.test.ts", passed: 4, failed: 0 },
];

describe("relatedTests", () => {
  it("lấy test cạnh file nguồn, kể cả run.timeout.test.ts", () => {
    const r = relatedTests("packages/checks/src/run.ts", tests).map((t) => t.file);
    expect(r).toEqual(["packages/checks/src/run.timeout.test.ts", "packages/checks/src/run.short.test.ts"]);
  });
  it("không nhầm runner.test.ts với run.ts", () => {
    expect(relatedTests("packages/checks/src/run.ts", tests).some((t) => t.file.endsWith("runner.test.ts"))).toBe(false);
  });
});

describe("evidenceFor", () => {
  it("test_pass khi mọi test liên quan đều qua", () => {
    const e = evidenceFor("packages/checks/src/runner.ts", tests, []);
    expect(e).toEqual({ kind: "test_pass", detail: "runner.test.ts · 9/9 qua" });
  });
  it("test_fail nếu có bất kỳ test lỗi", () => {
    const e = evidenceFor("packages/checks/src/run.ts", tests, []);
    expect(e.kind).toBe("test_fail");
    expect(e.detail).toContain("1 lỗi");
  });
  it("lint_only khi chỉ có kết quả lint", () => {
    expect(evidenceFor("a/x.ts", [], [{ file: "a/x.ts", errors: 0 }]).kind).toBe("lint_only");
    expect(evidenceFor("a/x.ts", [], [{ file: "a/x.ts", errors: 2 }]).detail).toContain("2 lỗi");
  });
  it("none khi không có test lẫn lint", () => {
    expect(evidenceFor("a/x.ts", [], [])).toEqual({ kind: "none", detail: "Chưa có test" });
  });
  it("test ở thư mục khác không tính", () => {
    expect(evidenceFor("packages/x/src/run.ts", tests, []).kind).toBe("none");
  });
});
