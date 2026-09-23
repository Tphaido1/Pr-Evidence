import { describe, expect, it } from "vitest";
import type { Claim } from "@pr-evidence/types";
import { countEvidence, statusOf } from "./summary";

function claim(over: Partial<Claim> = {}): Claim {
  return {
    id: "c1",
    text: "x",
    code: { file: "a.ts", lineStart: 1, lineEnd: 2, snippet: "" },
    evidence: { kind: "test_pass", detail: "" },
    aiWritten: false,
    review: "pending",
    ...over,
  };
}

describe("statusOf", () => {
  it("trả lại nếu có một dòng bị trả lại", () => {
    expect(statusOf([claim({ review: "approved" }), claim({ review: "returned" })])).toBe("returned");
  });
  it("đã duyệt khi mọi dòng đã duyệt", () => {
    expect(statusOf([claim({ review: "approved" }), claim({ review: "approved" })])).toBe("approved");
  });
  it("chờ duyệt khi còn dòng chưa xem", () => {
    expect(statusOf([claim({ review: "approved" }), claim()])).toBe("pending");
  });
  it("PR không có claim thì vẫn chờ duyệt", () => {
    expect(statusOf([])).toBe("pending");
  });
});

describe("countEvidence", () => {
  it("chỉ tính test chạy qua", () => {
    const r = countEvidence([
      claim(),
      claim({ evidence: { kind: "lint_only", detail: "" } }),
      claim({ evidence: { kind: "test_fail", detail: "" } }),
    ]);
    expect(r).toEqual({ total: 3, withEvidence: 1 });
  });
});
