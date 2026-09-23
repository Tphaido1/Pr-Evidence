import { describe, expect, it } from "vitest";
import { fetchGithubPullRequests, fetchGithubRepo, type GithubFetch } from "./client";

describe("fetchGithubRepo", () => {
  it("trả về FetchedRepo khi API thành công", async () => {
    const mockFetch: GithubFetch = async (path) => {
      expect(path).toBe("/repos/acme/pr-evidence");
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            full_name: "acme/pr-evidence",
            name: "pr-evidence",
            owner: { login: "acme" },
            description: "Evidence app",
            html_url: "https://github.com/acme/pr-evidence",
            default_branch: "main",
            open_issues_count: 5,
          }),
      };
    };

    const repo = await fetchGithubRepo("acme/pr-evidence", { fetchImpl: mockFetch });
    expect(repo).not.toBeNull();
    expect(repo?.id).toBe("acme/pr-evidence");
    expect(repo?.owner).toBe("acme");
    expect(repo?.name).toBe("pr-evidence");
    expect(repo?.openPrCount).toBe(5);
  });

  it("trả về null khi API lỗi (ví dụ 404)", async () => {
    const mockFetch: GithubFetch = async () => ({
      ok: false,
      status: 404,
      text: async () => "Not Found",
    });

    const repo = await fetchGithubRepo("unknown/repo", { fetchImpl: mockFetch });
    expect(repo).toBeNull();
  });
});

describe("fetchGithubPullRequests", () => {
  it("trả về danh sách PRs đã map chuẩn", async () => {
    const mockFetch: GithubFetch = async (path) => {
      expect(path).toContain("/repos/acme/pr-evidence/pulls");
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              number: 42,
              title: "Thêm timeout",
              user: { login: "minh" },
              body: "Thay đổi này làm gì:\n- Timeout",
              html_url: "https://github.com/acme/pr-evidence/pull/42",
              state: "open",
              head: { ref: "feat/timeout" },
              base: { ref: "main" },
              updated_at: "2026-09-22T00:00:00Z",
            },
          ]),
      };
    };

    const pulls = await fetchGithubPullRequests("acme/pr-evidence", { fetchImpl: mockFetch });
    expect(pulls).toHaveLength(1);
    expect(pulls[0]?.id).toBe("acme/pr-evidence#42");
    expect(pulls[0]?.author).toBe("minh");
    expect(pulls[0]?.headBranch).toBe("feat/timeout");
    expect(pulls[0]?.baseBranch).toBe("main");
  });

  it("trả về mảng rỗng khi API lỗi", async () => {
    const mockFetch: GithubFetch = async () => ({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const pulls = await fetchGithubPullRequests("acme/pr-evidence", { fetchImpl: mockFetch });
    expect(pulls).toEqual([]);
  });
});
