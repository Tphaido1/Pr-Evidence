"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import styles from "./pr-search-bar.module.css";

interface Props {
  initialQuery?: string;
  initialRepo?: string;
  repos: string[];
}

export function PrSearchBar({ initialQuery = "", initialRepo = "", repos }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [selectedRepo, setSelectedRepo] = useState(initialRepo);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedRepo(initialRepo);
  }, [initialRepo]);

  function updateParams(newQuery: string, newRepo: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (newQuery.trim()) {
      params.set("q", newQuery.trim());
    } else {
      params.delete("q");
    }

    if (newRepo) {
      params.set("repo", newRepo);
    } else {
      params.delete("repo");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // Debounced search when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== initialQuery) {
        updateParams(query, selectedRepo);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleRepoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const r = e.target.value;
    setSelectedRepo(r);
    updateParams(query, r);
  }

  function handleClear() {
    setQuery("");
    updateParams("", selectedRepo);
  }

  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <span className={styles.icon}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className={styles.input}
          placeholder="Tìm theo tiêu đề, tác giả, #số PR, nội dung claim..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button type="button" className={styles.clearBtn} onClick={handleClear} title="Xóa tìm kiếm">
            ✕
          </button>
        )}
      </div>

      {repos.length > 0 && (
        <select className={styles.select} value={selectedRepo} onChange={handleRepoChange}>
          <option value="">Tất cả repositories ({repos.length})</option>
          {repos.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
