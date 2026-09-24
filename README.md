# pr-evidence

GitHub App cho đội dev nhỏ. Với mỗi pull request, nó lập một bảng gồm claim, code và evidence: PR nói gì, đoạn code nào tương ứng, và test hoặc lint nào chứng minh điều đó. Reviewer đọc bảng này thay vì tự đoán xem lời mô tả có khớp với diff hay không.

## Bản đầu làm gì

- Quản lý Repository và lấy trực tiếp dữ liệu/PR từ GitHub REST API (hỗ trợ nhập cả tên `owner/repo` hoặc dán link đầy đủ `https://github.com/...`).
- Hệ thống thông báo in-app thời gian thực (Notification Bell) mỗi khi có PR mới xuất hiện.
- Phân tích PR trực tiếp (On-Demand Analysis) ngay trên giao diện web thông qua GitHub API, hoặc chạy tự động qua webhook/CI Actions.
- **Tìm kiếm PR thông minh**: tìm kiếm tức thời (debounced) theo từ khóa tiêu đề, tác giả, `#số PR`, tên repository, hoặc nội dung claim; đồng thời kết hợp lọc theo repository và trạng thái duyệt.
- **Xuất dữ liệu Excel / CSV chuẩn UTF-8**:
  - Xuất danh sách tổng quan PR kèm thống kê evidence và trạng thái duyệt.
  - Xuất chi tiết từng dòng Claim, code hunk, loại Evidence và kết quả duyệt ra file CSV có gắn UTF-8 BOM (`\uFEFF`) để mở trực tiếp trên Microsoft Excel, Google Sheets mà không vỡ font tiếng Việt.
  - Hỗ trợ xuất bảng claim của từng PR riêng lẻ ngay trên trang chi tiết PR.
- Tách các claim từ mô tả PR và commit.
- Ghép mỗi claim với đoạn diff và kết quả test/lint liên quan (chạy qua CI sandbox hoặc trích xuất từ GitHub Check Runs).
- Gắn nhãn phần nào do AI viết và tỷ lệ % code AI.
- Cho reviewer duyệt hoặc trả lại từng dòng trong bảng claim-code-evidence.

Chưa làm: tự sửa code, tự merge, hỗ trợ GitLab.

## Cấu trúc thư mục

```
apps/
  web/          Next.js (App Router): trang reviewer, quản lý repos, chuông thông báo, API và webhook GitHub (/api/webhooks/github)
  runner/       CLI chạy qua CI (.github/workflows/pr-evidence.yml): chạy test/lint sandbox, tách claim, ghép evidence, cập nhật DB & GitHub
  github-app/   khung cũ đã gộp vào apps/web (xem docs/decisions/0001-stack.md)

packages/
  types/        kiểu dữ liệu dùng chung (PullRequest, Repository, AppNotification, Claim, Evidence, AnalysisStatus, ...)
  claims/       tách claim từ mô tả PR và commit
  ai-labels/    nhận diện commit/claim do AI viết, tính tỷ lệ % code AI
  checks/       chạy lệnh test/lint có giới hạn thời gian/bộ nhớ, cô lập bằng Docker
  evidence/     parse diff, ghép claim với code hunk qua token overlap, tổng hợp evidence
  db/           MongoDB (Atlas & Local): quản lý pull_requests, repositories, notifications, bảo toàn lịch sử duyệt
  github-client/ chuẩn hóa URL repo, lấy metadata, PRs, diff, commits, check-runs và đăng check run/comment lên GitHub
  config/       cấu hình dùng chung
evals/          bộ PR có đáp án chuẩn để đo giảm lỗi
fixtures/       PR mẫu dùng cho test (7 PR mẫu với các trạng thái done, queued, failed)
docs/           ghi chú và quyết định thiết kế (docs/decisions: stack, auth, sandbox)
scripts/        script chạy tay
```

Test viết cạnh file nguồn, đặt tên `*.test.ts`.

## Stack

Next.js (App Router) và TypeScript cho cả giao diện lẫn API. MongoDB (hỗ trợ Atlas cluster và local) làm database. Lý do đổi so với khung ban đầu nằm trong `docs/decisions/0001-stack.md`.

## Chạy thử

> 📖 **Xem hướng dẫn chi tiết từng bước từ lúc chưa có `node_modules` tại:** [`HUONG_DAN_CHAY_DU_AN.md`](file:///c:/pr-evidence/HUONG_DAN_CHAY_DU_AN.md)

```bash
cp .env.example .env
# Cấu hình MONGODB_URI (dùng MongoDB Atlas hoặc MongoDB local trên cổng 27017)
pnpm install
pnpm seed                   # nạp 7 PR mẫu từ fixtures/pull-requests (đủ các trạng thái done, queued, failed)
pnpm dev                    # http://localhost:3000
pnpm test && pnpm typecheck
```

Cần Node 24 (xem `.nvmrc`).

Mặc định không cần đăng nhập. Muốn bật đăng nhập, đặt `REVIEWER_PASSWORD` và `SESSION_SECRET` trong `.env` rồi khởi động lại — xem `docs/decisions/0002-auth.md`.


## Trạng thái

Đã có: trang danh sách PR, tìm kiếm PR đa tiêu chí và xuất dữ liệu Excel/CSV (UTF-8 BOM), trang chi tiết với bảng claim-code-evidence và nút xuất CSV riêng cho từng PR, nút duyệt/trả lại từng dòng, quản lý Repository lấy trực tiếp dữ liệu từ GitHub (tự động nhận diện cả link trình duyệt, link `.git`, SSH), tính năng phân tích trực tiếp theo yêu cầu ("⚡ Phân tích ngay") qua GitHub REST API ngay trên web app, webhook nhận sự kiện PR (có kiểm tra chữ ký), hệ thống chuông thông báo (Notification) mỗi khi có PR mới, tách claim từ mô tả/commit, nhận diện AI, ghép claim với diff, chạy test/lint có giới hạn thời gian và cô lập bằng Docker khi có (`packages/checks/src/docker.ts`, không rò rỉ secret ra code PR — xem `docs/decisions/0003-sandbox.md`), workflow CI mẫu gọi `apps/runner`, ghi check run + comment tóm tắt lên GitHub, đăng nhập reviewer bằng mật khẩu dùng chung, vòng đời phân tích riêng (`analysisStatus`: chờ/đang chạy/xong/lỗi), kết nối MongoDB Atlas đám mây với cơ chế DNS fallback cho Windows, và bộ unit/integration test toàn diện (141 tests).
Chưa có: tài khoản riêng từng reviewer (đang dùng chung 1 mật khẩu — chấp nhận được cho một nhóm nhỏ dùng chung, xem `docs/decisions/0002-auth.md`), rate limit cho đăng nhập, seccomp/giới hạn đĩa riêng cho container test.

## Chạy runner cho một PR (thủ công)

```bash
cp fixtures/pr-meta.example.json pr-meta.json   # sửa lại nội dung cho đúng PR
REPO_DIR=/đường/dẫn/repo/đã/checkout PR_META_PATH=pr-meta.json pnpm --filter @pr-evidence/runner process-pr
```

Trong CI, `.github/workflows/pr-evidence.yml` tự làm việc này mỗi khi PR mở hoặc có commit mới, dùng `.github/scripts/build-pr-meta.mjs` để dựng `pr-meta.json` từ payload GitHub Actions.

