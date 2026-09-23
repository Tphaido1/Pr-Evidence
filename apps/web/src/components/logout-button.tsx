"use client";

import { useRouter } from "next/navigation";
import styles from "./logout-button.module.css";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button className={styles.btn} onClick={logout}>
      Đăng xuất
    </button>
  );
}
