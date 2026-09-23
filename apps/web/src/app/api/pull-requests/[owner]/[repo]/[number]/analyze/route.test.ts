import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pr-evidence/db", () => ({
  getPullRequest: vi.fn(),
  savePullRequest: vi.fn(),
  setAnalysisStatus: vi.fn(),
}));

vi.mock("@pr-evidence/evidence", () => ({
  analyze: vi.fn(),
}));

vi.mock("@pr-evidence/github-client", () => ({
  fetchPullRequestDetail: vi.fn(),
  fetchPullRequestDiff: vi.fn(),
  fetchPullRequestCommits: vi.fn(),
  fetchPullRequestChecks: vi.fn(),
}));

import { getPullRequest, savePullRequest, setAnalysisStatus } from "@pr-evidence/db";
import { analyze } from "@pr-evidence/evidence";
import {
  fetchPullRequestChecks,
  fetchPullRequestCommits,
  fetchPullRequestDetail,
  fetchPullRequestDiff,
} from "@pr-evidence/github-client";
import { POST } from "./route";

describe("POST /api/pull-requests/[owner]/[repo]/[number]/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("phân tích thành công từ GitHub API và lưu kết quả vào DB", async () => {
    vi.mocked(fetchPullRequestDetail).mockResolvedValueOnce({
      id: "owner/repo#1",
      repo: "owner/repo",
      number: 1,
      title: "Add Login",
      author: "alice",
      headBranch: "feat",
      headSha: "sha123",
      baseBranch: "main",
      description: "Thêm tính năng đăng nhập",
      url: "https://github.com/owner/repo/pull/1",
      state: "open",
      updatedAt: "2026-09-23T00:00:00.000Z",
    });

    vi.mocked(fetchPullRequestDiff).mockResolvedValueOnce("diff content");
    vi.mocked(fetchPullRequestCommits).mockResolvedValueOnce([
      { message: "feat: add login", additions: 20 },
    ]);
    vi.mocked(fetchPullRequestChecks).mockResolvedValueOnce({ tests: [], lints: [] });

    const mockAnalyzed = {
      id: "owner/repo#1",
      repo: "owner/repo",
      number: 1,
      title: "Add Login",
      author: "alice",
      headBranch: "feat",
      baseBranch: "main",
      aiPercent: 0,
      claims: [
        {
          id: "c1",
          text: "Thêm tính năng đăng nhập",
          code: { file: "auth.ts", lineStart: 1, lineEnd: 5, snippet: "code" },
          evidence: { kind: "none" as const, detail: "" },
          aiWritten: false,
          review: "pending" as const,
        },
      ],
      analysisStatus: "done" as const,
      updatedAt: "2026-09-23T00:00:00.000Z",
    };
    vi.mocked(analyze).mockReturnValueOnce(mockAnalyzed);

    const req = new Request("http://localhost/api/pull-requests/owner/repo/1/analyze", { method: "POST" });
    const res = await POST(req, {
      params: Promise.resolve({ owner: "owner", repo: "repo", number: "1" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.claimsCount).toBe(1);
    expect(setAnalysisStatus).toHaveBeenCalledWith("owner/repo#1", "analyzing");
    expect(analyze).toHaveBeenCalledWith(
      expect.objectContaining({
        repo: "owner/repo",
        number: 1,
        diff: "diff content",
      }),
    );
    expect(savePullRequest).toHaveBeenCalledWith(mockAnalyzed);
  });

  it("trả về 404 nếu không tìm thấy PR cả trên GitHub lẫn trong DB", async () => {
    vi.mocked(fetchPullRequestDetail).mockResolvedValueOnce(null);
    vi.mocked(getPullRequest).mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/pull-requests/owner/repo/999/analyze", { method: "POST" });
    const res = await POST(req, {
      params: Promise.resolve({ owner: "owner", repo: "repo", number: "999" }),
    });

    expect(res.status).toBe(404);
    expect(setAnalysisStatus).toHaveBeenCalledWith("owner/repo#999", "failed", expect.anything());
  });
});
