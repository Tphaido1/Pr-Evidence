"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Repository } from "@pr-evidence/types";
import styles from "./repositories.module.css";

function timeAgo(dateString?: string): string {
  if (!dateString) return "Chưa đồng bộ";
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [repoInput, setRepoInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadRepos() {
    try {
      const res = await fetch("/api/repositories");
      if (res.ok) {
        setRepos(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRepos();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setError(null);
    setSuccess(null);
    setAdding(true);

    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repo: repoInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể thêm repository");
      } else {
        setSuccess(`Đã thêm và đồng bộ ${data.syncedPulls} PRs (${data.newPrCount} PR mới) từ ${data.repo.id}`);
        setRepoInput("");
        await loadRepos();
      }
    } catch {
      setError("Lỗi kết nối khi gửi yêu cầu.");
    } finally {
      setAdding(false);
    }
  }

  async function handleSync(repoFullName: string) {
    setSyncingId(repoFullName);
    setError(null);
    setSuccess(null);

    try {
      const [owner, name] = repoFullName.split("/");
      const res = await fetch(`/api/repositories/${owner}/${name}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể đồng bộ repository");
      } else {
        setSuccess(`Đã đồng bộ ${data.syncedCount} PRs (${data.newPrCount} PR mới) từ ${repoFullName}`);
        await loadRepos();
      }
    } catch {
      setError("Lỗi khi đồng bộ từ GitHub");
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Repositories</h1>
          <p className={styles.sub}>
            Kết nối trực tiếp với GitHub REST API để đồng bộ danh sách Pull Requests và nhận thông báo khi có PR mới.
          </p>
        </div>
      </header>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Thêm Repository từ GitHub</h3>
        <form className={styles.form} onSubmit={handleAdd}>
          <input
            className={styles.input}
            type="text"
            placeholder="owner/repo hoặc dán link GitHub (VD: https://github.com/Tphaido1/Web-E-commerce)"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            disabled={adding}
          />
          <button type="submit" className={styles.btnPrimary} disabled={adding || !repoInput.trim()}>
            {adding ? "Đang đồng bộ..." : "Thêm & Đồng bộ từ GitHub"}
          </button>
        </form>
        <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: "4px 0 0 0" }}>
          Hỗ trợ định dạng <code>owner/repo</code> hoặc đường dẫn URL đầy đủ (ví dụ: <code>https://github.com/owner/repo</code>). Với repo private, hãy cấu hình <code>GITHUB_TOKEN</code> trong <code>.env</code>.
        </p>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div>Repository</div>
          <div>Nhánh chính</div>
          <div>Open PRs</div>
          <div>Lần đồng bộ cuối</div>
          <div>Hành động</div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Đang tải danh sách repositories...</div>
        ) : repos.length === 0 ? (
          <div className={styles.emptyState}>
            Chưa có repository nào được theo dõi. Hãy nhập <strong>Tphaido1/Pr-Evidence</strong> ở trên để bắt đầu!
          </div>
        ) : (
          repos.map((r) => {
            const isSyncing = syncingId === r.id;
            return (
              <div key={r.id} className={styles.row}>
                <div>
                  <a href={r.url} target="_blank" rel="noreferrer" className={styles.repoName}>
                    {r.id}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                  {r.description && <div className={styles.repoDesc}>{r.description}</div>}
                </div>
                <div>
                  <code>{r.defaultBranch || "main"}</code>
                </div>
                <div>
                  <strong>{r.openPrCount}</strong> PRs
                </div>
                <div style={{ color: "var(--mute)", fontSize: 13 }}>{timeAgo(r.lastSyncedAt)}</div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => handleSync(r.id)}
                    disabled={isSyncing}
                  >
                    <svg
                      className={isSyncing ? styles.spin : ""}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
                    </svg>
                    {isSyncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
                  </button>
                  <Link href="/" className={styles.btnSecondary}>
                    Xem PRs
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
