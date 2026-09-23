import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pr-evidence/db", () => ({
  listRepositories: vi.fn(),
  upsertRepository: vi.fn(),
  getPullRequest: vi.fn(),
  upsertPullRequestShell: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock("@pr-evidence/github-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@pr-evidence/github-client")>();
  return {
    ...actual,
    fetchGithubRepo: vi.fn(),
    fetchGithubPullRequests: vi.fn(),
  };
});

import {
  createNotification,
  getPullRequest,
  listRepositories,
  upsertPullRequestShell,
  upsertRepository,
} from "@pr-evidence/db";
import { fetchGithubPullRequests, fetchGithubRepo } from "@pr-evidence/github-client";
import { GET, POST } from "./route";

describe("Repositories API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/repositories", () => {
    it("trả về danh sách repository", async () => {
      const mockRepos = [
        {
          id: "owner/repo",
          owner: "owner",
          name: "repo",
          url: "https://github.com/owner/repo",
          defaultBranch: "main",
          openPrCount: 2,
          lastSyncedAt: "2026-09-23T00:00:00.000Z",
        },
      ];
      vi.mocked(listRepositories).mockResolvedValueOnce(mockRepos);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockRepos);
    });
  });

  describe("POST /api/repositories", () => {
    it("trả về 400 nếu tên repo không hợp lệ", async () => {
      const req = new Request("http://localhost/api/repositories", {
        method: "POST",
        body: JSON.stringify({ repo: "invalid-name" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("owner/repo");
    });

    it("trả về 404 nếu không tìm thấy repo trên GitHub", async () => {
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/repositories", {
        method: "POST",
        body: JSON.stringify({ repo: "owner/nonexistent" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    it("thêm repository thành công và tạo notification cho PR mới", async () => {
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
        id: "owner/repo",
        owner: "owner",
        name: "repo",
        url: "https://github.com/owner/repo",
        defaultBranch: "main",
        openPrCount: 1,
        lastSyncedAt: "2026-09-23T00:00:00.000Z",
      });

      vi.mocked(fetchGithubPullRequests).mockResolvedValueOnce([
        {
          id: "owner/repo#1",
          repo: "owner/repo",
          number: 1,
          title: "PR Title",
          author: "octocat",
          headBranch: "feat",
          baseBranch: "main",
          description: "PR desc",
          url: "https://github.com/owner/repo/pull/1",
          state: "open",
          updatedAt: "2026-09-23T00:00:00.000Z",
        },
      ]);

      vi.mocked(getPullRequest).mockResolvedValueOnce(null); // Chưa tồn tại -> PR mới

      const req = new Request("http://localhost/api/repositories", {
        method: "POST",
        body: JSON.stringify({ repo: "owner/repo" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.syncedPulls).toBe(1);
      expect(data.newPrCount).toBe(1);

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "new_pr",
          repo: "owner/repo",
          prNumber: 1,
          title: "PR Title",
          author: "octocat",
        }),
      );
      expect(upsertPullRequestShell).toHaveBeenCalled();
      expect(upsertRepository).toHaveBeenCalled();
    });

    it("tự động chuẩn hóa khi người dùng nhập full URL https://github.com/owner/repo", async () => {
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
        id: "owner/repo",
        owner: "owner",
        name: "repo",
        url: "https://github.com/owner/repo",
        defaultBranch: "main",
        openPrCount: 0,
        lastSyncedAt: "2026-09-23T00:00:00.000Z",
      });
      vi.mocked(fetchGithubPullRequests).mockResolvedValueOnce([]);

      const req = new Request("http://localhost/api/repositories", {
        method: "POST",
        body: JSON.stringify({ repo: "https://github.com/owner/repo" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(fetchGithubRepo).toHaveBeenCalledWith("owner/repo", expect.anything());
    });
  });
});
