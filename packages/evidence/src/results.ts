import type { Evidence } from "@pr-evidence/types";

export interface TestResult {
  file: string;
  passed: number;
  failed: number;
}

export interface LintResult {
  file: string;
  errors: number;
}

function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i === -1 ? "" : p.slice(0, i);
}
function basename(p: string): string {
  return p.slice(p.lastIndexOf("/") + 1);
}

/**
 * Test "cạnh" file nguồn: cùng thư mục, tên bắt đầu bằng tên file nguồn, chứa ".test.".
 * Ví dụ run.ts có run.test.ts và run.timeout.test.ts.
 */
export function relatedTests(sourceFile: string, tests: TestResult[]): TestResult[] {
  const stem = basename(sourceFile).replace(/\.[^.]+$/, "");
  const dir = dirname(sourceFile);
  return tests.filter((t) => {
    const b = basename(t.file);
    return dirname(t.file) === dir && b.startsWith(stem + ".") && b.includes(".test.");
  });
}

export function evidenceFor(sourceFile: string, tests: TestResult[], lints: LintResult[]): Evidence {
  const related = relatedTests(sourceFile, tests);
  const failed = related.reduce((n, t) => n + t.failed, 0);
  const passed = related.reduce((n, t) => n + t.passed, 0);
  const names = related.map((t) => basename(t.file)).join(", ");

  if (failed > 0) return { kind: "test_fail", detail: `${names} · ${failed} lỗi` };
  if (passed > 0) return { kind: "test_pass", detail: `${names} · ${passed}/${passed} qua` };

  const lint = lints.find((l) => l.file === sourceFile);
  if (lint) {
    return {
      kind: "lint_only",
      detail: lint.errors > 0 ? `Lint báo ${lint.errors} lỗi, chưa có test` : "Chưa có test",
    };
  }
  return { kind: "none", detail: "Chưa có test" };
}
