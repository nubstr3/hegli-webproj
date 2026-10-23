"use client";

import { useRouter } from "next/navigation";
import { FONT_MONO, TEXT_MUTED } from "@/app/components/theme";

export default function ExitButton() {
  const router = useRouter();
  const exit = async () => {
    try {
      await fetch("/api/access/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  };
  return (
    <button
      type="button"
      onClick={exit}
      className="hegli-act"
      style={{ background: "none", border: "none", padding: 0, color: TEXT_MUTED, fontFamily: FONT_MONO, fontSize: 13, cursor: "pointer" }}
    >
      &#10140; exit
    </button>
  );
}