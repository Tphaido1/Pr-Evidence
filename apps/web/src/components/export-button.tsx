"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./export-button.module.css";

export function ExportButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const qs = searchParams?.toString() ? `&${searchParams.toString()}` : "";
  const summaryHref = `/api/export?type=summary${qs}`;
  const claimsHref = `/api/export?type=claims${qs}`;

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={`${styles.mainBtn} ${open ? styles.mainBtnActive : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Tải dữ liệu ra file Excel / CSV chuẩn tiếng Việt"
      >
        <span className={styles.btnIcon}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </span>
        <span className={styles.btnText}>Xuất Excel / CSV</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <span className={styles.headerLabel}>ĐỊNH DẠNG DỮ LIỆU EXCEL / CSV</span>
          </div>

          <a
            href={summaryHref}
            download
            className={styles.item}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <div className={`${styles.itemIconWrap} ${styles.iconSummary}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <div className={styles.itemContent}>
              <div className={styles.itemTitleRow}>
                <span className={styles.itemTitle}>Danh sách tổng quan PR</span>
                <span className={styles.itemBadgeGreen}>.CSV (Excel)</span>
              </div>
              <div className={styles.itemDesc}>
                Bao gồm mã PR, tác giả, tiêu đề, số claim, evidence & tỷ lệ AI
              </div>
            </div>
            <span className={styles.itemArrow}>→</span>
          </a>

          <a
            href={claimsHref}
            download
            className={styles.item}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <div className={`${styles.itemIconWrap} ${styles.iconClaims}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className={styles.itemContent}>
              <div className={styles.itemTitleRow}>
                <span className={styles.itemTitle}>Chi tiết Claim & Evidence</span>
                <span className={styles.itemBadgeBlue}>Đầy đủ</span>
              </div>
              <div className={styles.itemDesc}>
                Từng dòng claim, file code, dòng, snippet và kết quả test/lint
              </div>
            </div>
            <span className={styles.itemArrow}>→</span>
          </a>

          <div className={styles.dropdownFooter}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Tự động đính kèm UTF-8 BOM, mở không lỗi font tiếng Việt</span>
          </div>
        </div>
      )}
    </div>
  );
}

