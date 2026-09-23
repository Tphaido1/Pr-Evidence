import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

describe("session token", () => {
  it("token vừa tạo thì hợp lệ", async () => {
    const t = await createSessionToken("s3cret");
    expect(await verifySessionToken("s3cret", t)).toBe(true);
  });
  it("token hết hạn thì không hợp lệ", async () => {
    const t = await createSessionToken("s3cret", -10);
    expect(await verifySessionToken("s3cret", t)).toBe(false);
  });
  it("sai secret thì không hợp lệ", async () => {
    const t = await createSessionToken("s3cret");
    expect(await verifySessionToken("khac", t)).toBe(false);
  });
  it("token bị sửa thì không hợp lệ", async () => {
    const t = await createSessionToken("s3cret");
    const [exp] = t.split(".");
    expect(await verifySessionToken("s3cret", `${exp}.${"a".repeat(64)}`)).toBe(false);
  });
  it("thiếu token hoặc sai định dạng thì không hợp lệ", async () => {
    expect(await verifySessionToken("s3cret", undefined)).toBe(false);
    expect(await verifySessionToken("s3cret", "khong-co-dau-cham")).toBe(false);
  });
});
