"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ACCENT,
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

/** Touch version of /login: same Supabase sign-in, with a phone-sized form. */
export default function MobileLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // Already signed in (session cookie still valid)? Skip the form.
  useEffect(() => {
    let done = false;
    const show = () => {
      if (!done) {
        done = true;
        setChecking(false);
      }
    };
    // Never leave the form hidden: if the session check errors or hangs (older iOS Safari),
    // show the form anyway after a moment.
    const timer = setTimeout(show, 2500);
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data?.user) router.replace("/admin");
        else show();
      })
      .catch(show);
    return () => clearTimeout(timer);
  }, [router]);

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

  if (checking) return <div style={{ minHeight: "100dvh" }} />;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", fontFamily: FONT_MONO }}>
      {/* minimal bar, like desktop: this page isn't part of the main nav */}
      <header
        style={{
          flexShrink: 0,
          paddingTop: "env(safe-area-inset-top)",
          background: BG_STATUSBAR,
          borderBottom: "1px solid #1d1d21",
        }}
      >
        <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", fontSize: 12 }}>
          <Link href="/" style={{ color: "#9a9aa4", textDecoration: "none", fontWeight: 600 }}>
            ~/hegli.dev
          </Link>
          <span style={{ color: TEXT_FAINT }}>/login</span>
        </div>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 480, margin: "0 auto", boxSizing: "border-box", padding: "56px 16px 0" }}>
        <div
          style={{
            background: BG_PANEL,
            border: `1px solid ${BORDER_SUBTLE}`,
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 14px",
              borderBottom: `1px solid ${BORDER_SUBTLE}`,
              background: "rgba(255,255,255,0.015)",
              fontSize: 12,
              color: TEXT_DIM,
            }}
          >
            <Dot />
            <Dot />
            <Dot />
            <span style={{ marginLeft: 6 }}>auth.sh</span>
          </div>

          <form onSubmit={handleLogin} style={{ padding: "22px 18px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: TEXT_DIM }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>{PROMPT_USER}</span>
              <span style={{ color: TEXT_FAINT }}>:~$</span> <span style={{ color: "#f2f2f4" }}>sudo login</span>
            </div>

            <label style={{ marginTop: 22, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, lineHeight: 1, color: "#8a8a93" }}>email:</span>
              <div style={fieldWrap}>
                <span aria-hidden="true" style={{ fontSize: 13, color: TEXT_FAINT }}>&gt;</span>
                <input
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  placeholder="guest@hegli.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={input}
                />
              </div>
            </label>

            <label style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, lineHeight: 1, color: "#8a8a93" }}>password:</span>
              <div style={fieldWrap}>
                <span aria-hidden="true" style={{ fontSize: 13, color: TEXT_FAINT }}>&gt;</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  enterKeyHint="go"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={input}
                />
              </div>
            </label>

            {error && (
              <div role="alert" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.5, color: TEXT_ERROR }}>
                bash: login: {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 24,
                height: 52,
                background: "transparent",
                border: `1px solid ${ACCENT}`,
                borderRadius: 6,
                color: ACCENT,
                fontFamily: FONT_MONO,
                fontSize: 14,
                fontWeight: 500,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "authenticating..." : "[ enter ]"}
            </button>

            <Link
              href="/"
              style={{ marginTop: 6, minHeight: 44, display: "flex", alignItems: "center", fontSize: 11, color: "#8a8a93", textDecoration: "none" }}
            >
              &larr; back to ~/hegli.dev
            </Link>
          </form>
        </div>
      </main>

      <footer style={{ padding: "16px 16px calc(16px + env(safe-area-inset-bottom))", fontSize: 11, lineHeight: 1, color: "#8a8a93" }}>
        &copy; {new Date().getFullYear()} hegli.dev
      </footer>
    </div>
  );
}

function Dot() {
  return <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a40" }} />;
}

const fieldWrap: CSSProperties = {
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderBottom: `1px solid ${BORDER_SUBTLE}`,
};

const input: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 48,
  padding: 0,
  background: "transparent",
  border: "none",
  outline: "none",
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 16, // 16px+ stops iOS Safari zooming in on focus
};