import AdminBar from "./AdminBar";
import { FONT_MONO, TEXT_DIM } from "@/app/components/theme";

/** Frame for every mobile admin page: bar on top, a centred column, and the "remember to exit" note. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", fontFamily: FONT_MONO }}>
      <AdminBar />
      <main style={{ flex: 1, width: "100%", maxWidth: 720, margin: "0 auto", boxSizing: "border-box", padding: "0 16px" }}>
        {children}
      </main>
      <footer style={{ padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", fontSize: 11, lineHeight: 1.6, color: TEXT_DIM }}>
        <div>&copy; {new Date().getFullYear()} hegli.dev</div>
        <div>{"# remember to exit when you're finished. on a shared device, use a private tab."}</div>
        <a
          href="/api/view?mode=desktop&next=/admin"
          style={{ minHeight: 44, display: "flex", alignItems: "center", color: "#8a8a93", textDecoration: "none" }}
        >
          # view desktop site
        </a>
      </footer>
    </div>
  );
}