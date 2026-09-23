import { createNotification, upsertPullRequestShell } from "@pr-evidence/db";
import { verifySignature } from "@/lib/github-signature";

interface PullRequestEvent {
  action: string;
  number: number;
  pull_request: {
    title: string;
    user: { login: string };
    head: { ref: string };
    base: { ref: string };
  };
  repository: { full_name: string };
}

const handled = new Set(["opened", "reopened", "synchronize", "edited"]);

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return new Response("Thiếu WEBHOOK_SECRET", { status: 500 });

  const raw = await req.text();
  if (!verifySignature(secret, raw, req.headers.get("x-hub-signature-256"))) {
    return new Response(null, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  if (event === "ping") return new Response(null, { status: 200 });
  if (event !== "pull_request") return new Response(null, { status: 202 });

  const body = JSON.parse(raw) as PullRequestEvent;
  if (!handled.has(body.action)) return new Response(null, { status: 202 });

  const repo = body.repository.full_name;
  await upsertPullRequestShell({
    id: `${repo}#${body.number}`,
    repo,
    number: body.number,
    title: body.pull_request.title,
    author: body.pull_request.user.login,
    headBranch: body.pull_request.head.ref,
    baseBranch: body.pull_request.base.ref,
  });

  if (body.action === "opened" || body.action === "reopened") {
    await createNotification({
      type: "new_pr",
      repo,
      prNumber: body.number,
      title: body.pull_request.title,
      author: body.pull_request.user.login,
    });
  }

  // Bước sau: đưa job tách claim và chạy test/lint vào hàng đợi cho apps/runner.
  return new Response(null, { status: 202 });
}

