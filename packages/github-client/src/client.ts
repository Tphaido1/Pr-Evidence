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

function makeFetch(token: string): GithubFetch {
  return async (path, init) => {
    const res = await fetch(`https://api.github.com${path}`, {
      method: init.method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
      },
      body: JSON.stringify(init.body),
    });
    return { ok: res.ok, status: res.status, text: () => res.text() };
  };
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
