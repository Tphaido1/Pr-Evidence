import { listRepositories, upsertRepository, getPullRequest, upsertPullRequestShell, createNotification } from "@pr-evidence/db";
import { fetchGithubPullRequests, fetchGithubRepo, parseGithubRepo } from "@pr-evidence/github-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const repos = await listRepositories();
  return Response.json(repos);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { repo?: string } | null;
  const rawRepo = body?.repo;
  const repoFullName = parseGithubRepo(rawRepo);
  if (!repoFullName) {
    return Response.json(
      { error: "Định dạng repository không hợp lệ. Vui lòng nhập 'owner/repo' hoặc đường dẫn GitHub (ví dụ: https://github.com/owner/repo)" },
      { status: 400 },
    );
  }

  const token = process.env.GITHUB_TOKEN;
  const githubRepo = await fetchGithubRepo(repoFullName, { token });
  if (!githubRepo) {
    return Response.json(
      { error: `Không tìm thấy repository "${repoFullName}" trên GitHub (hoặc repo là private và thiếu cấu hình GITHUB_TOKEN trong .env)` },
      { status: 404 },
    );
  }

  // Đồng bộ danh sách PR ban đầu
  const pulls = await fetchGithubPullRequests(repoFullName, { token });
  let newPrCount = 0;

  for (const pr of pulls) {
    const existing = await getPullRequest(pr.id);
    if (!existing) {
      newPrCount++;
      await createNotification({
        type: "new_pr",
        repo: repoFullName,
        prNumber: pr.number,
        title: pr.title,
        author: pr.author,
      });
    }

    await upsertPullRequestShell({
      id: pr.id,
      repo: repoFullName,
      number: pr.number,
      title: pr.title,
      author: pr.author,
      headBranch: pr.headBranch,
      baseBranch: pr.baseBranch,
    });
  }

  const repoRecord = {
    ...githubRepo,
    openPrCount: pulls.filter((p) => p.state === "open").length,
    lastSyncedAt: new Date().toISOString(),
  };

  await upsertRepository(repoRecord);
  return Response.json({ repo: repoRecord, syncedPulls: pulls.length, newPrCount });
}
