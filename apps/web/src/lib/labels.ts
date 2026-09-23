import type { AnalysisStatus, EvidenceKind, ReviewStatus } from "@pr-evidence/types";
import type { Tone } from "@/components/status-chip";

export const reviewLabel: Record<ReviewStatus, { text: string; tone: Tone }> = {
  pending: { text: "Chờ duyệt", tone: "warn" },
  approved: { text: "Đã duyệt", tone: "ok" },
  returned: { text: "Trả lại", tone: "bad" },
};

export const evidenceLabel: Record<EvidenceKind, { text: string; tone: Tone }> = {
  test_pass: { text: "Test qua", tone: "ok" },
  test_fail: { text: "Test lỗi", tone: "bad" },
  lint_only: { text: "Chỉ có lint", tone: "warn" },
  none: { text: "Chưa có evidence", tone: "warn" },
};

export const analysisLabel: Record<AnalysisStatus, { text: string; tone: Tone }> = {
  queued: { text: "Chờ phân tích", tone: "plain" },
  analyzing: { text: "Đang phân tích", tone: "warn" },
  done: { text: "Đã phân tích", tone: "ok" },
  failed: { text: "Lỗi phân tích", tone: "bad" },
};
