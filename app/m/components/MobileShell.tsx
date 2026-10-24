import MobileNav from "./MobileNav";
import MobileFooter from "./MobileFooter";

/** Chrome for every public mobile/tablet page: nav on top, footer at the bottom. */
export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <MobileNav />
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 688, // phones fill the width; tablets get a centred column
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "0 16px",
        }}
      >
        {children}
      </main>
      <MobileFooter />
    </div>
  );
}