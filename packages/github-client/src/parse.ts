/**
 * Chuẩn hóa và trích xuất "owner/repo" từ nhiều định dạng đầu vào khác nhau:
 * - URL: "https://github.com/owner/repo" hoặc "https://github.com/owner/repo/"
 * - Git URL: "https://github.com/owner/repo.git" hoặc "git@github.com:owner/repo.git"
 * - Domain URL: "github.com/owner/repo"
 * - Chuẩn: "owner/repo"
 *
 * Trả về chuỗi dạng "owner/repo" hoặc null nếu không hợp lệ.
 */
export function parseGithubRepo(input?: string | null): string | null {
  if (!input || typeof input !== "string") return null;

  let str = input.trim();
  if (!str) return null;

  // Xử lý SSH format: git@github.com:owner/repo.git
  if (str.startsWith("git@github.com:")) {
    str = str.replace(/^git@github\.com:/, "");
  } else if (/^https?:\/\//i.test(str)) {
    try {
      const url = new URL(str);
      const host = url.hostname.toLowerCase();
      if (host !== "github.com" && host !== "www.github.com") {
        return null;
      }
      // Bỏ dấu gạch chéo đầu
      str = url.pathname.replace(/^\/+/, "");
    } catch {
      return null;
    }
  } else if (/^(www\.)?github\.com\//i.test(str)) {
    str = str.replace(/^(www\.)?github\.com\//i, "");
  }

  // Tách các phần tử theo dấu gạch chéo
  const segments = str.split("/").map((s) => s.trim()).filter(Boolean);
  if (segments.length < 2) return null;

  const owner = segments[0];
  let repo = segments[1];
  if (!owner || !repo) return null;

  // Loại bỏ đuôi .git nếu có
  repo = repo.replace(/\.git$/i, "");

  // Kiểm tra tên hợp lệ (chỉ gồm ký tự chữ, số, dấu gạch nối, chấm, gạch dưới)
  const validPattern = /^[a-zA-Z0-9_.-]+$/;
  if (!validPattern.test(owner) || !validPattern.test(repo)) {
    return null;
  }

  return `${owner}/${repo}`;
}
