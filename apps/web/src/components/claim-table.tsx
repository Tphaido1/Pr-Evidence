import type { PullRequest } from "@pr-evidence/types";
import { evidenceLabel, reviewLabel } from "@/lib/labels";
import { ReviewButtons } from "./review-buttons";
import { StatusChip } from "./status-chip";
import styles from "./claim-table.module.css";

export function ClaimTable({ pr }: { pr: PullRequest }) {
  return (
    <div className={styles.table}>
      <div className={`${styles.row} ${styles.head}`}>
        <div className={styles.claim}>Claim</div>
        <div className={styles.code}>Code</div>
        <div className={styles.evidence}>Evidence</div>
        <div className={styles.ai}>AI</div>
        <div className={styles.review}>Duyệt</div>
      </div>
      {pr.claims.map((c) => {
        const ev = evidenceLabel[c.evidence.kind];
        const rv = reviewLabel[c.review];
        return (
          <div key={c.id} className={styles.row}>
            <div className={styles.claim}>{c.text}</div>
            <div className={styles.code}>
              <div className={styles.file}>
                {c.code.file} · dòng {c.code.lineStart}–{c.code.lineEnd}
              </div>
              <pre className={styles.snippet}>{c.code.snippet}</pre>
            </div>
            <div className={styles.evidence}>
              <StatusChip tone={ev.tone}>{ev.text}</StatusChip>
              <div className={styles.detail}>{c.evidence.detail}</div>
            </div>
            <div className={styles.ai}>
              <StatusChip tone={c.aiWritten ? "ai" : "plain"}>{c.aiWritten ? "Có" : "Không"}</StatusChip>
            </div>
            <div className={styles.review}>
              {c.review === "pending" ? (
                <ReviewButtons prId={pr.id} claimId={c.id} />
              ) : (
                <StatusChip tone={rv.tone}>{rv.text}</StatusChip>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
