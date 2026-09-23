import { MongoClient, type Collection, type Db } from "mongodb";
import type { PullRequest } from "@pr-evidence/types";

/** Document lưu trong MongoDB: dùng chuỗi "owner/repo#number" làm _id. */
export type PullRequestDoc = Omit<PullRequest, "id"> & { _id: string };

// Giữ một client duy nhất khi Next.js hot-reload ở chế độ dev.
const globalForMongo = globalThis as unknown as { _mongo?: Promise<MongoClient> };

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Thiếu biến môi trường MONGODB_URI");
  return new MongoClient(uri).connect();
}

export async function getDb(): Promise<Db> {
  globalForMongo._mongo ??= connect();
  const client = await globalForMongo._mongo;
  return client.db(process.env.MONGODB_DB ?? "pr_evidence");
}

export async function pullRequests(): Promise<Collection<PullRequestDoc>> {
  return (await getDb()).collection<PullRequestDoc>("pull_requests");
}

/** MongoDB không cần migration schema. Chỉ cần tạo index một lần, chạy trong seed. */
export async function ensureIndexes(): Promise<void> {
  const col = await pullRequests();
  await col.createIndex({ repo: 1, number: -1 });
  await col.createIndex({ updatedAt: -1 });
}
