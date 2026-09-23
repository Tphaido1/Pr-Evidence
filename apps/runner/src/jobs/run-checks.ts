import { isDockerAvailable, parseEslintJson, parseVitestJson, runCommand, runInDocker, type RunResult } from "@pr-evidence/checks";
import type { LintResult, TestResult } from "@pr-evidence/evidence";

export interface RunChecksInput {
  /** Thư mục repo đã checkout đúng commit của PR */
  repoDir: string;
  timeoutMs: number;
}

export interface ChecksOutput {
  tests: TestResult[];
  lints: LintResult[];
  /** Có lệnh nào bị dừng vì quá thời gian */
  timedOut: boolean;
  /** Đã chạy trong container cô lập (không mạng, chỉ đọc) hay chạy trực tiếp trên host */
  sandboxed: boolean;
}

/** Một lệnh đầy đủ, ví dụ ["pnpm", "exec", "vitest", "run"]. cwd luôn là thư mục repo trên host. */
export type Exec = (command: string[], opts: { cwd: string; timeoutMs: number }) => Promise<RunResult>;

export const execPlain: Exec = (command, opts) => runCommand(command[0]!, command.slice(1), opts);

export const execInDocker: Exec = (command, opts) =>
  runInDocker({ repoDir: opts.cwd, command, timeoutMs: opts.timeoutMs });

/** Chọn cách chạy: có Docker thì cô lập bằng container (không mạng, filesystem chỉ đọc), không thì chạy trực tiếp có giới hạn thời gian/danh sách lệnh/không kế thừa env. */
export async function pickExec(): Promise<{ exec: Exec; sandboxed: boolean }> {
  return (await isDockerAvailable())
    ? { exec: execInDocker, sandboxed: true }
    : { exec: execPlain, sandboxed: false };
}

/** Chạy test rồi lint. `exec` truyền vào được để test không cần Docker hay chạy lệnh thật. */
export async function runChecks(
  input: RunChecksInput,
  exec: Exec = execPlain,
  sandboxed = false,
): Promise<ChecksOutput> {
  const opts = { cwd: input.repoDir, timeoutMs: input.timeoutMs };

  const test = await exec(["pnpm", "exec", "vitest", "run", "--reporter=json"], opts);
  const lint = await exec(["pnpm", "exec", "eslint", ".", "-f", "json"], opts);

  return {
    tests: test.timedOut ? [] : parseVitestJson(test.stdout, input.repoDir),
    lints: lint.timedOut ? [] : parseEslintJson(lint.stdout, input.repoDir),
    timedOut: test.timedOut || lint.timedOut,
    sandboxed,
  };
}
