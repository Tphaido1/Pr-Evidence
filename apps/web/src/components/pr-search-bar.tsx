"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [selectedRepo, setSelectedRepo] = useState(initialRepo);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedRepo(initialRepo);
  }, [initialRepo]);

  // Phím tắt: gõ '/' hoặc 'Ctrl+K' / 'Cmd+K' để focus ô tìm kiếm
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Debounced search khi gõ phím
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

  function handleClearQuery() {
    setQuery("");
    updateParams("", selectedRepo);
    inputRef.current?.focus();
  }

  function handleClearRepo() {
    setSelectedRepo("");
    updateParams(query, "");
  }

  function handleResetAll() {
    setQuery("");
    setSelectedRepo("");
    updateParams("", "");
  }

  const hasActiveFilters = Boolean(query.trim() || selectedRepo);

  return (
    <div className={styles.container}>
      {/* Khung tìm kiếm chính (Toolbar Frame) */}
      <div className={`${styles.toolbarFrame} ${isFocused ? styles.toolbarFocused : ""}`}>
        {/* Ô tìm kiếm */}
        <div className={styles.searchSection}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>

          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Tìm theo tiêu đề, tác giả, #số PR, nội dung claim..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          {query ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClearQuery}
              title="Xóa từ khóa tìm kiếm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <div className={styles.shortcutBadge} title="Nhấn Ctrl+K hoặc / để tìm kiếm">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          )}
        </div>

        {/* Vạch ngăn cách tinh tế */}
        {repos.length > 0 && <div className={styles.divider} />}

        {/* Dropdown chọn Repository */}
        {repos.length > 0 && (
          <div className={styles.repoSection}>
            <span className={styles.repoIcon} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <select
              className={styles.select}
              value={selectedRepo}
              onChange={handleRepoChange}
              title="Lọc theo Repository"
            >
              <option value="">Tất cả repo ({repos.length})</option>
              {repos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span className={styles.selectArrow} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* Thanh tag hiển thị các bộ lọc đang kích hoạt (Active Filter Chips) */}
      {hasActiveFilters && (
        <div className={styles.activeBar}>
          <span className={styles.activeLabel}>Đang lọc:</span>

          {query.trim() && (
            <span className={styles.chip}>
              <span className={styles.chipKey}>Từ khóa:</span>
              <strong className={styles.chipVal}>"{query.trim()}"</strong>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={handleClearQuery}
                title="Bỏ lọc từ khóa"
              >
                ✕
              </button>
            </span>
          )}

          {selectedRepo && (
            <span className={styles.chip}>
              <span className={styles.chipKey}>Repo:</span>
              <strong className={styles.chipVal}>{selectedRepo}</strong>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={handleClearRepo}
                title="Bỏ lọc repository"
              >
                ✕
              </button>
            </span>
          )}

          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleResetAll}
            title="Đặt lại toàn bộ bộ lọc"
          >
            Đặt lại tất cả
          </button>
        </div>
      )}
    </div>
  );
}
