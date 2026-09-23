export type ReviewStatus = "pending" | "approved" | "returned";

/**
 * Vòng đời phân tích, tách khỏi ReviewStatus của từng claim:
 * queued — webhook vừa tạo/nhận PR, CI chưa chạy xong lần nào.
 * analyzing — apps/runner đang chạy test/lint cho lần phân tích này.
 * done — đã có claims (có thể rỗng nếu PR không tách được claim nào).
 * failed — apps/runner gặp lỗi (ví dụ checkout hỏng, test crash không đọc được JSON).
 */
export type AnalysisStatus = "queued" | "analyzing" | "done" | "failed";

export type EvidenceKind = "test_pass" | "test_fail" | "lint_only" | "none";

export interface CodeRef {
  file: string;
  lineStart: number;
  lineEnd: number;
  snippet: string;
}

export interface Evidence {
  kind: EvidenceKind;
  /** Ví dụ: "run.timeout.test.ts · 3/3 qua" */
  detail: string;
}

export interface Claim {
  id: string;
  text: string;
  code: CodeRef;
  evidence: Evidence;
  aiWritten: boolean;
  review: ReviewStatus;
}

export interface PullRequest {
  /** "owner/repo#number", dùng làm _id trong MongoDB */
  id: string;
  repo: string;
  number: number;
  title: string;
  author: string;
  headBranch: string;
  baseBranch: string;
  /** Tỷ lệ dòng do AI viết, từ 0 đến 100 */
  aiPercent: number;
  claims: Claim[];
  analysisStatus: AnalysisStatus;
  /** Chỉ có khi analysisStatus là "failed" */
  analysisError?: string;
  updatedAt: string;
}

export type PullRequestStatus = ReviewStatus;

export interface PullRequestSummary {
  id: string;
  repo: string;
  number: number;
  title: string;
  author: string;
  aiPercent: number;
  claimCount: number;
  claimsWithEvidence: number;
  status: PullRequestStatus;
  analysisStatus: AnalysisStatus;
}
