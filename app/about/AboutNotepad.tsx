import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_DIM } from "@/app/components/theme";

/**
 * The notepad card on /about. Also used (compact) as the live preview in the
 * admin editor, so what you see there is exactly what visitors get.
 */
export default function AboutNotepad({
  headline,
  bio,
  playing,
  compact = false,
}: {
  headline: string;
  bio: string;
  playing: string;
  compact?: boolean;
}) {
  const wrap = { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } as const;
  return (
    <div
      style={{
        width: "100%",
        maxWidth: compact ? 560 : 760,
        boxSizing: "border-box",
        background: BG_PANEL,
        border: `1px solid ${BORDER_SUBTLE}`,
        borderRadius: 10,
        padding: compact ? "30px 32px" : "36px 40px",
        fontFamily: FONT_MONO,
        fontSize: compact ? 14 : 15,
        lineHeight: 1.9,
        boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ color: ACCENT, ...wrap }}>{headline}</div>
      <div style={{ height: 20 }} />
      <div style={{ color: "#C9C9CE", ...wrap }}>{bio}</div>
      <div style={{ height: 20 }} />
      <div style={{ color: TEXT_DIM }}>currently playing with:</div>
      <div style={{ color: "#C9C9CE", ...wrap }}>{playing}</div>
      <div style={{ height: 28 }} />
      <div
        style={{
          borderTop: `1px solid ${BORDER_SUBTLE}`,
          paddingTop: 14,
          fontSize: 12,
          color: TEXT_DIM,
        }}
      >
        Ln 9, Col 1
      </div>
    </div>
  );
}