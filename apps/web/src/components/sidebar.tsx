import Link from "next/link";
import { LogoutButton } from "./logout-button";
import styles from "./sidebar.module.css";

const items = [
  { href: "/", label: "Pull request", active: true },
  { href: "#", label: "Repository", active: false },
  { href: "#", label: "Cài đặt", active: false },
];

export function Sidebar() {
  return (
    <aside className={styles.side}>
      <div className={styles.name}>pr-evidence</div>
      <nav className={styles.nav}>
        {items.map((i) => (
          <Link key={i.label} href={i.href} className={i.active ? styles.itemActive : styles.item}>
            {i.label}
          </Link>
        ))}
      </nav>
      <div className={styles.spacer} />
      <LogoutButton />
    </aside>
  );
}
