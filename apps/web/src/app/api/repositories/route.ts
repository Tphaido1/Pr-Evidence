import { listRepositories, upsertRepository, getPullRequest, upsertPullRequestShell, createNotification } from "@pr-evidence/db";
import { fetchGithubPullRequests, fetchGithubRepo } from "@pr-evidence/github-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const repos = await listRepositories();
  return Response.json(repos);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { repo?: string } | null;
  const rawRepo = body?.repo?.trim();
  if (!rawRepo || !rawRepo.includes("/")) {
    return Response.json({ error: "Tên repository không hợp lệ. Định dạng yêu cầu: owner/repo" }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  const githubRepo = await fetchGithubRepo(rawRepo, { token });
  if (!githubRepo) {
    return Response.json(
      { error: `Không tìm thấy repository "${rawRepo}" trên GitHub (hoặc repo là private và thiếu GITHUB_TOKEN)` },
      { status: 404 },
    );
  }

  // Đồng bộ danh sách PR ban đầu
  const pulls = await fetchGithubPullRequests(rawRepo, { token });
  let newPrCount = 0;

  for (const pr of pulls) {
    const existing = await getPullRequest(pr.id);
    if (!existing) {
      newPrCount++;
      await createNotification({
        type: "new_pr",
        repo: rawRepo,
        prNumber: pr.number,
        title: pr.title,
        author: pr.author,
      });
    }

    await upsertPullRequestShell({
      id: pr.id,
      repo: rawRepo,
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
