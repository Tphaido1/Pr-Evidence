import { aiPercent, declaredAi, isAiCommit } from "@pr-evidence/ai-labels";
import { extractClaims } from "@pr-evidence/claims";
import type { Claim, PullRequest } from "@pr-evidence/types";
import { parseDiff } from "./diff";
import { matchClaimToHunk } from "./match";
import { evidenceFor, type LintResult, type TestResult } from "./results";

export interface AnalyzeInput {
  repo: string;
  number: number;
  title: string;
  author: string;
  headBranch: string;
  baseBranch: string;
  description: string;
  commits: { message: string; additions: number }[];
  diff: string;
  tests: TestResult[];
  lints: LintResult[];
  now?: Date;
}

/** Ghép claim (từ mô tả và commit) với đoạn diff và kết quả test/lint. Không gọi mạng, không ghi DB. */
export function analyze(input: AnalyzeInput): PullRequest {
  const hunks = parseDiff(input.diff);
  const extracted = extractClaims({
    description: input.description,
    commits: input.commits.map((c) => c.message),
  });
  const descAi = declaredAi(input.description) === true;

  const claims: Claim[] = extracted.map((c, i) => {
    const match = matchClaimToHunk(c.text, hunks);
    const code = match?.code ?? { file: "", lineStart: 0, lineEnd: 0, snippet: "" };
    const evidence = match
      ? evidenceFor(match.code.file, input.tests, input.lints)
      : { kind: "none" as const, detail: "Chưa ghép được đoạn code" };
    const commitMsg = c.commitIndex === undefined ? undefined : input.commits[c.commitIndex]?.message;
    return {
      id: `c${i + 1}`,
      text: c.text,
      code,
      evidence,
      aiWritten: commitMsg === undefined ? descAi : isAiCommit(commitMsg),
      review: "pending",
    };
  });

  return {
    id: `${input.repo}#${input.number}`,
    repo: input.repo,
    number: input.number,
    title: input.title,
    author: input.author,
    headBranch: input.headBranch,
    baseBranch: input.baseBranch,
    aiPercent: aiPercent(input.commits),
    claims,
    analysisStatus: "done",
    updatedAt: (input.now ?? new Date()).toISOString(),
  };
}
