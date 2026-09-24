# HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN PR-EVIDENCE TỪ ĐẦU (TỪ LÚC CHƯA CÓ NODE_MODULES)

Tài liệu này hướng dẫn chi tiết từng bước để thiết lập, cài đặt dependencies và khởi chạy dự án **pr-evidence** từ trạng thái máy mới hoặc vừa xóa sạch `node_modules`.

---

## 1. Yêu cầu tiên quyết (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

1. **Node.js**: Phiên bản khuyến nghị là **Node.js 20+** hoặc **Node.js 24** (đã bao gồm sẵn `npm` và `corepack`).
   - Kiểm tra bằng lệnh: `node -v`
2. **Git**: Dùng để quản lý mã nguồn.
   - Kiểm tra bằng lệnh: `git --version`
3. **MongoDB**:
   - Sử dụng **MongoDB Atlas** (đám mây miễn phí) hoặc **MongoDB Local** chạy trên cổng mặc định `27017`.

---

## 2. Bước 1: Cài đặt công cụ quản lý gói `pnpm`

Dự án sử dụng mô hình monorepo quản lý bằng `pnpm workspace`. Nếu máy tính của bạn báo lỗi:
> *'pnpm' is not recognized as a name of a cmdlet, function, script file...*

Hãy cài đặt `pnpm` toàn cục bằng lệnh:

```bash
npm install -g pnpm
```

> **Mẹo hữu ích**:
> - Sau khi chạy lệnh trên, bạn nên **tắt và mở lại tab Terminal mới** để Windows nạp lại biến môi trường `PATH`.
> - Nếu bạn không muốn cài đặt toàn cục, bạn hoàn toàn có thể thêm tiền tố `npx` vào trước mọi lệnh: `npx pnpm install`, `npx pnpm dev`, `npx pnpm test`.

Kiểm tra pnpm đã sẵn sàng:
```bash
pnpm -v
# Kết quả ra phiên bản: 9.x.x
```

---

## 3. Bước 2: Cấu hình biến môi trường (`.env`)

Tạo file `.env` tại thư mục gốc của dự án (`c:\pr-evidence\.env`):

```bash
cp .env.example .env
```

Mở file `.env` và thiết lập các thông số:

```env
# 1. Cấu hình cơ sở dữ liệu MongoDB
# Nếu dùng MongoDB Local:
# MONGODB_URI=mongodb://localhost:27017/pr_evidence
# MONGODB_DB=pr_evidence

# Nếu dùng MongoDB Atlas (Cloud):
MONGODB_URI=mongodb://pt329004_db_user:QtHys4pdRJ5s7251@ac-p6v6buk-shard-00-00.waxeqnl.mongodb.net:27017,ac-p6v6buk-shard-00-01.waxeqnl.mongodb.net:27017,ac-p6v6buk-shard-00-02.waxeqnl.mongodb.net:27017/pr_evidence?ssl=true&replicaSet=atlas-5wpiwx-shard-0&authSource=admin&retryWrites=true&w=majority
MONGODB_DB=pr_evidence

# 2. Đăng nhập Reviewer
REVIEWER_PASSWORD=000000
SESSION_SECRET=d257ea56ff1d92d44f237eabb96bbe33dc21b7d3e54b1008e390c09492d3dae0

# 3. GitHub Token (Tùy chọn - khuyên dùng để không bị giới hạn 60 lượt gọi API/giờ của GitHub)
# GITHUB_TOKEN=ghp_your_personal_access_token_here
```

---

## 4. Bước 3: Cài đặt toàn bộ thư viện dependencies (`node_modules`)

Tại thư mục gốc dự án (`c:\pr-evidence`), chạy lệnh:

```bash
pnpm install
```
*(hoặc `npx pnpm install`)*

Lệnh này sẽ tự động cài đặt toàn bộ dependencies cho tất cả 10 packages/apps trong monorepo và liên kết symlink giữa các gói nội bộ (`@pr-evidence/db`, `@pr-evidence/types`, `@pr-evidence/evidence`,...). Quá trình chỉ mất khoảng 1-3 giây nhờ cơ chế cache thông minh của pnpm.

---

## 5. Bước 4 (Tùy chọn): Khởi tạo dữ liệu mẫu (Seed Database)

Nếu cơ sở dữ liệu của bạn đang trống và bạn muốn nạp sẵn 7 Pull Request mẫu (gồm đủ trạng thái phân tích xong, đang chờ, lỗi):

```bash
pnpm seed
```
*(hoặc `npx pnpm seed`)*

---

## 6. Bước 5: Khởi động dự án (Start Dev Server)

Chạy lệnh sau để khởi động máy chủ Next.js App Router:

```bash
pnpm dev
```
*(hoặc `npx pnpm dev`)*

Khi màn hình xuất hiện:
```
▲ Next.js 15.x
- Local: http://localhost:3000
✓ Starting...
```

👉 Mở trình duyệt web và truy cập địa chỉ: **[http://localhost:3000](http://localhost:3000)**

---

## 7. Bước 6: Đăng nhập & Trải nghiệm các tính năng

1. **Đăng nhập**:
   - Khi hệ thống yêu cầu xác thực, nhập mật khẩu: `000000` (được cấu hình trong `.env`).
2. **Quản lý Repository & Đồng bộ PR từ GitHub**:
   - Vào mục **Repository** trên thanh điều hướng bên trái.
   - Nhập đường link GitHub (ví dụ: `https://github.com/Tphaido1/Web-E-commerce` hoặc `Tphaido1/Web-E-commerce`).
   - Bấm **Thêm repository** -> Hệ thống tự động lấy metadata và toàn bộ danh sách PR về lưu vào MongoDB.
   - Có thể bấm **Đồng bộ từ GitHub** bất kỳ lúc nào để làm mới danh sách PR.
3. **Chuông thông báo (Notification Bell)**:
   - Góc trên bên phải hoặc thanh sidebar có icon chuông với badge đỏ đếm số lượng PR mới.
   - Nhấp vào để xem danh sách thông báo và đánh dấu đã đọc.
4. **Phân tích PR trực tiếp ("⚡ Phân tích ngay")**:
   - Khi mở một PR đang ở trạng thái chờ phân tích (`queued`), bấm nút **⚡ Phân tích ngay**.
   - Ứng dụng sẽ gọi GitHub API lấy diff, commit, bóc tách claim, nhận diện phần do AI viết và ghép claim vào từng đoạn code hunk.
5. **Duyệt / Trả lại claim**:
   - Reviewer có thể đọc từng claim và bấm **Duyệt** hoặc **Trả lại** trực tiếp trên từng dòng của bảng ClaimTable.
6. **Tìm kiếm PR thông minh (Search Bar)**:
   - Dùng thanh tìm kiếm ở trang chủ để tìm theo tiêu đề, tác giả, `#số PR`, nội dung claim.
   - Nhấn phím tắt `Ctrl + K` hoặc `/` để focus nhanh vào ô tìm kiếm.
   - Lọc theo Repository từ dropdown menu.
   - Bấm `✕` để xóa từng điều kiện lọc hoặc "Đặt lại tất cả".
7. **Xuất dữ liệu Excel / CSV chuẩn UTF-8 BOM**:
   - Bấm nút **Xuất Excel / CSV** ở trang chủ:
     - 📊 **Xuất danh sách PR**: Xuất báo cáo tổng quan.
     - 📑 **Chi tiết Claim & Evidence**: Xuất toàn bộ claim, code hunk, test/lint.
   - Xuất riêng cho từng PR: Bấm **Xuất Excel/CSV** ngay trên trang chi tiết PR.
   - File `.csv` tự động gắn UTF-8 BOM (`\uFEFF`), mở trực tiếp trên Microsoft Excel và Google Sheets không bị lỗi font tiếng Việt.

---

## 8. Bước 7: Kiểm thử chất lượng (Testing & Typecheck)

Để đảm bảo toàn bộ hệ thống hoạt động ổn định và không có lỗi kiểu:

```bash
# Chạy kiểm thử tự động toàn diện (141 unit/integration tests)
pnpm test

# Kiểm tra kiểu dữ liệu TypeScript (0 lỗi)
pnpm typecheck
```

---

## 9. Xử lý sự cố thường gặp (Troubleshooting)

### 1. Lỗi `pnpm: The term 'pnpm' is not recognized`
- **Nguyên nhân**: `pnpm` chưa được cài hoặc terminal chưa cập nhật PATH.
- **Khắc phục**:
  - Chạy `npm install -g pnpm`
  - Tắt terminal đi mở lại tab mới.
  - Hoặc dùng thay thế: `npx pnpm <lệnh>`.

### 2. Lỗi kết nối MongoDB Atlas trên Windows (`querySrv ENODATA`)
- **Nguyên nhân**: DNS của một số nhà mạng chặn truy vấn SRV `mongodb+srv://`.
- **Khắc phục**: Sử dụng chuỗi kết nối dạng danh sách shard trực tiếp (`mongodb://user:pass@host1:27017,host2:27017,...`) như đã được thiết lập sẵn trong file `.env`.

### 3. Cổng 3000 bị chiếm dụng (`Port 3000 is already in use`)
- **Khắc phục**:
  - Tắt các tiến trình node cũ bằng PowerShell:
    ```powershell
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    ```
  - Hoặc khởi chạy trên cổng khác:
    ```bash
    PORT=3001 pnpm dev
    ```

### 4. Muốn xóa `node_modules` để tiết kiệm dung lượng khi không dùng
- Đảm bảo đã tắt dev server và các tiến trình node:
  ```powershell
  Get-Process node, mongod* -ErrorAction SilentlyContinue | Stop-Process -Force
  cmd /c "rmdir /s /q node_modules"
  ```
- Khi muốn chạy lại dự án: Chỉ cần gõ `pnpm install` rồi `pnpm dev`.
