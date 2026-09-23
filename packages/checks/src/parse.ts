export interface TestFileResult {
  /** Đường dẫn file test, tương đối so với thư mục gốc repo */
  file: string;
  passed: number;
  failed: number;
}

interface VitestJson {
  testResults?: {
    name: string;
    assertionResults?: { status: string }[];
  }[];
}

/** Đọc output của `vitest run --reporter=json`. */
export function parseVitestJson(json: string, repoRoot: string): TestFileResult[] {
  let data: VitestJson;
  try {
    data = JSON.parse(json) as VitestJson;
  } catch {
    return [];
  }
  const root = repoRoot.replace(/\/+$/, "") + "/";
  return (data.testResults ?? []).map((f) => {
    const a = f.assertionResults ?? [];
    return {
      file: f.name.startsWith(root) ? f.name.slice(root.length) : f.name,
      passed: a.filter((x) => x.status === "passed").length,
      failed: a.filter((x) => x.status === "failed").length,
    };
  });
}

export interface LintFileResult {
  file: string;
  errors: number;
}

interface EslintJson {
  filePath: string;
  errorCount: number;
}

/** Đọc output của `eslint -f json`. */
export function parseEslintJson(json: string, repoRoot: string): LintFileResult[] {
  let data: EslintJson[];
  try {
    data = JSON.parse(json) as EslintJson[];
  } catch {
    return [];
  }
  const root = repoRoot.replace(/\/+$/, "") + "/";
  return data.map((f) => ({
    file: f.filePath.startsWith(root) ? f.filePath.slice(root.length) : f.filePath,
    errors: f.errorCount,
  }));
}
