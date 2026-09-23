import { describe, expect, it } from "vitest";
import { parseGithubRepo } from "./parse";

describe("parseGithubRepo", () => {
  it("nhận diện chuẩn owner/repo", () => {
    expect(parseGithubRepo("Tphaido1/Web-E-commerce")).toBe("Tphaido1/Web-E-commerce");
    expect(parseGithubRepo("  vercel/next.js  ")).toBe("vercel/next.js");
  });

  it("trích xuất từ HTTPS URL", () => {
    expect(parseGithubRepo("https://github.com/Tphaido1/Web-E-commerce")).toBe("Tphaido1/Web-E-commerce");
    expect(parseGithubRepo("https://github.com/Tphaido1/Web-E-commerce/")).toBe("Tphaido1/Web-E-commerce");
    expect(parseGithubRepo("https://www.github.com/facebook/react")).toBe("facebook/react");
  });

  it("trích xuất từ URL có subpath như /pulls", () => {
    expect(parseGithubRepo("https://github.com/Tphaido1/Web-E-commerce/pulls")).toBe("Tphaido1/Web-E-commerce");
    expect(parseGithubRepo("https://github.com/Tphaido1/Web-E-commerce/tree/main")).toBe("Tphaido1/Web-E-commerce");
  });

  it("trích xuất từ URL có đuôi .git", () => {
    expect(parseGithubRepo("https://github.com/Tphaido1/Web-E-commerce.git")).toBe("Tphaido1/Web-E-commerce");
  });

  it("trích xuất từ SSH URL", () => {
    expect(parseGithubRepo("git@github.com:Tphaido1/Web-E-commerce.git")).toBe("Tphaido1/Web-E-commerce");
    expect(parseGithubRepo("git@github.com:Tphaido1/Web-E-commerce")).toBe("Tphaido1/Web-E-commerce");
  });

  it("trích xuất từ domain không có scheme", () => {
    expect(parseGithubRepo("github.com/Tphaido1/Web-E-commerce")).toBe("Tphaido1/Web-E-commerce");
    expect(parseGithubRepo("www.github.com/Tphaido1/Web-E-commerce")).toBe("Tphaido1/Web-E-commerce");
  });

  it("trả về null nếu không hợp lệ hoặc từ host khác", () => {
    expect(parseGithubRepo("")).toBeNull();
    expect(parseGithubRepo("   ")).toBeNull();
    expect(parseGithubRepo("just-a-name")).toBeNull();
    expect(parseGithubRepo("https://gitlab.com/owner/repo")).toBeNull();
    expect(parseGithubRepo("https://bitbucket.org/owner/repo")).toBeNull();
    expect(parseGithubRepo("http://notgithub.com/a/b")).toBeNull();
  });
});
