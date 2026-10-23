"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { looksLikeCode } from "@/lib/accessFormat.mjs";
import {
  ACCENT,
  BG_PANEL,
  FONT_MONO,
  PROMPT_USER,
  TEXT_DIM,
  TEXT_ERROR,
  TEXT_FAINT,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from "./theme";

type Line =
  | { type: "cmd"; text: string }
  | { type: "out"; text: string; color?: string }
  | { type: "ls" };

const INITIAL_HISTORY: Line[] = [
  { type: "cmd", text: "whoami" },
  { type: "out", text: "developer · dillydallyer · player 1", color: ACCENT },
  { type: "cmd", text: "ls" },
  { type: "ls" },
];

const HELP_TEXT =
  "available: whoami, ls, cat about.txt, cd about|projects|contact|home, clear";

// Keep the terminal a fixed size: once scrollback exceeds this many lines,
// the oldest ones drop off rather than growing the box (or adding a
// scrollbar) — a new command just replaces whatever's oldest.
const MAX_HISTORY_LINES = 6;
const LINE_HEIGHT_PX = 15 * 1.85; // matches the font-size/line-height below
const PANEL_VPAD_PX = 24;
const TERMINAL_BODY_HEIGHT =
  (MAX_HISTORY_LINES + 1) * LINE_HEIGHT_PX + PANEL_VPAD_PX * 2;

/**
 * The resting homepage: a quiet desktop (a couple of background shortcut
 * icons) with an already-open terminal front and center. The terminal is
 * both the "about you" moment (whoami/ls on load) and the site's real
 * navigation — click a line, or type a command.
 */
export default function HomeDesktop() {
  const router = useRouter();
  const [history, setHistory] = useState<Line[]>(INITIAL_HISTORY);
  const [input, setInput] = useState("");

  const navigate = (path: string) => router.push(path);

  // Anything shaped like an access code (word-word-1234) is quietly checked on
  // the server. A wrong code looks exactly like any other unknown command.
  const tryCode = async (cmd: string) => {
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cmd }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.ok) {
        const masked = "•".repeat(cmd.length);
        const accepted: Line = {
          type: "out",
          text: `[ ok ] code accepted · hello, ${data.label}`,
          color: ACCENT,
        };
        const opening: Line = { type: "out", text: "opening travel.log...", color: TEXT_DIM };
        setHistory((h) =>
          [
            ...h.map((l): Line => (l.type === "cmd" && l.text === cmd ? { ...l, text: masked } : l)),
            accepted,
            opening,
          ].slice(-MAX_HISTORY_LINES),
        );
        setTimeout(() => navigate("/travel"), 900);
        return;
      }
    } catch {
      // network trouble looks the same as a wrong code
    }
    const notFound: Line = { type: "out", text: `command not found: ${cmd}`, color: TEXT_ERROR };
    setHistory((h) => [...h, notFound].slice(-MAX_HISTORY_LINES));
  };

  const handleCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const lower = cmd.toLowerCase();
    const echo: Line = { type: "cmd", text: cmd };
    let output: Line[];

    if (lower === "whoami") {
      output = [
        { type: "out", text: "developer · dillydallyer · player 1", color: ACCENT },
      ];
    } else if (lower === "ls") {
      output = [{ type: "ls" }];
    } else if (lower === "help") {
      output = [{ type: "out", text: HELP_TEXT, color: TEXT_MUTED }];
    } else if (lower === "clear") {
      setHistory(INITIAL_HISTORY);
      setInput("");
      return;
    } else if (lower === "cat about.txt") {
      output = [
        {
          type: "out",
          text: "Building things for the web — admin tools, demos,",
          color: "#C9C9CE",
        },
        {
          type: "out",
          text: "the occasional experiment that gets out of hand.",
          color: "#C9C9CE",
        },
      ];
    } else if (["about", "about.txt", "cd about", "cd about.txt"].includes(lower)) {
      output = [{ type: "out", text: "opening about.txt...", color: TEXT_DIM }];
      setTimeout(() => navigate("/about"), 300);
    } else if (["projects", "projects/", "cd projects", "cd projects/"].includes(lower)) {
      output = [{ type: "out", text: "opening projects/...", color: TEXT_DIM }];
      setTimeout(() => navigate("/projects"), 300);
    } else if (["contact", "cd contact"].includes(lower)) {
      output = [{ type: "out", text: "opening contact...", color: TEXT_DIM }];
      setTimeout(() => navigate("/contact"), 300);
    } else if (["home", "cd home", "cd ~", "cd /"].includes(lower)) {
      output = [{ type: "out", text: "already home.", color: TEXT_DIM }];
    } else if (lower === "login" || lower === "sudo login") {
      output = [{ type: "out", text: "authenticating...", color: TEXT_DIM }];
      setTimeout(() => navigate("/login"), 350);
    } else if (looksLikeCode(lower)) {
      setHistory((h) => [...h, echo].slice(-MAX_HISTORY_LINES));
      setInput("");
      void tryCode(cmd);
      return;
    } else {
      output = [
        { type: "out", text: `command not found: ${cmd}`, color: TEXT_ERROR },
      ];
    }

    setHistory((h) => [...h, echo, ...output].slice(-MAX_HISTORY_LINES));
    setInput("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleCommand(input);
  };

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        minHeight: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 24,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <DesktopIcon label="projects/" symbol="[ ]" onClick={() => navigate("/projects")} />
        <DesktopIcon label="contact" symbol="@" onClick={() => navigate("/contact")} />
      </div>

      <div
        style={{
          width: "min(820px, 100%)",
          background: BG_PANEL,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Dot />
          <Dot />
          <Dot />
          <div
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: TEXT_DIM,
              fontFamily: FONT_MONO,
            }}
          >
            {PROMPT_USER}: ~
          </div>
        </div>

        <div
          style={{
            padding: "24px 28px",
            fontSize: 15,
            lineHeight: 1.85,
            color: TEXT_PRIMARY,
            fontFamily: FONT_MONO,
            height: TERMINAL_BODY_HEIGHT,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          {history.map((line, i) => (
            <TerminalLine key={i} line={line} onNavigate={navigate} />
          ))}

          <form onSubmit={onSubmit} style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: TEXT_DIM }}>{PROMPT_USER}</span>
            <span style={{ color: TEXT_FAINT }}>:~$</span>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                color: TEXT_PRIMARY,
                fontFamily: FONT_MONO,
                fontSize: 15,
                marginLeft: 8,
              }}
              spellCheck={false}
              autoComplete="off"
              aria-label="terminal command"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

function TerminalLine({
  line,
  onNavigate,
}: {
  line: Line;
  onNavigate: (path: string) => void;
}) {
  if (line.type === "cmd") {
    return (
      <div>
        <span style={{ color: TEXT_DIM }}>{PROMPT_USER}</span>
        <span style={{ color: TEXT_FAINT }}>:~$</span>&nbsp;{line.text}
      </div>
    );
  }

  if (line.type === "ls") {
    return (
      <div style={{ margin: "4px 0 2px", display: "flex", gap: 28, flexWrap: "wrap" }}>
        <button onClick={() => onNavigate("/about")} style={lsLinkStyle}>
          about.txt
        </button>
        <button onClick={() => onNavigate("/projects")} style={lsLinkStyle}>
          projects/
        </button>
        <button onClick={() => onNavigate("/contact")} style={lsLinkStyle}>
          contact
        </button>
      </div>
    );
  }

  return <div style={{ color: line.color ?? TEXT_PRIMARY, margin: "2px 0" }}>{line.text}</div>;
}

function DesktopIcon({
  label,
  symbol,
  onClick,
}: {
  label: string;
  symbol: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 84,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: TEXT_MUTED,
          fontFamily: FONT_MONO,
        }}
      >
        {symbol}
      </div>
      <div style={{ fontSize: 11, color: TEXT_MUTED, textAlign: "center", fontFamily: FONT_MONO }}>
        {label}
      </div>
    </button>
  );
}

function Dot() {
  return (
    <div style={{ width: 11, height: 11, borderRadius: "50%", background: TEXT_FAINT }} />
  );
}

const lsLinkStyle: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: ACCENT,
  fontWeight: 600,
  fontFamily: FONT_MONO,
  fontSize: 15,
  cursor: "pointer",
};