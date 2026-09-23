import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pr-evidence/db", () => ({ setClaimReview: vi.fn() }));
import { setClaimReview } from "@pr-evidence/db";
import { POST } from "./route";

const params = Promise.resolve({ owner: "acme", repo: "pr-evidence", number: "42", claimId: "c1" });

function req(body: unknown) {
  return new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST .../claims/[claimId]/review", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 khi review không hợp lệ", async () => {
    const res = await POST(req({ review: "xyz" }), { params });
    expect(res.status).toBe(400);
    expect(setClaimReview).not.toHaveBeenCalled();
  });

  it("400 khi thiếu body", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST" }), { params });
    expect(res.status).toBe(400);
  });

  it("404 khi không tìm thấy PR hoặc claim", async () => {
    vi.mocked(setClaimReview).mockResolvedValueOnce(null);
    const res = await POST(req({ review: "approved" }), { params });
    expect(res.status).toBe(404);
  });

  it("200 và gọi setClaimReview với id ghép đúng từ params", async () => {
    const pr = { id: "acme/pr-evidence#42" } as never;
    vi.mocked(setClaimReview).mockResolvedValueOnce(pr);
    const res = await POST(req({ review: "returned" }), { params });
    expect(res.status).toBe(200);
    expect(setClaimReview).toHaveBeenCalledWith("acme/pr-evidence#42", "c1", "returned");
    expect(await res.json()).toEqual(pr);
  });
});
