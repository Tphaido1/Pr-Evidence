import { describe, expect, it } from "vitest";
import type { AnalysisStatus, EvidenceKind, ReviewStatus } from "@pr-evidence/types";
import { analysisLabel, evidenceLabel, reviewLabel } from "./labels";

describe("labels", () => {
  it("có nhãn cho mọi ReviewStatus", () => {
    const all: ReviewStatus[] = ["pending", "approved", "returned"];
    all.forEach((s) => expect(reviewLabel[s].text).toBeTruthy());
  });
  it("có nhãn cho mọi EvidenceKind", () => {
    const all: EvidenceKind[] = ["test_pass", "test_fail", "lint_only", "none"];
    all.forEach((s) => expect(evidenceLabel[s].text).toBeTruthy());
  });
  it("có nhãn cho mọi AnalysisStatus, lỗi và trả lại dùng tone 'bad'", () => {
    const all: AnalysisStatus[] = ["queued", "analyzing", "done", "failed"];
    all.forEach((s) => expect(analysisLabel[s].text).toBeTruthy());
    expect(analysisLabel.failed.tone).toBe("bad");
    expect(analysisLabel.done.tone).toBe("ok");
  });
});
