import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pr-evidence/db", () => ({
  getRepository: vi.fn(),
  upsertRepository: vi.fn(),
  getPullRequest: vi.fn(),
  upsertPullRequestShell: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock("@pr-evidence/github-client", () => ({
  fetchGithubRepo: vi.fn(),
  fetchGithubPullRequests: vi.fn(),
}));

import {
  createNotification,
  getPullRequest,
  getRepository,
  upsertPullRequestShell,
  upsertRepository,
} from "@pr-evidence/db";
import { fetchGithubPullRequests, fetchGithubRepo } from "@pr-evidence/github-client";
import { POST } from "./route";

describe("POST /api/repositories/[owner]/[repo]/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trả về 404 nếu không tìm thấy repo cả trên github lẫn trong db", async () => {
    vi.mocked(fetchGithubRepo).mockResolvedValueOnce(null);
    vi.mocked(getRepository).mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/repositories/owner/repo/sync", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ owner: "owner", repo: "repo" }) });
    expect(res.status).toBe(404);
  });

  it("đồng bộ thành công và ghi nhận PR mới", async () => {
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
        id: "owner/repo#2",
        repo: "owner/repo",
        number: 2,
        title: "PR 2",
        author: "author",
        headBranch: "feat-2",
        baseBranch: "main",
        description: "",
        url: "https://github.com/owner/repo/pull/2",
        state: "open",
        updatedAt: "2026-09-23T00:00:00.000Z",
      },
    ]);
    vi.mocked(getPullRequest).mockResolvedValueOnce(null); // new PR

    const req = new Request("http://localhost/api/repositories/owner/repo/sync", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ owner: "owner", repo: "repo" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.syncedCount).toBe(1);
    expect(data.newPrCount).toBe(1);

    expect(createNotification).toHaveBeenCalled();
    expect(upsertPullRequestShell).toHaveBeenCalled();
    expect(upsertRepository).toHaveBeenCalled();
  });
});
