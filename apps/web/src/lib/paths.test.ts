import { describe, expect, it } from "vitest";
import { prIdFromParams, prPath } from "./paths";

describe("prIdFromParams", () => {
  it("ghép owner/repo#number", () => {
    expect(prIdFromParams({ owner: "acme", repo: "pr-evidence", number: "42" })).toBe("acme/pr-evidence#42");
  });
});

describe("prPath", () => {
  it("dựng đường dẫn trang chi tiết", () => {
    expect(prPath("acme/pr-evidence", 42)).toBe("/pull-requests/acme/pr-evidence/42");
  });
});
