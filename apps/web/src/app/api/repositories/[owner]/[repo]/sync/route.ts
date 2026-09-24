import { createNotification, getPullRequest, getRepository, upsertPullRequestShell, upsertRepository } from "@pr-evidence/db";
import { fetchGithubPullRequests, fetchGithubRepo } from "@pr-evidence/github-client";

type Params = { owner: string; repo: string };

export async function POST(_req: Request, { params }: { params: Promise<Params> }) {
  const { owner, repo } = await params;
  const fullName = `${owner}/${repo}`;

  const token = process.env.GITHUB_TOKEN;
  const githubRepo = await fetchGithubRepo(fullName, { token });
  const existingRepo = await getRepository(fullName);

  if (!githubRepo && !existingRepo) {
    return Response.json({ error: `Không tìm thấy repository "${fullName}"` }, { status: 404 });
  }

  const pulls = await fetchGithubPullRequests(fullName, { token });

  const results = await Promise.all(
    pulls.map(async (pr) => {
      const existing = await getPullRequest(pr.id);
      let isNew = false;
      if (!existing) {
        isNew = true;
        await createNotification({
          type: "new_pr",
          repo: fullName,
          prNumber: pr.number,
          title: pr.title,
          author: pr.author,
        });
      }

      await upsertPullRequestShell({
        id: pr.id,
        repo: fullName,
        number: pr.number,
        title: pr.title,
        author: pr.author,
        headBranch: pr.headBranch,
        baseBranch: pr.baseBranch,
      });

      return isNew;
    }),
  );

  const newPrCount = results.filter(Boolean).length;

  const updatedRepo = {
    id: fullName,
    owner,
    name: repo,
    description: githubRepo?.description ?? existingRepo?.description,
    url: githubRepo?.url ?? existingRepo?.url ?? `https://github.com/${fullName}`,
    defaultBranch: githubRepo?.defaultBranch ?? existingRepo?.defaultBranch ?? "main",
    openPrCount: pulls.filter((p) => p.state === "open").length,
    lastSyncedAt: new Date().toISOString(),
  };

  await upsertRepository(updatedRepo);

  return Response.json({
    ok: true,
    repo: updatedRepo,
    syncedCount: pulls.length,
    newPrCount,
  });
}
