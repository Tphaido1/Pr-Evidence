import type { PullRequest, ReviewStatus } from "@pr-evidence/types";
import { pullRequests, type PullRequestDoc } from "./client";

function fromDoc({ _id, ...rest }: PullRequestDoc): PullRequest {
  return { id: _id, ...rest };
}

export async function listPullRequests(): Promise<PullRequest[]> {
  const col = await pullRequests();
  const docs = await col.find().sort({ updatedAt: -1 }).toArray();
  return docs.map(fromDoc);
}

export async function getPullRequest(id: string): Promise<PullRequest | null> {
  const col = await pullRequests();
  const doc = await col.findOne({ _id: id });
  return doc ? fromDoc(doc) : null;
}

/** Trả về PR sau khi cập nhật, hoặc null nếu không tìm thấy PR hoặc claim. */
export async function setClaimReview(
  prId: string,
  claimId: string,
  review: ReviewStatus,
): Promise<PullRequest | null> {
  const col = await pullRequests();
  const doc = await col.findOneAndUpdate(
    { _id: prId, "claims.id": claimId },
    { $set: { "claims.$.review": review, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" },
  );
  return doc ? fromDoc(doc) : null;
}

/**
 * Webhook gọi hàm này khi PR mở hoặc có commit mới. Không xóa claim cũ ngay — giữ
 * nguyên bảng của lần phân tích trước cho tới khi có bảng mới, chỉ đổi analysisStatus
 * thành "queued" để giao diện biết đang chờ CI chạy lại.
 */
export async function upsertPullRequestShell(
  pr: Pick<PullRequest, "id" | "repo" | "number" | "title" | "author" | "headBranch" | "baseBranch">,
): Promise<void> {
  const col = await pullRequests();
  const { id, ...fields } = pr;
  await col.updateOne(
    { _id: id },
    {
      $set: { ...fields, analysisStatus: "queued", updatedAt: new Date().toISOString() },
      $setOnInsert: { aiPercent: 0, claims: [] },
    },
    { upsert: true },
  );
}

/** apps/runner gọi trước khi chạy test/lint, và khi bắt được lỗi (kèm error). */
export async function setAnalysisStatus(id: string, status: "analyzing" | "failed", error?: string): Promise<void> {
  const col = await pullRequests();
  await col.updateOne(
    { _id: id },
    { $set: { analysisStatus: status, analysisError: error, updatedAt: new Date().toISOString() } },
  );
}

/**
 * Lưu kết quả phân tích mới. Claim có cùng nội dung với lần trước giữ lại trạng thái duyệt,
 * để reviewer không phải duyệt lại từ đầu mỗi lần có commit mới.
 */
export async function savePullRequest(pr: PullRequest): Promise<void> {
  const col = await pullRequests();
  const old = await col.findOne({ _id: pr.id });
  const oldReview = new Map((old?.claims ?? []).map((c) => [c.text.trim().toLowerCase(), c.review]));
  const claims = pr.claims.map((c) => ({ ...c, review: oldReview.get(c.text.trim().toLowerCase()) ?? c.review }));
  const { id, ...rest } = { ...pr, claims };
  await col.replaceOne({ _id: id }, rest, { upsert: true });
}
