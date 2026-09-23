import { describe, expect, it } from "vitest";
import { assertAllowed, runCommand } from "./run";

const opts = { cwd: process.cwd(), timeoutMs: 5000 };

describe("runCommand", () => {
  it("trả stdout và exit code 0", async () => {
    const r = await runCommand("node", ["-e", "console.log('xin chào')"], opts);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe("xin chào");
    expect(r.timedOut).toBe(false);
  });

  it("giữ exit code khác 0 và stderr", async () => {
    const r = await runCommand("node", ["-e", "console.error('lỗi'); process.exit(3)"], opts);
    expect(r.exitCode).toBe(3);
    expect(r.stderr).toContain("lỗi");
  });

  it("dừng lệnh chạy quá thời gian", async () => {
    const r = await runCommand("node", ["-e", "setInterval(() => {}, 1000)"], { ...opts, timeoutMs: 300 });
    expect(r.timedOut).toBe(true);
    expect(r.durationMs).toBeLessThan(3000);
  });

  it("cắt output quá lớn", async () => {
    const r = await runCommand("node", ["-e", "process.stdout.write('a'.repeat(50000))"], { ...opts, maxOutputBytes: 1000 });
    expect(r.truncated).toBe(true);
    expect(r.stdout.length).toBeLessThanOrEqual(1000);
  });

  it("không kế thừa biến môi trường của tiến trình cha (không rò rỉ secret)", async () => {
    process.env.PR_EVIDENCE_TEST_SECRET = "bi-mat";
    try {
      const r = await runCommand("node", ["-e", "console.log(process.env.PR_EVIDENCE_TEST_SECRET ?? 'khong-co')"], opts);
      expect(r.stdout.trim()).toBe("khong-co");
    } finally {
      delete process.env.PR_EVIDENCE_TEST_SECRET;
    }
  });

  it("chỉ thấy env được truyền tường minh qua opts.env", async () => {
    const r = await runCommand("node", ["-e", "console.log(process.env.ONLY_THIS ?? 'thieu')"], { ...opts, env: { ONLY_THIS: "co" } });
    expect(r.stdout.trim()).toBe("co");
  });
});

describe("assertAllowed", () => {
  it("từ chối lệnh ngoài danh sách", async () => {
    expect(() => assertAllowed("rm")).toThrow(/không được phép/i);
    await expect(runCommand("curl", ["http://x"], opts)).rejects.toThrow();
  });
  it("cho phép pnpm và node", () => {
    expect(() => assertAllowed("pnpm")).not.toThrow();
    expect(() => assertAllowed("node")).not.toThrow();
  });
});
