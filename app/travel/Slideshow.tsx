"use client";

import { useEffect, useState } from "react";
import { ACCENT, FONT_MONO, TEXT_PRIMARY } from "@/app/components/theme";

export type SlidePhoto = { url: string; width: number; height: number };

const INTERVAL_MS = 4000;
const FADE_MS = 900;

/** Photos that fade out and in on a timer. Pauses on hover or when asked; dots jump to a photo. */
export default function Slideshow({ photos }: { photos: SlidePhoto[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const count = photos.length;
  const running = count > 1 && !paused && !hover;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [running, count, index]);

  if (count === 0) return null;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        overflow: "hidden",
        background: "#0b0c0e",
        border: "1px solid #26292d",
        borderRadius: 4,
      }}
    >
      {photos.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.url}
          src={p.url}
          alt={`photo ${i + 1} of ${count}`}
          width={p.width}
          height={p.height}
          loading={i === 0 ? "eager" : "lazy"}
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: i === index ? 1 : 0,
            transition: reduceMotion ? "none" : `opacity ${FADE_MS}ms ease`,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))",
          fontFamily: FONT_MONO,
          fontSize: 13,
          color: TEXT_PRIMARY,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => setIndex(i)}
              style={{ padding: "8px 4px", border: 0, background: "none", cursor: "pointer" }}
            >
              <span
                style={{
                  display: "block",
                  height: 6,
                  width: i === index ? 28 : 10,
                  borderRadius: 3,
                  background: i === index ? ACCENT : "#5a6068",
                  transition: "width 300ms ease",
                }}
              />
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>
            {index + 1} / {count}
          </span>
          {count > 1 && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              style={{
                minHeight: 32,
                padding: "4px 14px",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid #3a3d42",
                borderRadius: 4,
                color: TEXT_PRIMARY,
                fontFamily: FONT_MONO,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {paused || hover ? "play" : "pause"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}