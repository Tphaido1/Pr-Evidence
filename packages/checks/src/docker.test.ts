import { describe, expect, it, vi } from "vitest";
import type { runCommand, RunResult } from "./run";
import { buildDockerArgs, isDockerAvailable, runInDocker } from "./docker";

const ok = (over: Partial<RunResult> = {}): RunResult => ({
  exitCode: 0, timedOut: false, truncated: false, durationMs: 1, stdout: "", stderr: "", ...over,
});

describe("buildDockerArgs", () => {
  const args = buildDockerArgs({ repoDir: "/repo/pr-42", command: ["pnpm", "test"], timeoutMs: 1000 });

  it("chặn mạng", () => {
    expect(args).toContain("none");
    expect(args[args.indexOf("--network") + 1]).toBe("none");
  });
  it("filesystem chỉ đọc, trừ /tmp", () => {
    expect(args).toContain("--read-only");
    expect(args.some((a) => a.startsWith("/tmp:"))).toBe(true);
  });
  it("bỏ hết capability và chặn leo quyền", () => {
    expect(args[args.indexOf("--cap-drop") + 1]).toBe("ALL");
    expect(args).toContain("no-new-privileges");
  });
  it("không chạy bằng root", () => {
    expect(args[args.indexOf("--user") + 1]).not.toBe("0:0");
    expect(args[args.indexOf("--user") + 1]).toBe("1000:1000");
  });
  it("mount repo chỉ đọc đúng đường dẫn", () => {
    expect(args).toContain("/repo/pr-42:/work:ro");
  });
  it("giới hạn CPU, RAM và số tiến trình, dùng được giá trị tùy chỉnh", () => {
    const custom = buildDockerArgs({ repoDir: "/r", command: ["x"], timeoutMs: 1, memory: "1g", cpus: "2" });
    expect(custom[custom.indexOf("--memory") + 1]).toBe("1g");
    expect(custom[custom.indexOf("--cpus") + 1]).toBe("2");
    expect(custom).toContain("256");
  });
  it("lệnh của PR nằm cuối cùng, sau tên image", () => {
    expect(args.slice(-2)).toEqual(["pnpm", "test"]);
  });
});

describe("isDockerAvailable", () => {
  it("true khi docker version trả về 0", async () => {
    const run = vi.fn(async () => ok()) as unknown as typeof runCommand;
    expect(await isDockerAvailable(run)).toBe(true);
  });
  it("false khi lệnh lỗi hoặc docker không có", async () => {
    const run = vi.fn(async () => { throw new Error("not found"); }) as unknown as typeof runCommand;
    expect(await isDockerAvailable(run)).toBe(false);
  });
  it("false khi timeout", async () => {
    const run = vi.fn(async () => ok({ timedOut: true })) as unknown as typeof runCommand;
    expect(await isDockerAvailable(run)).toBe(false);
  });
});

describe("runInDocker", () => {
  it("gọi runCommand với 'docker' và args đã dựng, cwd là repoDir", async () => {
    const run = vi.fn(async () => ok({ stdout: "xong" })) as unknown as typeof runCommand;
    const r = await runInDocker({ repoDir: "/repo/pr-1", command: ["pnpm", "test"], timeoutMs: 5000 }, run);
    expect(run).toHaveBeenCalledWith("docker", expect.arrayContaining(["run", "--rm"]), { cwd: "/repo/pr-1", timeoutMs: 5000, maxOutputBytes: undefined });
    expect(r.stdout).toBe("xong");
  });
});
