import { runCommand, type RunResult } from "./run";

export interface DockerRunOptions {
  /** Thư mục repo trên host, mount chỉ đọc vào /work trong container */
  repoDir: string;
  /** Lệnh chạy trong container, ví dụ ["pnpm", "exec", "vitest", "run"] */
  command: string[];
  timeoutMs: number;
  maxOutputBytes?: number;
  image?: string;
  memory?: string;
  cpus?: string;
}

const DEFAULT_IMAGE = "node:24-slim";

/**
 * Dựng tham số cho `docker run`: không mạng (`--network none`), filesystem chỉ đọc
 * trừ /tmp, giới hạn CPU/RAM/số tiến trình, không capability nào, không quyền root,
 * repo mount chỉ đọc. Đây là lớp cô lập mạnh hơn runCommand thường (vốn chỉ giới hạn
 * thời gian và danh sách lệnh) — dùng khi máy chạy runner có Docker.
 */
export function buildDockerArgs(opts: DockerRunOptions): string[] {
  return [
    "run",
    "--rm",
    "--network",
    "none",
    "--cpus",
    opts.cpus ?? "1",
    "--memory",
    opts.memory ?? "512m",
    "--pids-limit",
    "256",
    "--read-only",
    "--tmpfs",
    "/tmp:size=256m",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--user",
    "1000:1000",
    "-v",
    `${opts.repoDir}:/work:ro`,
    "-w",
    "/work",
    opts.image ?? DEFAULT_IMAGE,
    ...opts.command,
  ];
}

/** Có `docker` trong PATH và daemon trả lời không. Không có thì apps/runner rơi về runCommand thường. */
export async function isDockerAvailable(run: typeof runCommand = runCommand): Promise<boolean> {
  try {
    const r = await run("docker", ["version", "--format", "{{.Server.Version}}"], { cwd: process.cwd(), timeoutMs: 5000 });
    return r.exitCode === 0 && !r.timedOut;
  } catch {
    return false;
  }
}

/**
 * repo mount --read-only nên lệnh bên trong container không tự ghi lại được vào repo
 * (ví dụ eslint --fix sẽ lỗi thay vì âm thầm sửa file). Điều đó đúng ý: runner chỉ đọc
 * kết quả, không cho phép PR tự sửa code trong lúc kiểm tra.
 */
export async function runInDocker(opts: DockerRunOptions, run: typeof runCommand = runCommand): Promise<RunResult> {
  return run("docker", buildDockerArgs(opts), {
    cwd: opts.repoDir,
    timeoutMs: opts.timeoutMs,
    maxOutputBytes: opts.maxOutputBytes,
  });
}
