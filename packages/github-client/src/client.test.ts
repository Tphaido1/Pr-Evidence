import { describe, expect, it, vi } from "vitest";
import type { PullRequest } from "@pr-evidence/types";
import { publishResults } from "./client";

const pr: PullRequest = {
  id: "a/b#1", repo: "a/b", number: 1, title: "t", author: "x",
  headBranch: "h", baseBranch: "main", aiPercent: 0, claims: [], analysisStatus: "done", updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("publishResults", () => {
  it("gọi check-runs rồi issues/comments với đúng repo và số PR", async () => {
    const calls: { path: string; init: { method: string; body: unknown } }[] = [];
    const fetchImpl = vi.fn(async (path: string, init: { method: string; body: unknown }) => {
      calls.push({ path, init });
      return { ok: true, status: 200, text: async () => "" };
    });
    await publishResults(pr, "abc123", { token: "t", fetchImpl });
    expect(calls[0]?.path).toBe("/repos/a/b/check-runs");
    expect((calls[0]?.init.body as { head_sha: string }).head_sha).toBe("abc123");
    expect(calls[1]?.path).toBe("/repos/a/b/issues/1/comments");
  });

  it("không ném lỗi khi GitHub trả về lỗi, chỉ ghi log", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, text: async () => "boom" }));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(publishResults(pr, "abc", { token: "t", fetchImpl })).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it("fetchPullRequestDetail lấy chi tiết PR và headSha", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        number: 42,
        title: "Test PR",
        user: { login: "alice" },
        body: "PR body",
        html_url: "https://github.com/a/b/pull/42",
        state: "open",
        head: { ref: "feature", sha: "sha123" },
        base: { ref: "main" },
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
    }));
    const { fetchPullRequestDetail } = await import("./client");
    const detail = await fetchPullRequestDetail("a/b", 42, { fetchImpl });
    expect(detail).toBeDefined();
    expect(detail?.headSha).toBe("sha123");
    expect(detail?.author).toBe("alice");
  });

  it("fetchPullRequestDiff truyền header diff và trả về raw text", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const fetchImpl = vi.fn(async (_path: string, init: { headers?: Record<string, string> }) => {
      capturedHeaders = init.headers;
      return { ok: true, status: 200, text: async () => "diff --git a/file b/file" };
    });
    const { fetchPullRequestDiff } = await import("./client");
    const diff = await fetchPullRequestDiff("a/b", 42, { fetchImpl });
    expect(diff).toBe("diff --git a/file b/file");
    expect(capturedHeaders?.accept).toBe("application/vnd.github.v3.diff");
  });

  it("fetchPullRequestCommits lấy danh sách commit", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([
        { sha: "c1", commit: { message: "feat: add feature" }, stats: { additions: 10 } },
      ]),
    }));
    const { fetchPullRequestCommits } = await import("./client");
    const commits = await fetchPullRequestCommits("a/b", 42, { fetchImpl });
    expect(commits).toHaveLength(1);
    expect(commits[0]?.message).toBe("feat: add feature");
    expect(commits[0]?.additions).toBe(10);
  });

  it("fetchPullRequestChecks phân loại test và lint", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        check_runs: [
          { name: "unit-tests", status: "completed", conclusion: "success" },
          { name: "eslint", status: "completed", conclusion: "failure" },
        ],
      }),
    }));
    const { fetchPullRequestChecks } = await import("./client");
    const checks = await fetchPullRequestChecks("a/b", "sha123", { fetchImpl });
    expect(checks.tests).toHaveLength(1);
    expect(checks.tests[0]?.passed).toBe(1);
    expect(checks.tests[0]?.failed).toBe(0);
    expect(checks.lints).toHaveLength(1);
    expect(checks.lints[0]?.errors).toBe(1);
  });
});

