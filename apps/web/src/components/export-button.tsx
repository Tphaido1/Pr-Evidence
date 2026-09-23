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
        className={styles.mainBtn}
        onClick={() => setOpen((v) => !v)}
        title="Xuất dữ liệu Excel/CSV"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Xuất Excel/CSV
        <span style={{ fontSize: 10 }}>▼</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <a
            href={summaryHref}
            download
            className={styles.item}
            onClick={() => setOpen(false)}
          >
            <div className={styles.itemTitle}>
              📊 Xuất danh sách PR
            </div>
            <div className={styles.itemDesc}>
              Bao gồm thông tin tổng quan, số claim, evidence và trạng thái duyệt
            </div>
          </a>

          <a
            href={claimsHref}
            download
            className={styles.item}
            onClick={() => setOpen(false)}
          >
            <div className={styles.itemTitle}>
              📑 Xuất chi tiết Claim & Evidence
            </div>
            <div className={styles.itemDesc}>
              Bao gồm từng dòng claim, đoạn mã code, kết quả test và lint
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
