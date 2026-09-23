# 0003. Cô lập khi chạy test/lint của PR

Ngày: 2026-09-22

## Vấn đề

`apps/runner` chạy `pnpm test`/`pnpm lint` của code trong PR — tức là chạy code người khác gửi tới. Hai rủi ro chính: (1) code đó đọc được secret của runner (MONGODB_URI, GITHUB_TOKEN), (2) code đó gọi mạng ra ngoài hoặc phá filesystem.

## Quyết định

- **Sửa rò rỉ secret trước tiên**: `packages/checks/src/run.ts` trước đây spawn với `{ ...process.env, ...opts.env }`, tức là mọi secret của runner lọt vào tiến trình chạy code PR. Giờ chỉ truyền `PATH`, `HOME`, `npm_config_cache` — không có gì nhạy cảm — cộng với `opts.env` được truyền tường minh.
- **Cô lập bằng Docker khi có** (`packages/checks/src/docker.ts`): `docker run --network none --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges --user 1000:1000`, mount repo `:ro`. Không mạng, không ghi được ngoài `/tmp`, không capability, không phải root.
- **`apps/runner` tự dò**: `pickExec()` kiểm tra `docker version` có chạy được không; có thì dùng `execInDocker`, không thì rơi về `execPlain` (vẫn có giới hạn thời gian, danh sách lệnh cho phép, và không rò rỉ env — chỉ thiếu phần chặn mạng/filesystem).
- `ChecksOutput.sandboxed` ghi lại đã chạy trong container hay không, để sau này có thể hiện lên giao diện hoặc log nếu cần.

## Còn thiếu

- Máy chạy CI của `.github/workflows/pr-evidence.yml` (GitHub-hosted runner) có Docker sẵn nên nhánh cô lập sẽ tự kích hoạt, nhưng chưa test trên CI thật — sandbox này không cài được Docker để kiểm tra `runInDocker()` chạy thật, chỉ test `buildDockerArgs()` dựng đúng tham số và `runInDocker()` gọi đúng `runCommand("docker", ...)`.
- Không giới hạn dung lượng đĩa ghi vào `/tmp` ngoài `--tmpfs size=256m`; chưa giới hạn số file mở, chưa có seccomp profile riêng (dùng seccomp mặc định của Docker).
- Không cô lập được `pnpm install` nếu bước cài dependency chạy trước khi vào container — cần đảm bảo `node_modules` được cài trong bước checkout (ngoài container) trước khi container chỉ chạy test/lint trên code đã cài sẵn, để container thật sự không cần mạng.
