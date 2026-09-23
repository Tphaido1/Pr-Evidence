import type { PullRequest } from "@pr-evidence/types";
import styles from "./analysis-banner.module.css";

/** Hiện khi PR chưa có bảng claim-code-evidence từ lần phân tích gần nhất. */
export function AnalysisBanner({ pr }: { pr: PullRequest }) {
  if (pr.analysisStatus === "queued") {
    return <div className={styles.info}>Đang chờ CI phân tích PR này. Bảng claim-code-evidence sẽ hiện sau khi chạy xong.</div>;
  }
  if (pr.analysisStatus === "analyzing") {
    return <div className={styles.info}>Đang chạy test và lint để dựng bảng claim-code-evidence. Có thể mất vài phút.</div>;
  }
  if (pr.analysisStatus === "failed") {
    return (
      <div className={styles.error}>
        <div>Lần phân tích gần nhất bị lỗi, chưa có bảng claim-code-evidence.</div>
        {pr.analysisError && <pre className={styles.errorDetail}>{pr.analysisError}</pre>}
      </div>
    );
  }
  return null;
}
