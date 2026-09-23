import { listPullRequests } from "@pr-evidence/db";
import { summarize } from "@pr-evidence/evidence";

export const dynamic = "force-dynamic";

export async function GET() {
  const list = await listPullRequests();
  return Response.json(list.map(summarize));
}
