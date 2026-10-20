"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACCENT, BG_GRADIENT, FONT_MONO, TEXT_DIM } from "./theme";

const LINES = [
  "BIOS v1.0",
  "Loading hegli.dev...",
  "Mounting /dev/player1...",
  "Starting system",
];

const CHAR_MS = 16;
const LINE_PAUSE_MS = 70;
// Keep in sync with the hegli-boot-flicker animation duration in globals.css
// (flicker in, hold, then fade out) — this is when we move on to reveal.
const GLITCH_MS = 1400;
const REVEAL_MS = 300;
const SKIP_DELAY_MS = 1000;

type Phase = "text" | "glitch" | "reveal";

/**
 * Full-screen one-time boot sequence: BIOS-style boot text types out,
 * then the hegli.dev() wordmark glitches into focus, then it hands off
 * to the resting homepage. A skip link appears after ~1s. The parent
 * decides whether to mount this at all (reduced-motion / recently-seen
 * checks happen there) — once mounted, this always plays through.
 */
export default function BootOverlay({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("text");
  const [typed, setTyped] = useState<string[]>([]);
  const [showSkip, setShowSkip] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    clearTimers();
    onDone();
  }, [onDone]);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), SKIP_DELAY_MS);
    timers.current.push(skipTimer);

    let lineIndex = 0;
    let charIndex = 0;
    const revealed: string[] = [];

    const typeNext = () => {
      if (lineIndex >= LINES.length) {
        const t = setTimeout(() => setPhase("glitch"), 120);
        timers.current.push(t);
        return;
      }
      const line = LINES[lineIndex];
      charIndex++;
      revealed[lineIndex] = line.slice(0, charIndex);
      setTyped([...revealed]);

      if (charIndex >= line.length) {
        lineIndex++;
        charIndex = 0;
        const t = setTimeout(typeNext, LINE_PAUSE_MS);
        timers.current.push(t);
      } else {
        const t = setTimeout(typeNext, CHAR_MS);
        timers.current.push(t);
      }
    };
    typeNext();

    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (phase === "glitch") {
      const t = setTimeout(() => setPhase("reveal"), GLITCH_MS);
      timers.current.push(t);
      return () => clearTimeout(t);
    }
    if (phase === "reveal") {
      const t = setTimeout(finish, REVEAL_MS);
      timers.current.push(t);
      return () => clearTimeout(t);
    }
  }, [phase, finish]);

  const lastLine = LINES.length - 1;
  const lastLineTyped = typed[lastLine] === LINES[lastLine];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {phase === "text" && (
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            padding: "0 32px",
            fontFamily: FONT_MONO,
            fontSize: 16,
            lineHeight: 2.1,
            boxSizing: "border-box",
          }}
        >
          {LINES.map((line, i) => (
            <div
              key={line}
              style={{
                color: i === lastLine ? ACCENT : TEXT_DIM,
                minHeight: "1.4em",
              }}
            >
              {typed[i] ?? ""}
              {i === lastLine && lastLineTyped && (
                <span
                  className="hegli-cursor"
                  style={{
                    display: "inline-block",
                    width: 9,
                    height: 18,
                    background: ACCENT,
                    marginLeft: 6,
                    verticalAlign: "middle",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {phase === "glitch" && (
        <div
          className="hegli-boot-glitch"
          style={{
            position: "relative",
            fontFamily: FONT_MONO,
            fontSize: "clamp(40px, 8vw, 88px)",
            fontWeight: 700,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 4,
              top: 3,
              color: "#FF4FD8",
              opacity: 0.7,
              mixBlendMode: "screen",
            }}
          >
            hegli.dev()
          </span>
          <span
            style={{
              position: "absolute",
              left: -4,
              top: -3,
              color: "#4CE0D0",
              opacity: 0.7,
              mixBlendMode: "screen",
            }}
          >
            hegli.dev()
          </span>
          <span style={{ position: "relative", color: "#ECECEA" }}>
            hegli.dev()
          </span>
        </div>
      )}

      {phase === "reveal" && (
        <div style={{ width: "100%", height: "100%", background: BG_GRADIENT }} />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
        }}
      />

      {showSkip && (
        <button
          onClick={finish}
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#9A9AA0",
            fontFamily: FONT_MONO,
            fontSize: 12,
            padding: "8px 14px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          skip &rarr;
        </button>
      )}
    </div>
  );
}