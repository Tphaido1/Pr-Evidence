import type { Claim, PullRequest, PullRequestStatus, PullRequestSummary } from "@pr-evidence/types";

/** Một claim "có evidence" khi có test chạy qua. Chỉ có lint hoặc test lỗi thì chưa tính. */
export function countEvidence(claims: Claim[]): { total: number; withEvidence: number } {
  return {
    total: claims.length,
    withEvidence: claims.filter((c) => c.evidence.kind === "test_pass").length,
  };
}

/**
 * Còn một dòng bị trả lại thì cả PR là "returned".
 * Duyệt hết mọi dòng mới là "approved". Còn lại là "pending".
 */
export function statusOf(claims: Claim[]): PullRequestStatus {
  if (claims.some((c) => c.review === "returned")) return "returned";
  if (claims.length > 0 && claims.every((c) => c.review === "approved")) return "approved";
  return "pending";
}

export function summarize(pr: PullRequest): PullRequestSummary {
  const { total, withEvidence } = countEvidence(pr.claims);
  return {
    id: pr.id,
    repo: pr.repo,
    number: pr.number,
    title: pr.title,
    author: pr.author,
    aiPercent: pr.aiPercent,
    claimCount: total,
    claimsWithEvidence: withEvidence,
    status: statusOf(pr.claims),
    analysisStatus: pr.analysisStatus,
  };
}
