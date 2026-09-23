import { describe, expect, it } from "vitest";
import { parseEslintJson, parseVitestJson } from "./parse";

describe("parseVitestJson", () => {
  const json = JSON.stringify({
    testResults: [
      { name: "/repo/packages/a/src/x.test.ts", assertionResults: [{ status: "passed" }, { status: "passed" }, { status: "failed" }] },
      { name: "/repo/packages/a/src/y.test.ts", assertionResults: [{ status: "passed" }, { status: "skipped" }] },
    ],
  });
  it("đếm qua/lỗi và đổi sang đường dẫn tương đối", () => {
    expect(parseVitestJson(json, "/repo")).toEqual([
      { file: "packages/a/src/x.test.ts", passed: 2, failed: 1 },
      { file: "packages/a/src/y.test.ts", passed: 1, failed: 0 },
    ]);
  });
  it("output không phải JSON cho danh sách rỗng", () => {
    expect(parseVitestJson("Error: boom", "/repo")).toEqual([]);
  });
  it("JSON thiếu testResults cho danh sách rỗng", () => {
    expect(parseVitestJson("{}", "/repo")).toEqual([]);
  });
});

describe("parseEslintJson", () => {
  it("đọc số lỗi mỗi file", () => {
    const j = JSON.stringify([{ filePath: "/repo/a.ts", errorCount: 2 }, { filePath: "/repo/b.ts", errorCount: 0 }]);
    expect(parseEslintJson(j, "/repo/")).toEqual([{ file: "a.ts", errors: 2 }, { file: "b.ts", errors: 0 }]);
  });
  it("output hỏng cho danh sách rỗng", () => {
    expect(parseEslintJson("nope", "/repo")).toEqual([]);
  });
});
