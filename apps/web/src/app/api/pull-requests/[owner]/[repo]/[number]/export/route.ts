import { getPullRequest } from "@pr-evidence/db";
import { toCsv } from "@/lib/csv";

type Params = { owner: string; repo: string; number: string };

export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const { owner, repo, number } = await params;
  const num = Number(number);
  const repoFullName = `${owner}/${repo}`;
  const id = `${repoFullName}#${num}`;

  const pr = await getPullRequest(id);
  if (!pr) {
    return Response.json({ error: `Không tìm thấy PR #${num}` }, { status: 404 });
  }

  const headers = [
    "Mã Claim",
    "Nội dung Claim",
    "Tập tin",
    "Dòng bắt đầu",
    "Dòng kết thúc",
    "Đoạn code snippet",
    "Loại Evidence",
    "Chi tiết Evidence",
    "Do AI viết",
    "Trạng thái duyệt",
  ];

  const rows = pr.claims.map((claim) => [
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

  const csvContent = toCsv(headers, rows);
  const safeTitle = pr.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9-]/g, "_").slice(0, 30);
  const filename = `PR_${num}_claims_${safeTitle}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
