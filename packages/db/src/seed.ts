import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PullRequest } from "@pr-evidence/types";
import { ensureIndexes, pullRequests, getDb } from "./client";

const dir = join(fileURLToPath(new URL(".", import.meta.url)), "../../../fixtures/pull-requests");

const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
const col = await pullRequests();
await ensureIndexes();

for (const f of files) {
  const pr = JSON.parse(await readFile(join(dir, f), "utf8")) as PullRequest;
  const { id, ...rest } = pr;
  await col.replaceOne({ _id: id }, rest, { upsert: true });
  console.log("đã nạp", id);
}
await (await getDb()).client.close();
