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

// Giữ một client duy nhất khi Next.js hot-reload ở chế độ dev hoặc serverless.
const globalForMongo = globalThis as unknown as {
  _mongo?: Promise<MongoClient>;
  _indexesCreated?: Promise<void>;
};

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Thiếu biến môi trường MONGODB_URI");

  const client = new MongoClient(uri, {
    minPoolSize: 5, // Duy trì sẵn 5 kết nối nóng (hot sockets), tránh độ trễ handshake TLS ~200-400ms mỗi request
    maxPoolSize: 25, // Tối đa 25 kết nối đồng thời cho throughput cao
    maxIdleTimeMS: 60_000,
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });

  return client.connect();
}

export async function getDb(): Promise<Db> {
  globalForMongo._mongo ??= connect();
  const client = await globalForMongo._mongo;
  const db = client.db(process.env.MONGODB_DB ?? "pr_evidence");

  // Tự động khởi tạo index một lần duy nhất dưới background
  if (!globalForMongo._indexesCreated) {
    globalForMongo._indexesCreated = ensureIndexes(db).catch(() => {});
  }

  return db;
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

/** Tạo compound index tối ưu hóa tốc độ truy vấn tìm kiếm và sắp xếp. */
export async function ensureIndexes(dbInstance?: Db): Promise<void> {
  const db = dbInstance ?? (await getDb());
  const prCol = db.collection<PullRequestDoc>("pull_requests");
  const repoCol = db.collection<RepositoryDoc>("repositories");
  const notifCol = db.collection<AppNotificationDoc>("notifications");

  await Promise.all([
    prCol.createIndex({ updatedAt: -1 }),
    prCol.createIndex({ repo: 1, updatedAt: -1 }),
    prCol.createIndex({ repo: 1, number: -1 }),
    prCol.createIndex({ "claims.id": 1 }),
    repoCol.createIndex({ lastSyncedAt: -1 }),
    notifCol.createIndex({ read: 1, createdAt: -1 }),
  ]);
}

