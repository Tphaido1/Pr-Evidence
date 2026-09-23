import Link from "next/link";
import type { PullRequestSummary } from "@pr-evidence/types";
import { analysisLabel, reviewLabel } from "@/lib/labels";
import { prPath } from "@/lib/paths";
import { StatusChip } from "./status-chip";
import styles from "./pull-request-table.module.css";

export function PullRequestTable({ items }: { items: PullRequestSummary[] }) {
  return (
    <div className={styles.table}>
      <div className={`${styles.row} ${styles.head}`}>
        <div className={styles.title}>Pull request</div>
        <div className={styles.repo}>Repository</div>
        <div className={styles.author}>Tác giả</div>
        <div className={styles.evidence}>Evidence</div>
        <div className={styles.ai}>Phần do AI</div>
        <div className={styles.status}>Trạng thái</div>
      </div>
      {items.length === 0 && <div className={styles.empty}>Chưa có PR nào ở mục này.</div>}
      {items.map((p) => {
        // Chưa phân tích xong thì hiện trạng thái phân tích thay vì Chờ duyệt/Đã duyệt —
        // "Chờ duyệt" với 0 claim dễ hiểu nhầm là PR không có gì cần xem.
        const s = p.analysisStatus === "done" ? reviewLabel[p.status] : analysisLabel[p.analysisStatus];
        return (
          <Link key={p.id} href={prPath(p.repo, p.number)} className={`${styles.row} ${styles.body}`}>
            <div className={`${styles.title} ${styles.strong}`}>{p.title}</div>
            <div className={`${styles.repo} ${styles.muted}`}>{p.repo}</div>
            <div className={`${styles.author} ${styles.muted}`}>{p.author}</div>
            <div className={`${styles.evidence} ${styles.muted}`}>
              {p.analysisStatus === "done" ? `${p.claimsWithEvidence}/${p.claimCount} có evidence` : "—"}
            </div>
            <div className={styles.ai}>
              <StatusChip tone={p.aiPercent === 0 ? "plain" : "ai"}>{p.aiPercent}%</StatusChip>
            </div>
            <div className={styles.status}>
              <StatusChip tone={s.tone}>{s.text}</StatusChip>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
