import { describe, expect, it } from "vitest";
import type { PullRequest } from "@pr-evidence/types";
import { checkRunConclusion, renderSummaryMarkdown } from "./markdown";

function pr(claims: PullRequest["claims"]): PullRequest {
  return {
    id: "a/b#1", repo: "a/b", number: 1, title: "t", author: "x",
    headBranch: "h", baseBranch: "main", aiPercent: 50, claims, analysisStatus: "done", updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
const claim = (over: Partial<PullRequest["claims"][number]> = {}): PullRequest["claims"][number] => ({
  id: "c1", text: "Runner dừng job sau 60 giây",
  code: { file: "src/run.ts", lineStart: 12, lineEnd: 31, snippet: "" },
  evidence: { kind: "test_pass", detail: "run.test.ts · 3/3 qua" },
  aiWritten: true, review: "pending", ...over,
});

describe("renderSummaryMarkdown", () => {
  it("gồm số claim có evidence, % AI, trạng thái và bảng", () => {
    const md = renderSummaryMarkdown(pr([claim()]));
    expect(md).toContain("1/1 claim có evidence");
    expect(md).toContain("50% do AI");
    expect(md).toContain("Chờ duyệt");
    expect(md).toContain("Runner dừng job sau 60 giây");
    expect(md).toContain("`src/run.ts:12`");
  });
  it("PR không có claim vẫn dựng được bảng", () => {
    expect(renderSummaryMarkdown(pr([]))).toContain("không có claim");
  });
  it("claim chưa ghép code thì ghi rõ", () => {
    const md = renderSummaryMarkdown(pr([claim({ code: { file: "", lineStart: 0, lineEnd: 0, snippet: "" } })]));
    expect(md).toContain("chưa ghép được");
  });
});

describe("checkRunConclusion", () => {
  it("failure nếu có claim bị trả lại", () => {
    expect(checkRunConclusion(pr([claim({ review: "returned" })]))).toBe("failure");
  });
  it("success khi mọi claim đều có evidence và không bị trả lại", () => {
    expect(checkRunConclusion(pr([claim()]))).toBe("success");
  });
  it("neutral khi còn claim thiếu evidence", () => {
    expect(checkRunConclusion(pr([claim({ evidence: { kind: "none", detail: "" } })]))).toBe("neutral");
  });
  it("neutral khi PR không có claim nào", () => {
    expect(checkRunConclusion(pr([]))).toBe("neutral");
  });
});
