import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import { BG_GRADIENT, TEXT_PRIMARY } from "./theme";

/**
 * Shared chrome for every public page: the dark gradient + dot-grid
 * background, the status-bar nav on top, and the copyright footer —
 * everything that should feel like a permanent fixture of the site
 * rather than something tied to one screen.
 */
export default function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG_GRADIENT,
        color: TEXT_PRIMARY,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      <SiteNav />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
          minHeight: 0,
        }}
      >
        {children}
      </div>
      <SiteFooter />
    </main>
  );
}
