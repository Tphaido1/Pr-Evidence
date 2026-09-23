import { analyze, type AnalyzeInput } from "@pr-evidence/evidence";
import type { PullRequest } from "@pr-evidence/types";
import { execPlain, pickExec, runChecks, type Exec, type ChecksOutput, type RunChecksInput } from "./run-checks";

export interface ProcessInput extends Omit<AnalyzeInput, "tests" | "lints"> {
  repoDir: string;
  timeoutMs: number;
}

export interface ProcessDeps {
  /** Mặc định tự dò Docker; test hoặc CLI truyền vào để chọn cách chạy tường minh. */
  runChecks?: (input: RunChecksInput) => Promise<ChecksOutput>;
  save: (pr: PullRequest) => Promise<void>;
}

async function defaultRunChecks(input: RunChecksInput): Promise<ChecksOutput> {
  const { exec, sandboxed } = await pickExec();
  return runChecks(input, exec, sandboxed);
}

/** Chạy test/lint (cô lập bằng Docker nếu có), dựng bảng claim-code-evidence rồi lưu. Trả về PR đã lưu. */
export async function processPullRequest(input: ProcessInput, deps: ProcessDeps): Promise<PullRequest> {
  const { repoDir, timeoutMs, ...rest } = input;
  const checks = await (deps.runChecks ?? defaultRunChecks)({ repoDir, timeoutMs });
  const pr = analyze({ ...rest, tests: checks.tests, lints: checks.lints });
  await deps.save(pr);
  return pr;
}

export { execPlain, pickExec, runChecks };
export type { Exec };
