export type ClaimSource = "description" | "commit";

export interface ExtractedClaim {
  text: string;
  source: ClaimSource;
  /** Vị trí commit trong ExtractInput.commits, chỉ có khi source là "commit" */
  commitIndex?: number;
}

export interface ExtractInput {
  /** Nội dung mô tả PR, theo .github/pull_request_template.md */
  description: string;
  /** Nội dung đầy đủ của từng commit (dòng đầu là subject) */
  commits: string[];
}

const CLAIM_HEADING = /^thay đổi này làm gì\s*:?\s*$/i;
const OTHER_HEADING = /^(cách kiểm tra|phần nào do ai viết.*)\s*:?\s*$/i;
const BULLET = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/;
const CONVENTIONAL_PREFIX = /^(feat|fix|chore|docs|refactor|test|perf|build|ci|style)(\([^)]*\))?!?:\s*/i;

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/[.!\s]+$/, "").trim();
}

/** Lấy các dòng thuộc mục "Thay đổi này làm gì". Không có mục đó thì lấy toàn bộ mô tả. */
function claimSection(description: string): string[] {
  const lines = description.split(/\r?\n/);
  const start = lines.findIndex((l) => CLAIM_HEADING.test(l.trim()));
  if (start === -1) return lines.filter((l) => !OTHER_HEADING.test(l.trim()));
  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (OTHER_HEADING.test(line.trim())) break;
    out.push(line);
  }
  return out;
}

function fromDescription(description: string): string[] {
  const lines = claimSection(description).map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => BULLET.test(l)).map((l) => l.replace(BULLET, "").trim());
  // Không có gạch đầu dòng thì mỗi dòng là một claim.
  return (bullets.length > 0 ? bullets : lines).filter((t) => t.length > 0);
}

function fromCommit(message: string): string | null {
  const subject = message.split(/\r?\n/)[0]?.trim() ?? "";
  if (!subject || /^merge\b/i.test(subject) || /^revert\b/i.test(subject)) return null;
  const text = subject.replace(CONVENTIONAL_PREFIX, "").trim();
  return text.length > 0 ? text : null;
}

/** Tách claim từ mô tả PR và commit. Bỏ trùng theo nội dung đã chuẩn hóa. */
export function extractClaims(input: ExtractInput): ExtractedClaim[] {
  const seen = new Set<string>();
  const result: ExtractedClaim[] = [];
  const add = (text: string, source: ClaimSource, commitIndex?: number) => {
    const key = normalize(text);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(commitIndex === undefined ? { text, source } : { text, source, commitIndex });
  };
  for (const t of fromDescription(input.description)) add(t, "description");
  input.commits.forEach((m, i) => {
    const t = fromCommit(m);
    if (t) add(t, "commit", i);
  });
  return result;
}
