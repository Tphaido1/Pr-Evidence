import { getPullRequest, savePullRequest, setAnalysisStatus } from "@pr-evidence/db";
import { analyze } from "@pr-evidence/evidence";
import {
  fetchPullRequestChecks,
  fetchPullRequestCommits,
  fetchPullRequestDetail,
  fetchPullRequestDiff,
} from "@pr-evidence/github-client";

type Params = { owner: string; repo: string; number: string };

export async function POST(_req: Request, { params }: { params: Promise<Params> }) {
  const { owner, repo, number } = await params;
  const num = Number(number);
  const repoFullName = `${owner}/${repo}`;
  const id = `${repoFullName}#${num}`;

  // Đánh dấu trạng thái đang phân tích
  await setAnalysisStatus(id, "analyzing");

  try {
    const token = process.env.GITHUB_TOKEN;
    const existingPr = await getPullRequest(id);

    // 1. Lấy thông tin chi tiết của PR từ GitHub (tiêu đề, tác giả, mô tả, SHA commit)
    const detail = await fetchPullRequestDetail(repoFullName, num, { token });
    if (!detail && !existingPr) {
      await setAnalysisStatus(id, "failed", `Không tìm thấy Pull Request #${num} trong ${repoFullName}`);
      return Response.json({ error: `Không tìm thấy PR #${num}` }, { status: 404 });
    }

    // 2. Lấy unified diff trực tiếp từ GitHub REST API
    const diff = await fetchPullRequestDiff(repoFullName, num, { token });

    // 3. Lấy danh sách commit messages và additions từ GitHub API
    const commits = await fetchPullRequestCommits(repoFullName, num, { token });

    // 4. Lấy kết quả CI test & lint từ GitHub Check Runs nếu có
    const headSha = detail?.headSha ?? "";
    const checks = headSha
      ? await fetchPullRequestChecks(repoFullName, headSha, { token })
      : { tests: [], lints: [] };

    // 5. Tiến hành phân tích: bóc tách claim, nhận diện AI, đối sánh diff thành claim-code-evidence
    const analyzedPr = analyze({
      repo: repoFullName,
      number: num,
      title: detail?.title ?? existingPr?.title ?? "",
      author: detail?.author ?? existingPr?.author ?? "unknown",
      headBranch: detail?.headBranch ?? existingPr?.headBranch ?? "head",
      baseBranch: detail?.baseBranch ?? existingPr?.baseBranch ?? "base",
      description: detail?.description ?? "",
      commits,
      diff,
      tests: checks.tests,
      lints: checks.lints,
    });

    // 6. Lưu kết quả phân tích vào MongoDB (bảo toàn lịch sử duyệt cũ nếu có)
    await savePullRequest(analyzedPr);

    return Response.json({
      ok: true,
      pr: analyzedPr,
      claimsCount: analyzedPr.claims.length,
      aiPercent: analyzedPr.aiPercent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setAnalysisStatus(id, "failed", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
