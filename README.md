# pr-evidence

GitHub App cho đội dev nhỏ. Với mỗi pull request, nó lập một bảng gồm claim, code và evidence: PR nói gì, đoạn code nào tương ứng, và test hoặc lint nào chứng minh điều đó. Reviewer đọc bảng này thay vì tự đoán xem lời mô tả có khớp với diff hay không.

## Bản đầu làm gì

- Nhận webhook từ GitHub khi PR mở hoặc có commit mới.
- Tách các claim từ mô tả PR và commit.
- Ghép mỗi claim với đoạn diff và kết quả test/lint liên quan, chạy trong giới hạn thời gian và tài nguyên.
- Gắn nhãn phần nào do AI viết.
- Cho reviewer duyệt hoặc trả lại từng dòng trong bảng.

Chưa làm: tự sửa code, tự merge, hỗ trợ GitLab.

## Cấu trúc thư mục

```
apps/
  web/          Next.js: trang cho reviewer, API, và webhook GitHub (/api/webhooks/github)
  runner/       tách claim, ghép evidence, chạy test/lint có giới hạn; chạy qua CI (.github/workflows/pr-evidence.yml), không qua webhook

packages/
  types/        kiểu dữ liệu dùng chung
  claims/       tách claim từ mô tả PR và commit
  ai-labels/    nhận diện commit/claim do AI viết
  checks/       chạy lệnh có giới hạn thời gian/bộ nhớ output, đọc kết quả vitest/eslint
  evidence/     ghép claim với đoạn diff (packages/evidence/src/diff.ts, match.ts), tổng hợp evidence, statusOf/summarize
  db/           MongoDB: đọc/ghi pull_requests, giữ trạng thái duyệt khi phân tích lại
packages/
  claims/       tách claim từ mô tả PR và commit
  evidence/     ghép claim với diff, test và lint
  checks/       chạy lệnh test/lint trong sandbox
  ai-labels/    nhận biết và gắn nhãn phần do AI viết
  db/           schema và migration
  types/        kiểu dữ liệu dùng chung giữa các app
  config/       tsconfig và eslint dùng chung
evals/          bộ PR có đáp án chuẩn để đo giảm lỗi
fixtures/       PR mẫu dùng cho test
docs/           ghi chú và quyết định thiết kế (docs/decisions)
scripts/        script chạy tay
```

Test viết cạnh file nguồn, đặt tên `*.test.ts`.

## Stack

Next.js (App Router) và TypeScript cho cả giao diện lẫn API. MongoDB làm database. Lý do đổi so với khung ban đầu nằm trong `docs/decisions/0001-stack.md`.

## Chạy thử

```bash
cp .env.example .env
docker compose up -d        # MongoDB ở localhost:27017
pnpm install
pnpm seed                   # nạp 5 PR mẫu từ fixtures/pull-requests
pnpm dev                    # http://localhost:3000
pnpm test && pnpm typecheck
```

Cần Node 24 (xem `.nvmrc`).

Mặc định không cần đăng nhập. Muốn bật đăng nhập, đặt `REVIEWER_PASSWORD` và `SESSION_SECRET` trong `.env` rồi khởi động lại — xem `docs/decisions/0002-auth.md`.

## Trạng thái

Đã có: trang danh sách PR, trang chi tiết với bảng claim-code-evidence, nút duyệt/trả lại từng dòng, webhook nhận sự kiện PR (có kiểm tra chữ ký), tách claim từ mô tả/commit, nhận diện AI, ghép claim với diff, chạy test/lint có giới hạn thời gian và cô lập bằng Docker khi có (`packages/checks/src/docker.ts`, không rò rỉ secret ra code PR — xem `docs/decisions/0003-sandbox.md`), workflow CI mẫu gọi `apps/runner`, ghi check run + comment tóm tắt lên GitHub, đăng nhập reviewer bằng mật khẩu dùng chung, vòng đời phân tích riêng (`analysisStatus`: chờ/đang chạy/xong/lỗi) hiện rõ trên giao diện thay vì bảng trống gây hiểu nhầm, và test cho toàn bộ các phần trên (120 test).
Chưa có: tài khoản riêng từng reviewer (đang dùng chung 1 mật khẩu — chấp nhận được cho một nhóm nhỏ dùng chung, xem `docs/decisions/0002-auth.md`), rate limit cho đăng nhập, seccomp/giới hạn đĩa riêng cho container test.

## Chạy runner cho một PR (thủ công)

```bash
cp fixtures/pr-meta.example.json pr-meta.json   # sửa lại nội dung cho đúng PR
REPO_DIR=/đường/dẫn/repo/đã/checkout PR_META_PATH=pr-meta.json pnpm --filter @pr-evidence/runner process-pr
```

Trong CI, `.github/workflows/pr-evidence.yml` tự làm việc này mỗi khi PR mở hoặc có commit mới, dùng `.github/scripts/build-pr-meta.mjs` để dựng `pr-meta.json` từ payload GitHub Actions.

