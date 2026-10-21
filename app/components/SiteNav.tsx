"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveClock } from "./useLiveClock";
import { useLivePing } from "./useLivePing";
import { clearBootFlag, replayBoot } from "./bootStorage";
import { ACCENT, BG_STATUSBAR, FONT_MONO, TEXT_DIM, TEXT_PRIMARY } from "./theme";

const NAV_ITEMS = [
  { href: "/", label: "1 home" },
  { href: "/about", label: "2 about" },
  { href: "/projects", label: "3 projects" },
  { href: "/contact", label: "4 contact" },
];

/**
 * Thin tiling-WM-style status bar that doubles as the site's primary nav.
 * ~/hegli.dev on the left is the home link; the workspace-numbered items
 * are the actual pages, with the active one highlighted (text only, no
 * filled pill) in the accent color.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const time = useLiveClock();
  const ping = useLivePing();

  const handleReboot = () => {
    replayBoot();
    // Full reload rather than client-side navigation: the boot gate's
    // decision is made once on mount, so this is the simplest reliable
    // way to force it to run again, from any page.
    window.location.href = "/";
  };

  return (
    <div
      style={{
        height: 34,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: BG_STATUSBAR,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontFamily: FONT_MONO,
        fontSize: 13,
        position: "relative",
        zIndex: 10,
      }}
    >
      <Link
        href="/"
        style={{ color: TEXT_DIM, textDecoration: "none", fontWeight: 600 }}
      >
        ~/hegli.dev
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: active ? ACCENT : "#8C8C94",
                textDecoration: "none",
                padding: "7px 14px",
                borderRadius: 4,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          color: TEXT_DIM,
          fontSize: 12,
        }}
      >
        <button
          onClick={handleReboot}
          title="Replay the boot sequence"
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
          &#8635; reboot
        </button>
        <span>cpu {ping !== null ? `${Math.min(99, ping)}%` : "--"}</span>
        <span style={{ color: TEXT_PRIMARY }}>{time}</span>
      </div>
    </div>
  );
}