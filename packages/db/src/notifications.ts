import { randomUUID } from "node:crypto";
import type { AppNotification } from "@pr-evidence/types";
import { notifications, type AppNotificationDoc } from "./client";

function fromDoc({ _id, ...rest }: AppNotificationDoc): AppNotification {
  return { id: _id, ...rest };
}

export async function listNotifications(limit = 20): Promise<AppNotification[]> {
  const col = await notifications();
  const docs = await col.find().sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map(fromDoc);
}

export async function unreadNotificationCount(): Promise<number> {
  const col = await notifications();
  return col.countDocuments({ read: false });
}

export async function createNotification(
  notif: Omit<AppNotification, "id" | "read" | "createdAt">,
): Promise<AppNotification> {
  const col = await notifications();
  const id = randomUUID();
  const full: AppNotification = {
    ...notif,
    id,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const { id: docId, ...rest } = full;
  await col.insertOne({ _id: docId, ...rest });
  return full;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const col = await notifications();
  const res = await col.updateOne({ _id: id }, { $set: { read: true } });
  return res.modifiedCount > 0;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const col = await notifications();
  const res = await col.updateMany({ read: false }, { $set: { read: true } });
  return res.modifiedCount;
}
