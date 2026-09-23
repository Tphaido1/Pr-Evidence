import { spawn } from "node:child_process";

export interface RunOptions {
  cwd: string;
  timeoutMs: number;
  /** Cắt output khi vượt số byte này */
  maxOutputBytes?: number;
  /**
   * Biến môi trường bổ sung. KHÔNG kế thừa process.env của tiến trình runner —
   * code trong PR không được thấy MONGODB_URI, GITHUB_TOKEN hay bất kỳ secret nào
   * runner đang giữ. Chỉ PATH/HOME tối thiểu cộng với env truyền vào đây.
   */
  env?: Record<string, string>;
  /** Giới hạn bộ nhớ heap V8, MB. Không giới hạn bộ nhớ ngoài heap (buffer, native). */
  maxMemoryMb?: number;
}

export interface RunResult {
  exitCode: number | null;
  timedOut: boolean;
  truncated: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
}

/** Chỉ cho chạy các lệnh trong danh sách này. Runner không chạy lệnh tùy ý từ PR. */
const ALLOWED = new Set(["pnpm", "npm", "npx", "node", "vitest", "eslint", "tsc", "docker"]);

/** Biến môi trường tối thiểu để pnpm/node chạy được. Không có gì nhạy cảm. */
const SAFE_BASE_ENV: Record<string, string | undefined> = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  // pnpm/npm cần biết đường dẫn cache/store, không cần thứ gì khác từ máy host.
  npm_config_cache: process.env.npm_config_cache,
  CI: "true",
};

export function assertAllowed(command: string): void {
  if (!ALLOWED.has(command)) throw new Error(`Lệnh không được phép: ${command}`);
}

function buildEnv(extra: Record<string, string> | undefined, maxMemoryMb: number | undefined) {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(SAFE_BASE_ENV)) if (v !== undefined) env[k] = v;
  if (maxMemoryMb) env.NODE_OPTIONS = `--max-old-space-size=${maxMemoryMb}`;
  return { ...env, ...extra };
}

// async để assertAllowed ném lỗi cũng biến thành promise bị reject, không ném đồng bộ.
export async function runCommand(command: string, args: string[], opts: RunOptions): Promise<RunResult> {
  assertAllowed(command);
  const max = opts.maxOutputBytes ?? 1_000_000;
  const started = Date.now();

  return new Promise((resolve, reject) => {
    // detached: tạo process group riêng để kill được cả tiến trình con.
    const child = spawn(command, args, {
      cwd: opts.cwd,
      env: buildEnv(opts.env, opts.maxMemoryMb),
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let truncated = false;
    let timedOut = false;

    const collect = (which: "out" | "err") => (chunk: Buffer) => {
      const cur = which === "out" ? stdout : stderr;
      if (cur.length >= max) {
        truncated = true;
        return;
      }
      const next = cur + chunk.toString("utf8");
      const cut = next.length > max ? ((truncated = true), next.slice(0, max)) : next;
      if (which === "out") stdout = cut;
      else stderr = cut;
    };
    child.stdout.on("data", collect("out"));
    child.stderr.on("data", collect("err"));

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (child.pid) process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }, opts.timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, timedOut, truncated, durationMs: Date.now() - started, stdout, stderr });
    });
  });
}
