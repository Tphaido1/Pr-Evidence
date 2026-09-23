import Link from "next/link";
import { notFound } from "next/navigation";
import { getPullRequest } from "@pr-evidence/db";
import { countEvidence, statusOf } from "@pr-evidence/evidence";
import { AnalysisBanner } from "@/components/analysis-banner";
import { ClaimTable } from "@/components/claim-table";
import { StatusChip } from "@/components/status-chip";
import { analysisLabel, reviewLabel } from "@/lib/labels";
import { prIdFromParams } from "@/lib/paths";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Params = { owner: string; repo: string; number: string };

export default async function PullRequestPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const pr = await getPullRequest(prIdFromParams(p));
  if (!pr) notFound();

  const { total, withEvidence } = countEvidence(pr.claims);
  const status = pr.analysisStatus === "done" ? reviewLabel[statusOf(pr.claims)] : analysisLabel[pr.analysisStatus];
  const stats = [
    { label: "Claim", value: String(total), bad: false },
    { label: "Có evidence", value: String(withEvidence), bad: false },
    { label: "Thiếu evidence", value: String(total - withEvidence), bad: total - withEvidence > 0 },
    { label: "Phần do AI", value: `${pr.aiPercent}%`, bad: false },
  ];

  return (
    <>
      <Link href="/" className={styles.back}>← Pull request</Link>
      <header className={styles.head}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{pr.title}</h1>
          <StatusChip tone={status.tone}>{status.text}</StatusChip>
        </div>
        <p className={styles.meta}>
          #{pr.number} · {pr.repo} · {pr.author} muốn merge {pr.headBranch} vào {pr.baseBranch}
        </p>
      </header>
      <section className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={s.bad ? styles.statBad : styles.statValue}>{s.value}</div>
          </div>
        ))}
      </section>
      {pr.analysisStatus === "done" ? <ClaimTable pr={pr} /> : <AnalysisBanner pr={pr} />}
    </>
  );
}
