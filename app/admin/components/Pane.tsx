import type { CSSProperties, ReactNode } from "react";
import { BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_MUTED, TEXT_PRIMARY } from "@/app/components/theme";

/**
 * A terminal-window-style panel used by every admin widget: a thin title bar
 * (like `reminders.sh`) with an optional right-hand slot, then the content.
 */
export default function Pane({
  title,
  right,
  children,
  style,
  bodyStyle,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}) {
  return (
    <div
      style={{
        flex: "1 1 320px",
        minWidth: 0,
        minHeight: 0,
        background: BG_PANEL,
        border: `1px solid ${BORDER_SUBTLE}`,
        borderRadius: 6,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT_MONO,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          borderBottom: `1px solid ${BORDER_SUBTLE}`,
          background: "rgba(255,255,255,0.015)",
          fontSize: 12,
          color: TEXT_MUTED,
        }}
      >
        <span>{title}</span>
        {right}
      </div>
      <div
        style={{
          padding: "16px 16px 18px",
          fontSize: 12,
          color: TEXT_PRIMARY,
          flex: 1,
          minHeight: 0,
          overflowY: "auto", // scrolls when the widget has been given a fixed height
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}