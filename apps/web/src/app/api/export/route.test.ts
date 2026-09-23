import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pr-evidence/db", () => ({
  searchPullRequests: vi.fn(),
}));

import { searchPullRequests } from "@pr-evidence/db";
import { GET } from "./route";

describe("GET /api/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("xuất danh sách PR dạng summary có UTF-8 BOM", async () => {
    const mockPrs = [
      {
        id: "owner/repo#1",
        repo: "owner/repo",
        number: 1,
        title: "Thêm tính năng đăng nhập",
        author: "alice",
        headBranch: "feat",
        baseBranch: "main",
        aiPercent: 15,
        claims: [
          {
            id: "c1",
            text: "đăng nhập",
            code: { file: "auth.ts", lineStart: 1, lineEnd: 5, snippet: "code" },
            evidence: { kind: "none" as const, detail: "" },
            aiWritten: false,
            review: "approved" as const,
          },
        ],
        analysisStatus: "done" as const,
        updatedAt: "2026-09-23T00:00:00.000Z",
      },
    ];

    vi.mocked(searchPullRequests).mockResolvedValueOnce(mockPrs);

    const req = new Request("http://localhost/api/export?type=summary");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const buf = Buffer.from(await res.arrayBuffer());
    // Kiểm tra byte UTF-8 BOM (0xEF, 0xBB, 0xBF)
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);
    const text = buf.toString("utf-8");
    expect(text).toContain("Thêm tính năng đăng nhập");
    expect(text).toContain("owner/repo");
  });

  it("xuất danh sách claims chi tiết", async () => {
    const mockPrs = [
      {
        id: "owner/repo#1",
        repo: "owner/repo",
        number: 1,
        title: "Test PR",
        author: "alice",
        headBranch: "feat",
        baseBranch: "main",
        aiPercent: 0,
        claims: [
          {
            id: "c1",
            text: "chi tiết claim",
            code: { file: "src/app.ts", lineStart: 10, lineEnd: 20, snippet: "const a = 1;" },
            evidence: { kind: "test_pass" as const, detail: "pass all" },
            aiWritten: true,
            review: "pending" as const,
          },
        ],
        analysisStatus: "done" as const,
        updatedAt: "2026-09-23T00:00:00.000Z",
      },
    ];

    vi.mocked(searchPullRequests).mockResolvedValueOnce(mockPrs);

    const req = new Request("http://localhost/api/export?type=claims");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("chi tiết claim");
    expect(text).toContain("src/app.ts");
    expect(text).toContain("test_pass");
  });
});
