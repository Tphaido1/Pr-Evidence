import Link from "next/link";
import type { PullRequestStatus } from "@pr-evidence/types";
import styles from "./pull-request-filters.module.css";

interface Props {
  active: PullRequestStatus | undefined;
  counts: { all: number; pending: number; approved: number; returned: number };
}

export function PullRequestFilters({ active, counts }: Props) {
  const tabs: { key: PullRequestStatus | undefined; label: string; n: number; href: string }[] = [
    { key: undefined, label: "Tất cả", n: counts.all, href: "/" },
    { key: "pending", label: "Chờ duyệt", n: counts.pending, href: "/?status=pending" },
    { key: "approved", label: "Đã duyệt", n: counts.approved, href: "/?status=approved" },
    { key: "returned", label: "Trả lại", n: counts.returned, href: "/?status=returned" },
  ];
  return (
    <div className={styles.row}>
      {tabs.map((t) => (
        <Link key={t.label} href={t.href} className={t.key === active ? styles.on : styles.off}>
          {t.label} · {t.n}
        </Link>
      ))}
    </div>
  );
}
