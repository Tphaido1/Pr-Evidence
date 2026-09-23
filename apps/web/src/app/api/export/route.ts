import { searchPullRequests } from "@pr-evidence/db";
import { countEvidence, statusOf, summarize } from "@pr-evidence/evidence";
import type { PullRequestStatus } from "@pr-evidence/types";
import { toCsv } from "@/lib/csv";
import { analysisLabel, reviewLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "summary";
  const query = searchParams.get("q") ?? undefined;
  const repo = searchParams.get("repo") ?? undefined;
  const statusParam = searchParams.get("status") ?? undefined;

  let prs = await searchPullRequests({ query, repo });

  // Lọc theo status nếu có
  if (statusParam && ["pending", "approved", "returned"].includes(statusParam)) {
    prs = prs.filter((p) => {
      const summary = summarize(p);
      return summary.status === (statusParam as PullRequestStatus);
    });
  }

  if (type === "claims") {
    const headers = [
      "Mã PR",
      "Repository",
      "Tiêu đề PR",
      "Tác giả",
      "Mã Claim",
      "Nội dung Claim",
      "Tập tin",
      "Dòng bắt đầu",
      "Dòng kết thúc",
      "Đoạn code",
      "Loại Evidence",
      "Chi tiết Evidence",
      "Do AI viết",
      "Trạng thái duyệt",
    ];

    const rows: (string | number | boolean | null)[][] = [];

    for (const pr of prs) {
      for (const claim of pr.claims) {
        rows.push([
          `#${pr.number}`,
          pr.repo,
          pr.title,
          pr.author,
          claim.id,
          claim.text,
          claim.code.file || "(Chưa ghép)",
          claim.code.lineStart || "",
          claim.code.lineEnd || "",
          claim.code.snippet || "",
          claim.evidence.kind,
          claim.evidence.detail || "",
          claim.aiWritten ? "Có" : "Không",
          claim.review === "approved" ? "Đã duyệt" : claim.review === "returned" ? "Trả lại" : "Chờ duyệt",
        ]);
      }
    }

    const csvContent = toCsv(headers, rows);
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pr-evidence-claims-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // Mặc định: type === "summary"
  const headers = [
    "Mã PR",
    "Repository",
    "Tiêu đề",
    "Tác giả",
    "Nhánh nguồn (Head)",
    "Nhánh đích (Base)",
    "Tổng Claim",
    "Có Evidence",
    "Thiếu Evidence",
    "Tỷ lệ AI (%)",
    "Trạng thái phân tích",
    "Trạng thái duyệt",
    "Cập nhật lần cuối",
  ];

  const rows: (string | number | boolean | null)[][] = prs.map((pr) => {
    const { total, withEvidence } = countEvidence(pr.claims);
    const reviewStatus = statusOf(pr.claims);
    const rLabel = reviewLabel[reviewStatus]?.text ?? reviewStatus;
    const aLabel = analysisLabel[pr.analysisStatus]?.text ?? pr.analysisStatus;

    return [
      `#${pr.number}`,
      pr.repo,
      pr.title,
      pr.author,
      pr.headBranch,
      pr.baseBranch,
      total,
      withEvidence,
      total - withEvidence,
      `${pr.aiPercent}%`,
      aLabel,
      pr.analysisStatus === "done" ? rLabel : aLabel,
      pr.updatedAt,
    ];
  });

  const csvContent = toCsv(headers, rows);
  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pr-evidence-summary-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
