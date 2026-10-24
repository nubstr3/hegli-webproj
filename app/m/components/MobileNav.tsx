"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveClock } from "@/app/components/useLiveClock";
import { useLivePing } from "@/app/components/useLivePing";
import { ACCENT, BG_STATUSBAR, FONT_MONO, TEXT_DIM, TEXT_PRIMARY } from "@/app/components/theme";

const NAV_ITEMS = [
  { href: "/", num: "1", label: "home" },
  { href: "/about", num: "2", label: "about" },
  { href: "/projects", num: "3", label: "projects" },
  { href: "/contact", num: "4", label: "contact" },
];

/**
 * Touch version of SiteNav: a thin status bar (~/hegli.dev, cpu, clock) with the
 * numbered tabs on a row of their own underneath so every tab is a finger-sized target.
 *
 * The mobile site is rewritten onto the normal URLs, so usePathname() reports
 * "/about", not "/m/about" - these links and the active check use the public paths.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const time = useLiveClock();
  const ping = useLivePing();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
        background: BG_STATUSBAR,
        borderBottom: "1px solid #1d1d21",
        paddingTop: "env(safe-area-inset-top)",
        fontFamily: FONT_MONO,
      }}
    >
      <div
        style={{
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          fontSize: 12,
        }}
      >
        <Link href="/" style={{ color: "#9a9aa4", textDecoration: "none", fontWeight: 600 }}>
          ~/hegli.dev
        </Link>
        <span style={{ display: "flex", gap: 12, color: TEXT_DIM }}>
          <span>cpu {ping !== null ? `${Math.min(99, ping)}%` : "--"}</span>
          <span style={{ color: TEXT_PRIMARY, fontWeight: 700 }}>{time}</span>
        </span>
      </div>

      <nav
        style={{
          maxWidth: 720,
          margin: "0 auto",
          height: 48,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "stretch",
          fontSize: 13,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                marginBottom: -1,
                borderBottom: `2px solid ${active ? ACCENT : "transparent"}`,
                color: active ? ACCENT : "#8a8a93",
                fontWeight: active ? 700 : 400,
                textDecoration: "none",
              }}
            >
              <span>{item.num}&nbsp;</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}