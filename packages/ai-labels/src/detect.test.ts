import { describe, expect, it } from "vitest";
import { aiPercent, declaredAi, isAiCommit } from "./detect";

describe("isAiCommit", () => {
  it.each([
    "fix: x\n\nCo-authored-by: Claude <noreply@anthropic.com>",
    "feat: y\n\nCo-authored-by: GitHub Copilot <copilot@github.com>",
    "feat: z\n\n🤖 Generated with Claude Code",
  ])("nhận commit do AI: %s", (m) => expect(isAiCommit(m)).toBe(true));

  it("không gắn nhãn commit thường", () => {
    expect(isAiCommit("fix: x\n\nCo-authored-by: Lan Nguyen <lan@example.com>")).toBe(false);
  });

  it("không nhầm tên người có chứa 'gpt' nằm trong từ khác", () => {
    expect(isAiCommit("fix: x\n\nCo-authored-by: Egpta <e@example.com>")).toBe(false);
  });
});

describe("aiPercent", () => {
  it("tính theo số dòng thêm vào", () => {
    const ai = "x\n\nCo-authored-by: Claude <a@b.c>";
    expect(aiPercent([{ message: ai, additions: 40 }, { message: "y", additions: 60 }])).toBe(40);
  });
  it("0 khi không có dòng nào", () => {
    expect(aiPercent([])).toBe(0);
    expect(aiPercent([{ message: "x", additions: 0 }])).toBe(0);
  });
  it("100 khi toàn bộ commit do AI", () => {
    expect(aiPercent([{ message: "Generated with Claude", additions: 5 }])).toBe(100);
  });
  it("bỏ qua số dòng âm", () => {
    expect(aiPercent([{ message: "x", additions: -3 }])).toBe(0);
  });
});

describe("declaredAi", () => {
  const d = (s: string) => `Phần nào do AI viết (nếu có):\n${s}\n`;
  it("khai không", () => {
    expect(declaredAi(d("Không"))).toBe(false);
    expect(declaredAi(d("không có"))).toBe(false);
  });
  it("khai có", () => {
    expect(declaredAi(d("Hàm limits do Claude viết"))).toBe(true);
  });
  it("để trống hoặc thiếu mục", () => {
    expect(declaredAi(d(""))).toBeNull();
    expect(declaredAi("Thay đổi này làm gì:\n- a")).toBeNull();
  });
});
