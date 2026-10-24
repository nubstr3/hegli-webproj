"use client";

import { useRouter } from "next/navigation";
import { FONT_MONO } from "@/app/components/theme";

/** Ends a code login (same call as the desktop exit button), with a finger-sized target. */
export default function MobileExit() {
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
      style={{ minHeight: 44, padding: "0 4px", background: "none", border: "none", color: "#cfcfd4", fontFamily: FONT_MONO, fontSize: 12 }}
    >
      &#10140; exit
    </button>
  );
}