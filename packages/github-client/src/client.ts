import type { PullRequest } from "@pr-evidence/types";
import { checkRunConclusion, renderSummaryMarkdown } from "./markdown";

export interface GithubFetch {
  (path: string, init: { method: string; body: unknown }): Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
}

export interface GithubClientOptions {
  token: string;
  /** Cho test thay fetch thật. Mặc định gọi https://api.github.com. */
  fetchImpl?: GithubFetch;
}

function makeFetch(token?: string): GithubFetch {
  return async (path, init) => {
    const headers: Record<string, string> = {
      accept: "application/vnd.github+json",
      "user-agent": "pr-evidence-app",
    };
    if (token) headers.authorization = `Bearer ${token}`;
    if (init.body !== undefined) {
      headers["content-type"] = "application/json";
    }
    const res = await fetch(`https://api.github.com${path}`, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    return { ok: res.ok, status: res.status, text: () => res.text() };
  };
}

export interface FetchedPullRequest {
  id: string;
  repo: string;
  number: number;
  title: string;
  author: string;
  headBranch: string;
  baseBranch: string;
  description: string;
  url: string;
  state: string;
  updatedAt: string;
}

export interface FetchedRepo {
  id: string;
  owner: string;
  name: string;
  description?: string;
  url: string;
  defaultBranch: string;
  openPrCount: number;
  lastSyncedAt: string;
}

/** Lấy thông tin metadata của repository từ GitHub API */
export async function fetchGithubRepo(
  repoFullName: string,
  opts: { token?: string; fetchImpl?: GithubFetch } = {},
): Promise<FetchedRepo | null> {
  const call = opts.fetchImpl ?? makeFetch(opts.token);
  const res = await call(`/repos/${repoFullName}`, { method: "GET", body: undefined });
  if (!res.ok) return null;
  const raw = JSON.parse(await res.text()) as {
    full_name: string;
    name: string;
    owner: { login: string };
    description?: string;
    html_url: string;
    default_branch: string;
    open_issues_count: number;
  };
  return {
    id: raw.full_name,
    owner: raw.owner.login,
    name: raw.name,
    description: raw.description,
    url: raw.html_url,
    defaultBranch: raw.default_branch,
    openPrCount: raw.open_issues_count,
    lastSyncedAt: new Date().toISOString(),
  };
}

/** Lấy danh sách Pull Requests từ GitHub API */
export async function fetchGithubPullRequests(
  repoFullName: string,
  opts: { token?: string; fetchImpl?: GithubFetch } = {},
): Promise<FetchedPullRequest[]> {
  const call = opts.fetchImpl ?? makeFetch(opts.token);
  const res = await call(`/repos/${repoFullName}/pulls?state=all&per_page=30`, { method: "GET", body: undefined });
  if (!res.ok) return [];
  const list = JSON.parse(await res.text()) as {
    number: number;
    title: string;
    user: { login: string };
    body: string | null;
    html_url: string;
    state: string;
    head: { ref: string };
    base: { ref: string };
    updated_at: string;
  }[];

  return list.map((p) => ({
    id: `${repoFullName}#${p.number}`,
    repo: repoFullName,
    number: p.number,
    title: p.title,
    author: p.user?.login ?? "unknown",
    headBranch: p.head.ref,
    baseBranch: p.base.ref,
    description: p.body ?? "",
    url: p.html_url,
    state: p.state,
    updatedAt: p.updated_at,
  }));
}

/** Ghi check run và comment tóm tắt lên GitHub cho một PR đã phân tích. Không ghi gì nếu request lỗi — chỉ log. */
export async function publishResults(pr: PullRequest, commitSha: string, opts: GithubClientOptions): Promise<void> {
  const call = opts.fetchImpl ?? makeFetch(opts.token);
  const body = renderSummaryMarkdown(pr);

  const checkRes = await call(`/repos/${pr.repo}/check-runs`, {
    method: "POST",
    body: {
      name: "pr-evidence",
      head_sha: commitSha,
      status: "completed",
      conclusion: checkRunConclusion(pr),
      output: { title: "Bảng claim-code-evidence", summary: body },
    },
  });
  if (!checkRes.ok) console.error("Không tạo được check run:", checkRes.status, await checkRes.text());

  const commentRes = await call(`/repos/${pr.repo}/issues/${pr.number}/comments`, {
    method: "POST",
    body: { body },
  });
  if (!commentRes.ok) console.error("Không tạo được comment:", commentRes.status, await commentRes.text());
}
