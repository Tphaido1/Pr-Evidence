import { describe, expect, it } from "vitest";
import { parseDiff } from "./diff";

const diff = `diff --git a/src/run.ts b/src/run.ts
--- a/src/run.ts
+++ b/src/run.ts
@@ -10,2 +12,4 @@ function x
 keep
+const killTimer = setTimeout(() => child.kill(), 60_000)
+clearTimeout(killTimer)
 keep2
@@ -50 +60 @@
-old
+new
diff --git a/gone.ts b/gone.ts
--- a/gone.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-a
-b
`;

describe("parseDiff", () => {
  const h = parseDiff(diff);
  it("tách hunk theo file và số dòng mới", () => {
    expect(h).toHaveLength(2);
    expect(h[0]).toMatchObject({ file: "src/run.ts", lineStart: 12, lineEnd: 15 });
    expect(h[1]).toMatchObject({ file: "src/run.ts", lineStart: 60, lineEnd: 60 });
  });
  it("chỉ giữ dòng thêm vào", () => {
    expect(h[0]?.added).toEqual(["const killTimer = setTimeout(() => child.kill(), 60_000)", "clearTimeout(killTimer)"]);
    expect(h[1]?.added).toEqual(["new"]);
  });
  it("bỏ file bị xóa", () => {
    expect(h.some((x) => x.file === "gone.ts")).toBe(false);
  });
  it("diff rỗng cho danh sách rỗng", () => {
    expect(parseDiff("")).toEqual([]);
  });
});
