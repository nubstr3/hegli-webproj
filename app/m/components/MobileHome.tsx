"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties, type FormEvent } from "react";
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
} from "@/app/components/theme";

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

// Same pause as the desktop terminal, so a code-shaped guess can't be told apart
// from any other unknown command by how quickly it answers.
const UNKNOWN_DELAY_MS = 700;
const MAX_HISTORY_LINES = 7;
const HELP_TEXT = "available: whoami, ls, cat about.txt, cd about|projects|contact|home, clear";

/**
 * Touch version of the homepage terminal. Same commands and the same quiet access-code
 * check as HomeDesktop, but the files are real tap targets and the prompt is a proper
 * mobile text field (16px so iOS doesn't zoom, no auto-capitalise/correct).
 */
export default function MobileHome() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<Line[]>(INITIAL_HISTORY);
  const [input, setInput] = useState("");

  const navigate = (path: string) => router.push(path);
  const push = (...lines: Line[]) => setHistory((h) => [...h, ...lines].slice(-MAX_HISTORY_LINES));

  // Anything shaped like word-word-1234 is quietly checked on the server.
  // A wrong code looks exactly like any other unknown command.
  const tryCode = async (cmd: string) => {
    try {
      const [res] = await Promise.all([
        fetch("/api/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: cmd }),
        }),
        new Promise((r) => setTimeout(r, UNKNOWN_DELAY_MS)),
      ]);
      const data = res.ok ? await res.json() : null;
      if (data?.ok) {
        const masked = "•".repeat(cmd.length);
        setHistory((h) =>
          [
            ...h.map((l): Line => (l.type === "cmd" && l.text === cmd ? { ...l, text: masked } : l)),
            { type: "out", text: `[ ok ] code accepted · hello, ${data.label}`, color: ACCENT } as Line,
            { type: "out", text: "opening travel.log...", color: TEXT_DIM } as Line,
          ].slice(-MAX_HISTORY_LINES),
        );
        setTimeout(() => navigate("/travel"), 900);
        return;
      }
    } catch {
      // network trouble looks the same as a wrong code
    }
    push({ type: "out", text: `command not found: ${cmd}`, color: TEXT_ERROR });
  };

  const handleCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const lower = cmd.toLowerCase();
    const echo: Line = { type: "cmd", text: cmd };
    let output: Line[];

    if (lower === "whoami") {
      output = [{ type: "out", text: "developer · dillydallyer · player 1", color: ACCENT }];
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
        { type: "out", text: "Building things for the web — admin tools, demos,", color: "#C9C9CE" },
        { type: "out", text: "the occasional experiment that gets out of hand.", color: "#C9C9CE" },
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
      push(echo);
      setInput("");
      void tryCode(cmd);
      return;
    } else {
      push(echo);
      setInput("");
      setTimeout(
        () => push({ type: "out", text: `command not found: ${cmd}`, color: TEXT_ERROR }),
        UNKNOWN_DELAY_MS,
      );
      return;
    }

    push(echo, ...output);
    setInput("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleCommand(input);
  };

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      {/* desktop-style shortcut icons */}
      <div style={{ display: "flex", gap: 12, paddingTop: 20 }}>
        <ShortcutIcon href="/projects" label="projects/" symbol="[ ]" />
        <ShortcutIcon href="/contact" label="contact" symbol="@" />
      </div>

      {/* the terminal window */}
      <div
        style={{
          marginTop: 44,
          background: BG_PANEL,
          border: "1px solid #2a2a30",
          borderRadius: 10,
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 40,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "0 14px",
            borderBottom: "1px solid #26262b",
            fontSize: 12,
            color: TEXT_DIM,
          }}
        >
          <Dot />
          <Dot />
          <Dot />
          <span style={{ marginLeft: 6 }}>{PROMPT_USER}: ~</span>
        </div>

        {/* tapping empty space in the terminal focuses the prompt, like a real terminal */}
        <div
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("a")) inputRef.current?.focus();
          }}
          style={{
            padding: "16px 16px 12px",
            fontSize: 13,
            lineHeight: 1.6,
            color: TEXT_PRIMARY,
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          {history.map((line, i) => (
            <TerminalLine key={i} line={line} />
          ))}

          <form onSubmit={onSubmit} style={{ display: "flex", alignItems: "center", whiteSpace: "pre" }}>
            <span style={{ color: TEXT_DIM }}>{PROMPT_USER}</span>
            <span style={{ color: TEXT_FAINT }}>:~$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              inputMode="text"
              enterKeyHint="go"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              aria-label="terminal command"
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                marginLeft: 8,
                padding: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                color: TEXT_PRIMARY,
                caretColor: ACCENT,
                fontFamily: FONT_MONO,
                fontSize: 16, // 16px+ stops iOS Safari zooming in on focus
              }}
            />
          </form>
        </div>
      </div>

      <p style={{ margin: 0, padding: "16px 0 0", textAlign: "center", fontSize: 12, lineHeight: 1.5, color: "#8a8a93" }}>
        # tap a file, or type a command
      </p>
    </div>
  );
}

function TerminalLine({ line }: { line: Line }) {
  if (line.type === "cmd") {
    return (
      <div style={{ wordBreak: "break-all" }}>
        <span style={{ color: TEXT_DIM }}>{PROMPT_USER}</span>
        <span style={{ color: TEXT_FAINT }}>:~$</span>&nbsp;{line.text}
      </div>
    );
  }
  if (line.type === "ls") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 24 }}>
        <Link href="/about" style={lsLink}>about.txt</Link>
        <Link href="/projects" style={lsLink}>projects/</Link>
        <Link href="/contact" style={lsLink}>contact</Link>
      </div>
    );
  }
  return <div style={{ color: line.color ?? TEXT_PRIMARY, margin: "2px 0" }}>{line.text}</div>;
}

function ShortcutIcon({ href, label, symbol }: { href: string; label: string; symbol: string }) {
  return (
    <Link
      href={href}
      style={{
        width: 76,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        textDecoration: "none",
        color: "#cfcfd4",
        fontSize: 11,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #2a2a30",
          borderRadius: 8,
          background: BG_PANEL,
          fontSize: 18,
        }}
      >
        {symbol}
      </span>
      {label}
    </Link>
  );
}

function Dot() {
  return <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a40" }} />;
}

const lsLink: CSSProperties = {
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  color: ACCENT,
  fontWeight: 700,
  textDecoration: "none",
};