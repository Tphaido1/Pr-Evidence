import { describe, expect, it } from "vitest";
import { extractClaims } from "./extract";

const template = (body: string, how = "- chạy pnpm test", ai = "Không") =>
  `Thay đổi này làm gì:\n${body}\n\nCách kiểm tra:\n${how}\n\nPhần nào do AI viết (nếu có):\n${ai}\n`;

describe("extractClaims từ mô tả PR", () => {
  it("lấy từng gạch đầu dòng trong mục 'Thay đổi này làm gì'", () => {
    const r = extractClaims({ description: template("- Runner dừng job sau 60 giây\n- Giới hạn bộ nhớ 512 MB"), commits: [] });
    expect(r.map((c) => c.text)).toEqual(["Runner dừng job sau 60 giây", "Giới hạn bộ nhớ 512 MB"]);
    expect(r.every((c) => c.source === "description")).toBe(true);
  });

  it("không lấy nội dung của mục 'Cách kiểm tra' và mục AI", () => {
    const r = extractClaims({ description: template("- A thật", "- chạy test X", "Claude viết phần B"), commits: [] });
    expect(r.map((c) => c.text)).toEqual(["A thật"]);
  });

  it("nhận số thứ tự và checklist", () => {
    const r = extractClaims({ description: template("1. Một\n2) Hai\n- [x] Ba\n* [ ] Bốn"), commits: [] });
    expect(r.map((c) => c.text)).toEqual(["Một", "Hai", "Ba", "Bốn"]);
  });

  it("không có gạch đầu dòng thì mỗi dòng là một claim", () => {
    const r = extractClaims({ description: template("Sửa lỗi A\nThêm B"), commits: [] });
    expect(r.map((c) => c.text)).toEqual(["Sửa lỗi A", "Thêm B"]);
  });

  it("mô tả không theo template thì lấy các gạch đầu dòng", () => {
    const r = extractClaims({ description: "Tóm tắt\n- Sửa X\n- Thêm Y", commits: [] });
    expect(r.map((c) => c.text)).toEqual(["Sửa X", "Thêm Y"]);
  });

  it("mô tả rỗng cho danh sách rỗng", () => {
    expect(extractClaims({ description: "", commits: [] })).toEqual([]);
  });
});

describe("extractClaims từ commit", () => {
  it("lấy dòng đầu, bỏ tiền tố conventional commit", () => {
    const r = extractClaims({ description: "", commits: ["feat(runner): thêm giới hạn thời gian\n\nchi tiết dài"] });
    expect(r).toEqual([{ text: "thêm giới hạn thời gian", source: "commit", commitIndex: 0 }]);
  });

  it("bỏ commit merge và revert", () => {
    const r = extractClaims({ description: "", commits: ["Merge branch 'main'", "Revert \"x\"", "fix: sửa lỗi"] });
    expect(r.map((c) => c.text)).toEqual(["sửa lỗi"]);
    expect(r[0]?.commitIndex).toBe(2);
  });

  it("bỏ trùng giữa mô tả và commit, giữ bản trong mô tả", () => {
    const r = extractClaims({
      description: template("- Runner dừng job sau 60 giây"),
      commits: ["fix: runner dừng job sau 60 giây."],
    });
    expect(r).toHaveLength(1);
    expect(r[0]?.source).toBe("description");
  });

  it("bỏ commit chỉ có tiền tố", () => {
    expect(extractClaims({ description: "", commits: ["chore:"] })).toEqual([]);
  });
});
