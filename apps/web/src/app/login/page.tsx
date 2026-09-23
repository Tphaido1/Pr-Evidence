"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Sai mật khẩu.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={submit}>
        <h1 className={styles.title}>pr-evidence</h1>
        <p className={styles.sub}>Nhập mật khẩu reviewer để tiếp tục.</p>
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          autoFocus
        />
        {error && <div className={styles.error}>{error}</div>}
        <button className={styles.button} disabled={pending || !password}>
          {pending ? "Đang vào..." : "Vào"}
        </button>
      </form>
    </div>
  );
}
