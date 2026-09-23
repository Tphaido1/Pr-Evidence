"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";
import { NotificationBell } from "./notification-bell";
import styles from "./sidebar.module.css";

export function Sidebar() {
  const pathname = usePathname();

  const isPrActive = pathname === "/" || (pathname ? pathname.startsWith("/pull-requests") : false);
  const isRepoActive = pathname ? pathname.startsWith("/repositories") : false;

  return (
    <aside className={styles.side}>
      <div className={styles.name}>pr-evidence</div>
      <nav className={styles.nav}>
        <Link href="/" className={isPrActive ? styles.itemActive : styles.item}>
          Pull request
        </Link>
        <Link href="/repositories" className={isRepoActive ? styles.itemActive : styles.item}>
          Repository
        </Link>
        <Link href="#" className={styles.item} style={{ opacity: 0.6, cursor: "not-allowed" }} title="Sắp ra mắt">
          Cài đặt
        </Link>
      </nav>
      <div className={styles.spacer} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <NotificationBell />
        <LogoutButton />
      </div>
    </aside>
  );
}

