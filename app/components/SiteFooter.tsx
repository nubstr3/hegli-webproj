import { TEXT_FAINT } from "./theme";

/**
 * © {year} hegli.dev, bottom-left on every public page — part of the
 * site's permanent chrome, not homepage-specific content.
 */
export default function SiteFooter() {
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        bottom: 14,
        fontSize: 11,
        color: TEXT_FAINT,
        zIndex: 1,
      }}
    >
      &copy; {new Date().getFullYear()} hegli.dev
    </div>
  );
}
