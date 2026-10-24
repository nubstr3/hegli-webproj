"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FONT_MONO } from "@/app/components/theme";

/** © line, login link, and the escape hatch to the desktop site (remembered for 30 days). */
export default function MobileFooter() {
  const pathname = usePathname() || "/";
  const row = { minHeight: 44, display: "flex", alignItems: "center", color: "#8a8a93", textDecoration: "none" } as const;

  return (
    <footer
      style={{
        width: "100%",
        maxWidth: 688,
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "8px 16px calc(8px + env(safe-area-inset-bottom))",
        fontFamily: FONT_MONO,
        fontSize: 11,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#8a8a93" }}>&copy; {new Date().getFullYear()} hegli.dev</span>
        <Link href="/login" style={row}>
          # sudo login &rarr;
        </Link>
      </div>
      {/* plain <a>: has to be a real navigation so the server sets the cookie */}
      <a href={`/api/view?mode=desktop&next=${encodeURIComponent(pathname)}`} style={row}>
        # view desktop site
      </a>
    </footer>
  );
}