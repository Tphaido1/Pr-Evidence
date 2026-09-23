import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  unreadNotificationCount,
} from "@pr-evidence/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(30),
    unreadNotificationCount(),
  ]);
  return Response.json({ notifications, unreadCount });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: string; markAll?: boolean } | null;

  if (body?.markAll) {
    const count = await markAllNotificationsAsRead();
    return Response.json({ ok: true, markedCount: count });
  }

  if (body?.id) {
    const success = await markNotificationAsRead(body.id);
    if (!success) {
      return Response.json({ error: "Không tìm thấy thông báo" }, { status: 404 });
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Yêu cầu id hoặc markAll: true" }, { status: 400 });
}
