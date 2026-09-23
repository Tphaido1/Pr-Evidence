import { describe, expect, it } from "vitest";
import type { RunResult } from "@pr-evidence/checks";
import { runChecks, type Exec } from "./run-checks";

const res = (over: Partial<RunResult>): RunResult => ({
  exitCode: 0, timedOut: false, truncated: false, durationMs: 1, stdout: "", stderr: "", ...over,
});

describe("runChecks", () => {
  it("chạy test rồi lint và đọc kết quả", async () => {
    const calls: string[][] = [];
    const exec: Exec = async (command) => {
      calls.push(command);
      return command.includes("vitest")
        ? res({ stdout: JSON.stringify({ testResults: [{ name: "/r/a.test.ts", assertionResults: [{ status: "passed" }] }] }) })
        : res({ stdout: JSON.stringify([{ filePath: "/r/a.ts", errorCount: 1 }]) });
    };
    const out = await runChecks({ repoDir: "/r", timeoutMs: 1000 }, exec);
    expect(calls[0]).toContain("vitest");
    expect(calls[1]).toContain("eslint");
    expect(out.tests).toEqual([{ file: "a.test.ts", passed: 1, failed: 0 }]);
    expect(out.lints).toEqual([{ file: "a.ts", errors: 1 }]);
    expect(out.timedOut).toBe(false);
    expect(out.sandboxed).toBe(false);
  });

  it("ghi lại sandboxed=true khi được truyền vào", async () => {
    const exec: Exec = async () => res({ stdout: "[]" });
    const out = await runChecks({ repoDir: "/r", timeoutMs: 1000 }, exec, true);
    expect(out.sandboxed).toBe(true);
  });

  it("test quá thời gian thì bỏ kết quả và báo timedOut", async () => {
    const exec: Exec = async (command) =>
      command.includes("vitest") ? res({ timedOut: true, stdout: '{"testResults":[]}' }) : res({ stdout: "[]" });
    const out = await runChecks({ repoDir: "/r", timeoutMs: 1 }, exec);
    expect(out.timedOut).toBe(true);
    expect(out.tests).toEqual([]);
  });

  it("lint không có JSON (chưa cấu hình eslint) thì không làm hỏng kết quả test", async () => {
    const exec: Exec = async (command) =>
      command.includes("vitest")
        ? res({ stdout: JSON.stringify({ testResults: [{ name: "/r/a.test.ts", assertionResults: [{ status: "passed" }] }] }) })
        : res({ exitCode: 2, stdout: "", stderr: "no config" });
    const out = await runChecks({ repoDir: "/r", timeoutMs: 1000 }, exec);
    expect(out.tests).toHaveLength(1);
    expect(out.lints).toEqual([]);
  });
});
