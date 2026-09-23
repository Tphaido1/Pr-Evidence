import type { PullRequest, PullRequestStatus } from "@pr-evidence/types";
import { countEvidence, statusOf } from "@pr-evidence/evidence";

const icon = { test_pass: "✅", test_fail: "❌", lint_only: "🟡", none: "⚪️" } as const;
const statusLabels: Record<PullRequestStatus, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", returned: "Trả lại" };

/** Dựng nội dung comment tóm tắt bảng claim-code-evidence, dùng chung cho GitHub và test. */
export function renderSummaryMarkdown(pr: PullRequest): string {
  const { total, withEvidence } = countEvidence(pr.claims);
  const status = statusOf(pr.claims);
  const statusLabel = statusLabels[status];

  const rows = pr.claims
    .map((c) => {
      const code = c.code.file ? `\`${c.code.file}:${c.code.lineStart}\`` : "_chưa ghép được_";
      return `| ${c.text} | ${code} | ${icon[c.evidence.kind]} ${c.evidence.detail} | ${c.aiWritten ? "Có" : "Không"} |`;
    })
    .join("\n");

  return [
    `**pr-evidence** · ${withEvidence}/${total} claim có evidence · ${pr.aiPercent}% do AI · **${statusLabel}**`,
    "",
    "| Claim | Code | Evidence | AI |",
    "| --- | --- | --- | --- |",
    rows || "| _không có claim_ | | | |",
    "",
    "<sub>Tự động tạo bởi pr-evidence. Bảng có thể thiếu hoặc sai — xem chi tiết trong ứng dụng trước khi merge.</sub>",
  ].join("\n");
}

/** conclusion cho GitHub Check Run: trả lại thì failure, chưa đủ evidence thì neutral, còn lại success. */
export function checkRunConclusion(pr: PullRequest): "success" | "failure" | "neutral" {
  const status = statusOf(pr.claims);
  if (status === "returned") return "failure";
  const { total, withEvidence } = countEvidence(pr.claims);
  if (total === 0 || withEvidence < total) return "neutral";
  return "success";
}
