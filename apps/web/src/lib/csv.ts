/**
 * Escape và format một ô dữ liệu trong file CSV theo chuẩn RFC 4180.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Chuyển đổi mảng tiêu đề và dữ liệu thành chuỗi CSV hoàn chỉnh có UTF-8 BOM (\uFEFF)
 * để Microsoft Excel, Google Sheets, LibreOffice hiển thị chuẩn tiếng Việt không vỡ font.
 */
export function toCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const rowLines = rows.map((r) => r.map(escapeCsvField).join(","));
  return "\uFEFF" + [headerLine, ...rowLines].join("\r\n");
}
