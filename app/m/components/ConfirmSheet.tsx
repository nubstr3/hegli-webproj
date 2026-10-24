"use client";

import BottomSheet from "./BottomSheet";
import { BORDER_SUBTLE, FONT_MONO, TEXT_ERROR, TEXT_MUTED } from "@/app/components/theme";

/** "Are you sure?" bottom sheet for anything that can't be undone. */
export default function ConfirmSheet({
  title,
  message,
  yes,
  no = "cancel",
  onYes,
  onClose,
}: {
  title: string;
  message: string;
  yes: string;
  no?: string;
  onYes: () => void;
  onClose: () => void;
}) {
  const base = { flex: 1, height: 52, background: "transparent", borderRadius: 6, fontFamily: FONT_MONO, fontSize: 13 } as const;
  return (
    <BottomSheet title={title} onClose={onClose}>
      <div style={{ padding: "12px 8px 4px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: TEXT_ERROR }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onYes} style={{ ...base, color: TEXT_ERROR, border: `1px solid ${TEXT_ERROR}` }}>
            {yes}
          </button>
          <button type="button" onClick={onClose} style={{ ...base, color: TEXT_MUTED, border: `1px solid ${BORDER_SUBTLE}` }}>
            {no}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}