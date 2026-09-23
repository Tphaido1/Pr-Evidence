"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PullRequest } from "@pr-evidence/types";
import styles from "./analysis-banner.module.css";

/** Hiện khi PR chưa có bảng claim-code-evidence từ lần phân tích gần nhất. */
export function AnalysisBanner({ pr }: { pr: PullRequest }) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAnalyze() {
    setAnalyzing(true);
    setErrorMsg(null);

    try {
      const [owner, name] = pr.repo.split("/");
      const res = await fetch(`/api/pull-requests/${owner}/${name}/${pr.number}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể phân tích PR này");
      } else {
        router.refresh();
      }
    } catch {
      setErrorMsg("Lỗi kết nối khi gửi yêu cầu phân tích.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (pr.analysisStatus === "queued") {
    return (
      <div className={styles.info}>
        <div>
          <div>Đang chờ CI phân tích PR này. Bảng claim-code-evidence sẽ hiện sau khi chạy xong.</div>
          {errorMsg && <div style={{ color: "var(--color-bad)", fontSize: "12px", marginTop: "6px" }}>{errorMsg}</div>}
        </div>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? "Đang phân tích..." : "⚡ Phân tích ngay"}
        </button>
      </div>
    );
  }

  if (pr.analysisStatus === "analyzing") {
    return (
      <div className={styles.info}>
        <div>Đang chạy phân tích để dựng bảng claim-code-evidence. Có thể mất vài giây...</div>
      </div>
    );
  }

  if (pr.analysisStatus === "failed") {
    return (
      <div className={styles.error}>
        <div className={styles.errorHeader}>
          <div>Lần phân tích gần nhất bị lỗi, chưa có bảng claim-code-evidence.</div>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? "Đang phân tích lại..." : "🔄 Thử phân tích lại"}
          </button>
        </div>
        {(errorMsg || pr.analysisError) && (
          <pre className={styles.errorDetail}>{errorMsg || pr.analysisError}</pre>
        )}
      </div>
    );
  }

  return null;
}
