import type { Repository } from "@pr-evidence/types";
import { repositories, type RepositoryDoc } from "./client";

function fromDoc({ _id, ...rest }: RepositoryDoc): Repository {
  return { id: _id, ...rest };
}

export async function listRepositories(): Promise<Repository[]> {
  const col = await repositories();
  const docs = await col.find().sort({ lastSyncedAt: -1 }).toArray();
  return docs.map(fromDoc);
}

export async function getRepository(id: string): Promise<Repository | null> {
  const col = await repositories();
  const doc = await col.findOne({ _id: id });
  return doc ? fromDoc(doc) : null;
}

export async function upsertRepository(repo: Repository): Promise<void> {
  const col = await repositories();
  const { id, ...rest } = repo;
  await col.replaceOne({ _id: id }, rest, { upsert: true });
}

export async function deleteRepository(id: string): Promise<boolean> {
  const col = await repositories();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}
