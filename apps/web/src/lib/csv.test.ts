import { describe, expect, it } from "vitest";
import { escapeCsvField, toCsv } from "./csv";

describe("CSV Utilities", () => {
  it("escapeCsvField xử lý các ký tự đặc biệt", () => {
    expect(escapeCsvField("hello")).toBe("hello");
    expect(escapeCsvField("hello, world")).toBe('"hello, world"');
    expect(escapeCsvField('hello "world"')).toBe('"hello ""world"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvField(123)).toBe("123");
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("toCsv tạo file có UTF-8 BOM và đúng định dạng", () => {
    const headers = ["Mã PR", "Tiêu đề", "Tác giả"];
    const rows = [
      [1, "Thêm đăng nhập", "Nguyễn Văn A"],
      [2, 'Fix "bug" giỏ hàng, thanh toán', "Trần Thị B"],
    ];

    const result = toCsv(headers, rows);
    expect(result.startsWith("\uFEFF")).toBe(true);
    expect(result).toContain("Mã PR,Tiêu đề,Tác giả");
    expect(result).toContain('1,Thêm đăng nhập,Nguyễn Văn A');
    expect(result).toContain('2,"Fix ""bug"" giỏ hàng, thanh toán",Trần Thị B');
  });
});
