import type { Repository } from "@pr-evidence/types";
import { repositories, type RepositoryDoc } from "./client";

function fromDoc({ _id, ...rest }: RepositoryDoc): Repository {
  return { id: _id, ...rest };
}

// Cache bộ nhớ trong 30 giây để tránh gọi DB liên tục mỗi lần người dùng chuyển trang/lọc
let cachedRepos: { data: Repository[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export function invalidateRepositoriesCache(): void {
  cachedRepos = null;
}

export async function listRepositories(): Promise<Repository[]> {
  const now = Date.now();
  if (cachedRepos && now < cachedRepos.expiresAt) {
    return cachedRepos.data;
  }

  const col = await repositories();
  const docs = await col.find().sort({ lastSyncedAt: -1 }).toArray();
  const data = docs.map(fromDoc);

  cachedRepos = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

export async function getRepository(id: string): Promise<Repository | null> {
  const col = await repositories();
  const doc = await col.findOne({ _id: id });
  return doc ? fromDoc(doc) : null;
}

export async function upsertRepository(repo: Repository): Promise<void> {
  invalidateRepositoriesCache();
  const col = await repositories();
  const { id, ...rest } = repo;
  await col.replaceOne({ _id: id }, rest, { upsert: true });
}

export async function deleteRepository(id: string): Promise<boolean> {
  invalidateRepositoriesCache();
  const col = await repositories();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

