export interface Hunk {
  file: string;
  /** Dòng đầu và cuối của hunk ở phía file mới */
  lineStart: number;
  lineEnd: number;
  /** Các dòng thêm vào, bỏ dấu "+" ở đầu */
  added: string[];
}

/** Đọc unified diff (git diff). Bỏ qua file bị xóa. */
export function parseDiff(diff: string): Hunk[] {
  const hunks: Hunk[] = [];
  let file: string | null = null;
  let cur: Hunk | null = null;

  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith("+++ ")) {
      const path = line.slice(4).trim();
      file = path === "/dev/null" ? null : path.replace(/^b\//, "");
      cur = null;
      continue;
    }
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (m && file) {
      const start = Number(m[1]);
      const len = m[2] === undefined ? 1 : Number(m[2]);
      cur = { file, lineStart: start, lineEnd: start + Math.max(len, 1) - 1, added: [] };
      hunks.push(cur);
      continue;
    }
    if (cur && line.startsWith("+") && !line.startsWith("+++")) cur.added.push(line.slice(1));
  }
  return hunks;
}
