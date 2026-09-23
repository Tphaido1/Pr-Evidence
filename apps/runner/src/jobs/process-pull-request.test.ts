import { describe, expect, it, vi } from "vitest";
import type { PullRequest } from "@pr-evidence/types";
import { processPullRequest } from "./process-pull-request";

describe("processPullRequest", () => {
  it("chạy check, dựng bảng claim rồi lưu", async () => {
    const save = vi.fn(async (_pr: PullRequest) => {});
    const pr = await processPullRequest(
      {
        repoDir: "/r", timeoutMs: 1000,
        repo: "acme/x", number: 1, title: "t", author: "a", headBranch: "h", baseBranch: "main",
        description: "Thay đổi này làm gì:\n- Timeout 60 giây\n",
        commits: [{ message: "x", additions: 3 }],
        diff: "--- a/src/run.ts\n+++ b/src/run.ts\n@@ -1 +1 @@\n+setTimeout(f, 60_000)\n",
      },
      {
        runChecks: async () => ({ tests: [{ file: "src/run.test.ts", passed: 2, failed: 0 }], lints: [], timedOut: false, sandboxed: false }),
        save,
      },
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]?.[0]).toBe(pr);
    expect(pr.claims[0]?.evidence.kind).toBe("test_pass");
  });

  it("lỗi khi lưu thì đẩy lên cho người gọi xử lý", async () => {
    await expect(
      processPullRequest(
        { repoDir: "/r", timeoutMs: 1, repo: "a/b", number: 1, title: "", author: "", headBranch: "", baseBranch: "", description: "", commits: [], diff: "" },
        { runChecks: async () => ({ tests: [], lints: [], timedOut: false, sandboxed: false }), save: async () => { throw new Error("db"); } },
      ),
    ).rejects.toThrow("db");
  });
});
