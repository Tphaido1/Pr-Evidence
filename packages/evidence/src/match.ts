import type { CodeRef } from "@pr-evidence/types";
import type { Hunk } from "./diff";

const STOPWORDS = new Set([
  "cho", "cua", "va", "khi", "sau", "moi", "la", "khong", "co", "cac", "mot", "the", "duoc",
  "tu", "voi", "trong", "den", "ra", "vao", "thi", "nhung", "and", "the", "for", "of", "to",
]);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

/** Tách token thường: bỏ dấu, tách camelCase, snake_case, đường dẫn, số. */
export function tokenize(text: string): Set<string> {
  const spaced = stripAccents(text).replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const tokens = spaced
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t) && (t.length > 1 || /\d/.test(t)));
  return new Set(tokens);
}

export interface Match {
  code: CodeRef;
  score: number;
}

const MIN_SCORE = 0.2;

/**
 * Chọn hunk có nhiều token trùng với claim nhất.
 * Điểm = số token của claim xuất hiện trong hunk / số token của claim.
 * Đây là heuristic đơn giản, chưa hiểu ngữ nghĩa. Claim tiếng Việt chủ yếu khớp qua
 * thuật ngữ tiếng Anh và con số.
 */
export function matchClaimToHunk(claim: string, hunks: Hunk[]): Match | null {
  const ct = tokenize(claim);
  if (ct.size === 0) return null;

  let best: Match | null = null;
  for (const h of hunks) {
    const ht = tokenize(h.file + " " + h.added.join("\n"));
    let hit = 0;
    for (const t of ct) if (ht.has(t)) hit++;
    const score = hit / ct.size;
    if (hit > 0 && score >= MIN_SCORE && (!best || score > best.score)) {
      const line = h.added.find((l) => [...ct].some((t) => tokenize(l).has(t))) ?? h.added[0] ?? "";
      best = {
        score,
        code: {
          file: h.file,
          lineStart: h.lineStart,
          lineEnd: h.lineEnd,
          snippet: line.trim().slice(0, 120),
        },
      };
    }
  }
  return best;
}
