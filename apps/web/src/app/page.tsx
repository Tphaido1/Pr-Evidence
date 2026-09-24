import { listRepositories, searchPullRequests } from "@pr-evidence/db";
import { summarize } from "@pr-evidence/evidence";
import type { PullRequestStatus } from "@pr-evidence/types";
import { ExportButton } from "@/components/export-button";
import { PrSearchBar } from "@/components/pr-search-bar";
import { PullRequestFilters } from "@/components/pull-request-filters";
import { PullRequestTable } from "@/components/pull-request-table";

export const dynamic = "force-dynamic";

const validStatus = new Set<string>(["pending", "approved", "returned"]);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; repo?: string }>;
}) {
  const { status, q, repo } = await searchParams;
  const filter = status && validStatus.has(status) ? (status as PullRequestStatus) : undefined;

  const [matchingDocs, repoDocs] = await Promise.all([
    searchPullRequests({ query: q, repo, summaryOnly: true }),
    listRepositories(),
  ]);

  const all = matchingDocs.map(summarize);
  const repos = repoDocs.map((r) => r.id);

  const counts = {
    all: all.length,
    pending: all.filter((p) => p.status === "pending").length,
    approved: all.filter((p) => p.status === "approved").length,
    returned: all.filter((p) => p.status === "returned").length,
  };
  const items = filter ? all.filter((p) => p.status === filter) : all;

  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Pull request cần duyệt</h1>
          <p style={{ margin: "6px 0 0", color: "var(--mute)" }}>
            Mỗi PR có một bảng claim, code và evidence. Mở PR để duyệt hoặc trả lại từng dòng.
          </p>
        </div>
        <ExportButton />
      </header>

      <PrSearchBar initialQuery={q} initialRepo={repo} repos={repos} />

      <PullRequestFilters active={filter} counts={counts} query={q} repo={repo} />

      <PullRequestTable items={items} />
    </>
  );
}

