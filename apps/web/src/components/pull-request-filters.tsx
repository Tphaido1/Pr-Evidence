import Link from "next/link";
import type { PullRequestStatus } from "@pr-evidence/types";
import styles from "./pull-request-filters.module.css";

interface Props {
  active: PullRequestStatus | undefined;
  counts: { all: number; pending: number; approved: number; returned: number };
  query?: string;
  repo?: string;
}

export function PullRequestFilters({ active, counts, query, repo }: Props) {
  function makeHref(statusKey?: PullRequestStatus) {
    const params = new URLSearchParams();
    if (statusKey) params.set("status", statusKey);
    if (query) params.set("q", query);
    if (repo) params.set("repo", repo);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  const tabs: { key: PullRequestStatus | undefined; label: string; n: number; href: string }[] = [
    { key: undefined, label: "Tất cả", n: counts.all, href: makeHref(undefined) },
    { key: "pending", label: "Chờ duyệt", n: counts.pending, href: makeHref("pending") },
    { key: "approved", label: "Đã duyệt", n: counts.approved, href: makeHref("approved") },
    { key: "returned", label: "Trả lại", n: counts.returned, href: makeHref("returned") },
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
