import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_DIM } from "@/app/components/theme";

/** Touch version of AboutNotepad: same content, tighter padding for small screens. */
export default function MobileAbout({
  headline,
  bio,
  playing,
}: {
  headline: string;
  bio: string;
  playing: string;
}) {
  const wrap = { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } as const;
  return (
    <div
      style={{
        background: BG_PANEL,
        border: `1px solid ${BORDER_SUBTLE}`,
        borderRadius: 10,
        padding: "22px 20px 0",
        fontFamily: FONT_MONO,
        fontSize: 13,
        lineHeight: 1.8,
      }}
    >
      <div style={{ color: ACCENT, fontSize: 14, fontWeight: 500, ...wrap }}>{headline}</div>
      <div style={{ marginTop: 18, color: "#e8e8ea", ...wrap }}>{bio}</div>
      <div style={{ marginTop: 20, color: TEXT_DIM }}>currently playing with:</div>
      <div style={{ color: "#e8e8ea", ...wrap }}>{playing}</div>
      <div
        style={{
          marginTop: 22,
          height: 44,
          display: "flex",
          alignItems: "center",
          borderTop: `1px solid ${BORDER_SUBTLE}`,
          fontSize: 11,
          color: TEXT_DIM,
        }}
      >
        Ln 9, Col 1
      </div>
    </div>
  );
}