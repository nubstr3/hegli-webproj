"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ACCENT, BG_STATUSBAR, BORDER_SUBTLE, FONT_MONO, TEXT_DIM, TEXT_FAINT } from "@/app/components/theme";

// Flip `built` to true as each admin page gets created.
const NAV_ITEMS = [
  { href: "/admin", label: "1 overview", built: true },
  { href: "/admin/projects", label: "2 projects", built: false },
  { href: "/admin/notes", label: "3 notes", built: true },
  { href: "/admin/about", label: "4 about", built: true },
  { href: "/admin/files", label: "5 files", built: true },
  { href: "/admin/settings", label: "6 settings", built: true },
];

/**
 * Admin version of the site's status-bar nav. Pages that don't exist yet are
 * dimmed (and not links) so they never lead to a 404.
 */
export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      style={{
        minHeight: 34,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "4px 16px",
        padding: "0 16px",
        background: BG_STATUSBAR,
        borderBottom: `1px solid ${BORDER_SUBTLE}`,
        fontFamily: FONT_MONO,
        fontSize: 13,
        position: "relative",
        zIndex: 10,
      }}
    >
      <Link href="/" style={{ color: TEXT_DIM, textDecoration: "none", fontWeight: 600 }}>
        ~/hegli.dev <span style={{ color: ACCENT, fontWeight: 400 }}>/admin</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
          const style = { padding: "7px 12px", textDecoration: "none" as const };

          if (!item.built) {
            return (
              <span key={item.href} title="coming soon" style={{ ...style, color: TEXT_FAINT, cursor: "default" }}>
                {item.label}
              </span>
            );
          }

          return (
            <Link key={item.href} href={item.href} style={{ ...style, color: active ? ACCENT : "#8C8C94" }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, color: TEXT_DIM, fontSize: 12 }}>
        <span>henry</span>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: TEXT_DIM,
            fontFamily: FONT_MONO,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          &#10140; exit
        </button>
      </div>
    </div>
  );
}