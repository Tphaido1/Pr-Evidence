#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { savePullRequest, setAnalysisStatus } from "@pr-evidence/db";
import { publishResults } from "@pr-evidence/github-client";
import { processPullRequest } from "./jobs/process-pull-request";

/**
 * Dùng trong CI, không qua webhook, vì bước này cần checkout code và chạy
 * test/lint thật — quá nặng cho một route Next.js. Xem docs/decisions/0001-stack.md.
 *
 * Input: biến môi trường PR_META_PATH trỏ tới file JSON (mô tả PR, danh sách commit),
 * REPO_DIR là thư mục đã checkout đúng commit đầu head của PR, và HEAD_SHA cho check run.
 * GITHUB_TOKEN có thì mới ghi check run/comment lên GitHub; không có thì chỉ lưu vào MongoDB.
 *
 * Ví dụ file JSON, xem fixtures/pr-meta.example.json.
 */
interface PrMeta {
  repo: string;
  number: number;
  title: string;
  author: string;
  headBranch: string;
  baseBranch: string;
  description: string;
  commits: { message: string; additions: number }[];
}

async function main(): Promise<void> {
  const metaPath = process.env.PR_META_PATH;
  const repoDir = process.env.REPO_DIR;
  if (!metaPath || !repoDir) {
    console.error("Thiếu PR_META_PATH hoặc REPO_DIR");
    process.exit(1);
  }

  const meta = JSON.parse(await readFile(metaPath, "utf8")) as PrMeta;
  const id = `${meta.repo}#${meta.number}`;

  // Đánh dấu "đang phân tích" ngay để giao diện không hiện bảng trống trong lúc CI chạy.
  await setAnalysisStatus(id, "analyzing");

  try {
    const diff = execFileSync("git", ["diff", `origin/${meta.baseBranch}...HEAD`], {
      cwd: repoDir,
      maxBuffer: 20 * 1024 * 1024,
    }).toString("utf8");
    const headSha =
      process.env.HEAD_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoDir }).toString("utf8").trim();

    const timeoutMs = Number(process.env.CHECK_TIMEOUT_MS ?? 120_000);

    const pr = await processPullRequest(
      { ...meta, repoDir, timeoutMs, diff },
      { save: savePullRequest },
    );

    console.log(
      `Đã lưu ${pr.id}: ${pr.claims.length} claim, ${pr.claims.filter((c) => c.evidence.kind === "test_pass").length} có evidence`,
    );

    const token = process.env.GITHUB_TOKEN;
    if (token) {
      await publishResults(pr, headSha, { token });
      console.log("Đã ghi check run và comment lên GitHub");
    } else {
      console.log("Không có GITHUB_TOKEN, bỏ qua bước ghi lên GitHub");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setAnalysisStatus(id, "failed", message);
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

