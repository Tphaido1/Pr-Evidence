"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppNotification } from "@pr-evidence/types";
import styles from "./notification-bell.module.css";

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = (await res.json()) as { notifications: AppNotification[]; unreadCount: number };
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // bỏ qua lỗi mạng tạm thời trong lúc polling
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15_000); // Polling mỗi 15 giây
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleNotificationClick(notif: AppNotification) {
    if (!notif.read) {
      fetch("/api/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }
    setOpen(false);
    router.push(`/pull-requests/${notif.repo}/${notif.prNumber}`);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={() => setOpen(!open)}
        title="Thông báo PR mới"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span>Thông báo</span>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h4 className={styles.title}>Thông báo PR mới</h4>
            {unreadCount > 0 && (
              <button type="button" className={styles.markAllBtn} onClick={markAllRead}>
                Đã đọc tất cả
              </button>
            )}
          </div>
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>Chưa có thông báo nào</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${!n.read ? styles.unread : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={styles.itemTop}>
                    <span className={styles.itemRepo}>
                      {!n.read && <span className={styles.unreadDot} />}
                      {n.repo} #{n.prNumber}
                    </span>
                    <span className={styles.itemTime}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <div className={styles.itemTitle}>{n.title}</div>
                  <div className={styles.itemAuthor}>bởi {n.author}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
