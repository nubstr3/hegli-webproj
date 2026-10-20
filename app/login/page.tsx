"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ACCENT,
  BG_GRADIENT,
  BG_PANEL,
  BG_STATUSBAR,
  BORDER_SUBTLE,
  FONT_MONO,
  PROMPT_USER,
  TEXT_DIM,
  TEXT_ERROR,
  TEXT_FAINT,
  TEXT_PRIMARY,
} from "@/app/components/theme";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("invalid credentials");
      setSubmitting(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        background: BG_GRADIENT,
        fontFamily: FONT_MONO,
      }}
    >
      {/* status bar — deliberately minimal: this route isn't part of the
          main nav, you get here via the terminal's hidden login command */}
      <div
        style={{
          height: 34,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: BG_STATUSBAR,
          borderBottom: `1px solid ${BORDER_SUBTLE}`,
          fontSize: 13,
        }}
      >
        <Link href="/" style={{ color: TEXT_DIM, textDecoration: "none", fontWeight: 600 }}>
          ~/hegli.dev
        </Link>
        <span style={{ color: TEXT_FAINT, fontSize: 12 }}>/login</span>
      </div>

      {/* centered terminal card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: BG_PANEL,
            border: `1px solid ${BORDER_SUBTLE}`,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          }}
        >
          {/* card header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderBottom: `1px solid ${BORDER_SUBTLE}`,
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3a3a40" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3a3a40" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3a3a40" }} />
            <span style={{ marginLeft: 4, color: TEXT_DIM, fontSize: 12 }}>auth.sh</span>
          </div>

          {/* card body */}
          <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ color: TEXT_DIM, fontSize: 13, lineHeight: 1.6 }}>
              <span style={{ color: ACCENT }}>{PROMPT_USER}</span>
              <span style={{ color: TEXT_FAINT }}>:~$</span> sudo login
            </div>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ color: TEXT_FAINT, fontSize: 12 }}>email:</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderBottom: `1px solid ${BORDER_SUBTLE}`,
                    paddingBottom: 8,
                  }}
                >
                  <span style={{ color: TEXT_FAINT, fontSize: 13 }}>&gt;</span>
                  <input
                    type="email"
                    required
                    placeholder="guest@hegli.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ color: TEXT_FAINT, fontSize: 12 }}>password:</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderBottom: `1px solid ${BORDER_SUBTLE}`,
                    paddingBottom: 8,
                  }}
                >
                  <span style={{ color: TEXT_FAINT, fontSize: 13 }}>&gt;</span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </label>

              {error && (
                <div style={{ color: TEXT_ERROR, fontSize: 12, lineHeight: 1.5 }}>bash: login: {error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 4,
                  alignSelf: "flex-start",
                  background: "transparent",
                  border: `1px solid ${ACCENT}`,
                  color: ACCENT,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  padding: "9px 18px",
                  borderRadius: 4,
                  cursor: submitting ? "default" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "authenticating..." : "[ enter ]"}
              </button>
            </form>

            <Link href="/" style={{ fontSize: 12, color: TEXT_FAINT, marginTop: 4, textDecoration: "none" }}>
              esc — back to ~/hegli.dev
            </Link>
          </div>
        </div>
      </div>

      {/* footer */}
      <div style={{ flexShrink: 0, padding: "14px 16px", color: TEXT_FAINT, fontSize: 12 }}>
        © {new Date().getFullYear()} hegli.dev
      </div>
    </div>
  );
}

const inputStyle = {
  background: "transparent",
  border: "none",
  outline: "none",
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 14,
  width: "100%",
} as const;