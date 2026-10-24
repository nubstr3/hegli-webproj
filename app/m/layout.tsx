import type { Viewport } from 'next'

// Mobile + tablet site. The root layout still supplies <html>, fonts and the accent script.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // lets us pad for the iPhone notch / home bar
  themeColor: '#0a0a0c',
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-site="mobile" // lets TouchDetect know the touch site is already showing
      style={{
        minHeight: '100dvh',
        background: '#0f0f11',
        backgroundImage: 'radial-gradient(#1b1b1f 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        color: '#e8e8ea',
        fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
      }}
    >
      {children}
    </div>
  )
}