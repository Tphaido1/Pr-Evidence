import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pr-evidence/db", () => ({
  upsertPullRequestShell: vi.fn(async () => {}),
  createNotification: vi.fn(async () => ({})),
}));
import { createNotification, upsertPullRequestShell } from "@pr-evidence/db";
import { POST } from "./route";

const secret = "test-secret";
const sign = (body: string) => "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

function req(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/webhooks/github", {
    method: "POST",
    body,
    headers: { "x-hub-signature-256": sign(body), "x-github-event": "pull_request", ...headers },
  });
}

const openedPayload = JSON.stringify({
  action: "opened",
  number: 42,
  pull_request: { title: "t", user: { login: "minh" }, head: { ref: "feat" }, base: { ref: "main" } },
  repository: { full_name: "acme/pr-evidence" },
});

describe("POST /api/webhooks/github", () => {
  beforeEach(() => {
    process.env.WEBHOOK_SECRET = secret;
    vi.clearAllMocks();
  });

  it("401 khi chữ ký sai", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST", body: "{}", headers: { "x-hub-signature-256": "sha256=sai", "x-github-event": "pull_request" } }));
    expect(res.status).toBe(401);
    expect(upsertPullRequestShell).not.toHaveBeenCalled();
  });

  it("500 khi thiếu WEBHOOK_SECRET", async () => {
    delete process.env.WEBHOOK_SECRET;
    const res = await POST(req(openedPayload));
    expect(res.status).toBe(500);
  });

  it("200 và bỏ qua khi event là ping", async () => {
    const res = await POST(req("{}", { "x-github-event": "ping" }));
    expect(res.status).toBe(200);
    expect(upsertPullRequestShell).not.toHaveBeenCalled();
  });

  it("202 và bỏ qua khi event không phải pull_request", async () => {
    const res = await POST(req("{}", { "x-github-event": "push" }));
    expect(res.status).toBe(202);
    expect(upsertPullRequestShell).not.toHaveBeenCalled();
  });

  it("202 và bỏ qua action không xử lý (ví dụ closed)", async () => {
    const body = JSON.stringify({ ...JSON.parse(openedPayload), action: "closed" });
    const res = await POST(req(body));
    expect(res.status).toBe(202);
    expect(upsertPullRequestShell).not.toHaveBeenCalled();
  });

  it("202 và gọi upsertPullRequestShell cùng createNotification với dữ liệu đúng khi action là opened", async () => {
    const res = await POST(req(openedPayload));
    expect(res.status).toBe(202);
    expect(upsertPullRequestShell).toHaveBeenCalledWith({
      id: "acme/pr-evidence#42",
      repo: "acme/pr-evidence",
      number: 42,
      title: "t",
      author: "minh",
      headBranch: "feat",
      baseBranch: "main",
    });
    expect(createNotification).toHaveBeenCalledWith({
      type: "new_pr",
      repo: "acme/pr-evidence",
      prNumber: 42,
      title: "t",
      author: "minh",
    });
  });

  it("xử lý synchronize giống opened", async () => {
    const body = JSON.stringify({ ...JSON.parse(openedPayload), action: "synchronize" });
    const res = await POST(req(body));
    expect(res.status).toBe(202);
    expect(upsertPullRequestShell).toHaveBeenCalledTimes(1);
  });
});
