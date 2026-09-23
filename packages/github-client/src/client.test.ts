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
});
