const AI_TRAILER = /^co-authored-by:.*\b(claude|copilot|chatgpt|gpt|gemini|cursor|codex|devin|aider)\b/im;
const GENERATED_LINE = /generated (with|by)\b.*\b(claude|copilot|chatgpt|gemini|cursor|codex)\b/i;

/** Commit có trailer hoặc dòng ghi rõ do AI tạo. */
export function isAiCommit(message: string): boolean {
  return AI_TRAILER.test(message) || GENERATED_LINE.test(message);
}

export interface CommitStat {
  message: string;
  /** Số dòng thêm vào của commit */
  additions: number;
}

/** Tỷ lệ dòng thêm vào thuộc commit do AI viết, làm tròn 0–100. */
export function aiPercent(commits: CommitStat[]): number {
  const total = commits.reduce((n, c) => n + Math.max(0, c.additions), 0);
  if (total === 0) return 0;
  const ai = commits.filter((c) => isAiCommit(c.message)).reduce((n, c) => n + Math.max(0, c.additions), 0);
  return Math.round((ai / total) * 100);
}

const AI_SECTION = /^phần nào do ai viết.*$/im;

/**
 * Đọc mục "Phần nào do AI viết" trong mô tả PR.
 * Trả về true nếu tác giả khai có AI, false nếu khai không, null nếu để trống hoặc không có mục.
 */
export function declaredAi(description: string): boolean | null {
  const lines = description.split(/\r?\n/);
  const i = lines.findIndex((l) => AI_SECTION.test(l.trim()));
  if (i === -1) return null;
  const after = lines.slice(i + 1).join(" ").trim();
  const inline = lines[i]!.split(":").slice(1).join(":").trim();
  const text = (inline || after).toLowerCase();
  if (!text) return null;
  if (/^(không|khong|no|none|n\/a)\b/.test(text)) return false;
  return true;
}
