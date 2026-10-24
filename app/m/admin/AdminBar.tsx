"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ACCENT, BG_STATUSBAR, FONT_MONO, TEXT_DIM, TEXT_PRIMARY } from "@/app/components/theme";
import { useLiveClock } from "@/app/components/useLiveClock";

const TABS = [
  { href: "/admin/files", num: "1", label: "files" },
  { href: "/admin/journal", num: "2", label: "journal" },
  { href: "/admin/settings", num: "3", label: "settings" },
];

/** Top bar + tab row for the mobile admin. Links use the normal /admin/... paths (the proxy swaps in the mobile pages). */
export default function AdminBar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const time = useLiveClock();

  const exit = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: BG_STATUSBAR,
        borderBottom: "1px solid #1d1d21",
        paddingTop: "env(safe-area-inset-top)",
        fontFamily: FONT_MONO,
      }}
    >
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 0 16px", fontSize: 12 }}>
        <Link href="/" style={{ color: "#9a9aa4", textDecoration: "none", fontWeight: 600 }}>
          ~/hegli.dev <span style={{ color: ACCENT, fontWeight: 400 }}>/admin</span>
        </Link>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: TEXT_DIM }}>
          <span style={{ color: TEXT_PRIMARY, fontWeight: 700 }}>{time}</span>
          <button
            type="button"
            onClick={exit}
            style={{ minWidth: 72, height: 44, background: "none", border: "none", color: "#cfcfd4", fontFamily: FONT_MONO, fontSize: 12 }}
          >
            henry &rarr; exit
          </button>
        </span>
      </div>
      <nav style={{ maxWidth: 720, margin: "0 auto", height: 48, display: "flex", justifyContent: "space-around", fontSize: 13 }}>
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href) || (t.href === "/admin/files" && pathname === "/admin");
          return (
            <Link
              key={t.href}
              href={t.href}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                marginBottom: -1,
                borderBottom: `2px solid ${active ? ACCENT : "transparent"}`,
                color: active ? ACCENT : "#8a8a93",
                fontWeight: active ? 700 : 400,
                textDecoration: "none",
              }}
            >
              <span>{t.num}&nbsp;</span>
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}