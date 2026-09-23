# 0001. Stack: Next.js, TypeScript, MongoDB

Ngày: 2026-09-22

## Quyết định

- Next.js (App Router) và TypeScript cho cả giao diện lẫn API. Không có server riêng.
- MongoDB làm database, dùng driver chính thức `mongodb`, không dùng ORM.
- Giao diện dựng trong Figma trước (file "pr-evidence - giao diện reviewer"), rồi chuyển sang code bằng CSS Modules.

## Thay đổi so với khung ban đầu

- `apps/github-app` gộp vào `apps/web`. Webhook là route handler tại `/api/webhooks/github`. Không cần thêm một app chỉ để nhận HTTP request.
- `apps/runner` giữ riêng. Chạy test/lint trong sandbox có giới hạn thời gian và bộ nhớ, không hợp với serverless function của Next.js. Runner cũng viết bằng TypeScript.
- `apps/web/src/pages` và `src/api` bỏ. Dùng `src/app`.
- `tsconfig.base.json` đổi từ `NodeNext` sang `Bundler` vì Next.js không cần đuôi `.js` trong import.
- `DATABASE_URL` đổi thành `MONGODB_URI` và `MONGODB_DB`.
- `packages/db/migrations` chưa dùng. MongoDB không có migration schema. Index tạo bằng `ensureIndexes()` trong lúc seed.

## Cập nhật 2026-09-22: tách claim, ghép evidence, chạy test có giới hạn

- `packages/claims`: tách claim từ mục "Thay đổi này làm gì" trong mô tả PR và từ dòng đầu commit message (bỏ tiền tố kiểu `feat:`, bỏ merge/revert). Bỏ trùng theo nội dung đã chuẩn hóa, ưu tiên bản trong mô tả.
- `packages/ai-labels`: nhận diện commit do AI qua trailer `Co-authored-by` hoặc dòng "Generated with". Tính `aiPercent` theo tỷ lệ dòng thêm vào, không theo số claim.
- `packages/evidence/src/diff.ts` + `match.ts`: parse unified diff, ghép claim với hunk bằng token overlap (bỏ dấu tiếng Việt, tách camelCase/snake_case). Đây là heuristic, không phải hiểu ngữ nghĩa — matcher khớp tốt nhất với claim có thuật ngữ tiếng Anh hoặc con số trùng với code.
- `packages/checks`: chạy lệnh qua `child_process.spawn` với danh sách lệnh cho phép, timeout bằng cách kill cả process group, cắt output quá lớn. **Chưa** cô lập filesystem/network — mới chỉ giới hạn thời gian và lệnh, chưa phải sandbox thật.
- `apps/runner`: `processPullRequest` nối `runChecks` → `analyze` → lưu DB. Chạy qua CLI (`pnpm --filter @pr-evidence/runner process-pr`), gọi từ `.github/workflows/pr-evidence.yml`, **không** gọi trong route webhook của Next.js vì cần checkout code thật và chạy lâu hơn thời gian một serverless function nên có.
- `savePullRequest` (packages/db) giữ trạng thái duyệt cũ nếu claim có cùng nội dung ở lần phân tích trước, để commit mới không xóa lịch sử duyệt.

## Chưa làm

- Đăng nhập cho reviewer. Hiện ai mở được trang thì duyệt được.
- Comment và check run ngược lên GitHub sau khi duyệt/trả lại.
- Sandbox cô lập thật (container riêng, không có mạng) cho `packages/checks`.
- Giao diện hiển thị trạng thái "đang phân tích" trong lúc CI chạy runner.
