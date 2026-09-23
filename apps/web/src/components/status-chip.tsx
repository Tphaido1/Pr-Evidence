import type { ReactNode } from "react";
import styles from "./status-chip.module.css";

export type Tone = "ok" | "warn" | "bad" | "ai" | "plain";

export function StatusChip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`${styles.chip} ${styles[tone]}`}>{children}</span>;
}
