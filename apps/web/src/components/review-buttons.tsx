"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./review-buttons.module.css";

export function ReviewButtons({ prId, claimId }: { prId: string; claimId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function send(review: "approved" | "returned") {
    setError(null);
    const [repoPath, number] = prId.split("#");
    const res = await fetch(`/api/pull-requests/${repoPath}/${number}/claims/${claimId}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ review }),
    });
    if (!res.ok) {
      setError("Không lưu được. Thử lại sau.");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className={styles.row}>
        <button className={styles.primary} disabled={pending} onClick={() => send("approved")}>
          Duyệt
        </button>
        <button className={styles.secondary} disabled={pending} onClick={() => send("returned")}>
          Trả lại
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
