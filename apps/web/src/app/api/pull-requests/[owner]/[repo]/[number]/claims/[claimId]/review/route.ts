import { setClaimReview } from "@pr-evidence/db";
import type { ReviewStatus } from "@pr-evidence/types";
import { prIdFromParams } from "@/lib/paths";

type Params = { owner: string; repo: string; number: string; claimId: string };

const allowed = new Set<ReviewStatus>(["approved", "returned"]);

export async function POST(req: Request, { params }: { params: Promise<Params> }) {
  const p = await params;
  const body = (await req.json().catch(() => null)) as { review?: ReviewStatus } | null;
  if (!body?.review || !allowed.has(body.review)) {
    return Response.json({ error: "review phải là approved hoặc returned" }, { status: 400 });
  }
  const pr = await setClaimReview(prIdFromParams(p), p.claimId, body.review);
  if (!pr) return Response.json({ error: "Không tìm thấy PR hoặc claim" }, { status: 404 });
  return Response.json(pr);
}
