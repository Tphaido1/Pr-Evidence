import dns from "node:dns";
import { MongoClient, type Collection, type Db } from "mongodb";
import type { AppNotification, PullRequest, Repository } from "@pr-evidence/types";

// Hỗ trợ phân giải SRV của MongoDB Atlas trên Windows khi DNS cục bộ chặn UDP SRV
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Bỏ qua nếu môi trường không cho phép setServers
}

/** Document lưu trong MongoDB: dùng chuỗi "owner/repo#number" làm _id. */
export type PullRequestDoc = Omit<PullRequest, "id"> & { _id: string };

/** Document lưu trong MongoDB: dùng chuỗi "owner/repo" làm _id. */
export type RepositoryDoc = Omit<Repository, "id"> & { _id: string };

/** Document lưu thông báo: dùng chuỗi uuid/timestamp làm _id. */
export type AppNotificationDoc = Omit<AppNotification, "id"> & { _id: string };

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

export async function repositories(): Promise<Collection<RepositoryDoc>> {
  return (await getDb()).collection<RepositoryDoc>("repositories");
}

export async function notifications(): Promise<Collection<AppNotificationDoc>> {
  return (await getDb()).collection<AppNotificationDoc>("notifications");
}

/** MongoDB không cần migration schema. Tạo index một lần. */
export async function ensureIndexes(): Promise<void> {
  const prCol = await pullRequests();
  await prCol.createIndex({ repo: 1, number: -1 });
  await prCol.createIndex({ updatedAt: -1 });

  const repoCol = await repositories();
  await repoCol.createIndex({ lastSyncedAt: -1 });

  const notifCol = await notifications();
  await notifCol.createIndex({ read: 1, createdAt: -1 });
}
