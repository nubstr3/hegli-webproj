"use client";

import { useRef, useState } from "react";
import type { SlidePhoto } from "./travelData";
import { ACCENT, FONT_MONO, TEXT_PRIMARY } from "@/app/components/theme";

/**
 * Touch version of the travel slideshow: swipe through the photos (no auto-fade, which
 * fights a thumb), with the same dots and "1 / 3" counter. Dots are tappable.
 */
export default function MobileSlideshow({ photos }: { photos: SlidePhoto[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = photos.length;

  const onScroll = () => {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
  };

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  if (count === 0) return null;

  return (
    <div style={{ border: "1px solid #26292d", borderRadius: 4, overflow: "hidden", background: "#0b0c0e", fontFamily: FONT_MONO }}>
      <div
        ref={track}
        onScroll={onScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          aspectRatio: "4 / 3",
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
            style={{ flex: "0 0 100%", width: "100%", height: "100%", objectFit: "contain", scrollSnapAlign: "center" }}
          />
        ))}
      </div>
      <div style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderTop: "1px solid #26292d", fontSize: 12, color: TEXT_PRIMARY }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              style={{ padding: "18px 5px", border: 0, background: "none" }}
            >
              <span style={{ display: "block", height: 6, width: i === index ? 26 : 10, borderRadius: 3, background: i === index ? ACCENT : "#5a6068", transition: "width 250ms ease" }} />
            </button>
          ))}
        </div>
        <span>
          {index + 1} / {count}
        </span>
      </div>
    </div>
  );
}