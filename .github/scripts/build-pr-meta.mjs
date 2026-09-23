// Đọc $PR_JSON (payload pull_request của GitHub Actions) và commit log,
// ghi ra pr-meta.json cho apps/runner/src/cli.ts đọc.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const pr = JSON.parse(process.env.PR_JSON);
const base = pr.base.ref;
const log = execSync(`git log origin/${base}..HEAD --format=%B%x00%an%x00%H --numstat`, {
  maxBuffer: 20 * 1024 * 1024,
}).toString("utf8");

// Parser đơn giản: mỗi commit ngăn bởi số liệu numstat rồi dòng trống trước %x00.
const commits = [];
for (const block of log.split(/(?=\S.*\x00)/)) {
  const [head, ...rest] = block.split("\n");
  if (!head?.includes("\0")) continue;
  const [message] = head.split("\0");
  const additions = rest.reduce((n, l) => {
    const m = /^(\d+)\t\d+\t/.exec(l);
    return m ? n + Number(m[1]) : n;
  }, 0);
  commits.push({ message: message.trim(), additions });
}

writeFileSync(
  "pr-meta.json",
  JSON.stringify(
    {
      repo: pr.base.repo.full_name,
      number: pr.number,
      title: pr.title,
      author: pr.user.login,
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      description: pr.body ?? "",
      commits,
    },
    null,
    2,
  ),
);
