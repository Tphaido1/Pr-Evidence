import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pr-evidence/db", () => ({
  listNotifications: vi.fn(),
  unreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  unreadNotificationCount,
} from "@pr-evidence/db";
import { GET, POST } from "./route";

describe("Notifications API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/notifications", () => {
    it("trả về danh sách notifications và unreadCount", async () => {
      const mockNotifs = [
        {
          id: "notif-1",
          type: "new_pr" as const,
          repo: "owner/repo",
          prNumber: 1,
          title: "PR Title",
          author: "user",
          read: false,
          createdAt: "2026-09-23T00:00:00.000Z",
        },
      ];
      vi.mocked(listNotifications).mockResolvedValueOnce(mockNotifs);
      vi.mocked(unreadNotificationCount).mockResolvedValueOnce(1);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ notifications: mockNotifs, unreadCount: 1 });
      expect(listNotifications).toHaveBeenCalledWith(30);
      expect(unreadNotificationCount).toHaveBeenCalled();
    });
  });

  describe("POST /api/notifications", () => {
    it("đánh dấu một notification là đã đọc", async () => {
      vi.mocked(markNotificationAsRead).mockResolvedValueOnce(true);

      const req = new Request("http://localhost/api/notifications", {
        method: "POST",
        body: JSON.stringify({ id: "notif-1" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true });
      expect(markNotificationAsRead).toHaveBeenCalledWith("notif-1");
    });

    it("trả 404 khi không tìm thấy id cần đánh dấu", async () => {
      vi.mocked(markNotificationAsRead).mockResolvedValueOnce(false);

      const req = new Request("http://localhost/api/notifications", {
        method: "POST",
        body: JSON.stringify({ id: "notif-unknown" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("đánh dấu tất cả notifications là đã đọc khi markAll: true", async () => {
      vi.mocked(markAllNotificationsAsRead).mockResolvedValueOnce(5);

      const req = new Request("http://localhost/api/notifications", {
        method: "POST",
        body: JSON.stringify({ markAll: true }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true, markedCount: 5 });
      expect(markAllNotificationsAsRead).toHaveBeenCalled();
    });

    it("trả về 400 nếu không có id hoặc markAll", async () => {
      const req = new Request("http://localhost/api/notifications", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
