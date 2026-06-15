import Link from 'next/link'

const projects = [
  {
    title: 'E-commerce Platform',
    description: 'A modern online store with product listings, cart, and checkout flow.',
    slug: 'ecommerce',
    emoji: '🛍️',
    bg: '#0f0f0f',
    tags: ['Next.js', 'Tailwind'],
  },
  {
    title: 'Hotel Booking',
    description: 'A hotel reservation platform with room listings, availability and booking flow.',
    slug: 'hotel',
    emoji: '🏨',
    bg: '#0a1628',
    tags: ['Next.js', 'Tailwind'],
  },
  {
    title: 'News Website',
    description: 'A modern news platform with article listings, categories and reading view.',
    slug: 'news',
    emoji: '📰',
    bg: '#1a0a00',
    tags: ['Next.js', 'Tailwind'],
  },
]

export default function ProjectsPage() {
  return (
    <main>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '0.5px solid #e5e5e5' }}>
        <Link href="/" style={{ fontSize: '14px', fontWeight: '500', color: '#111', textDecoration: 'none' }}>hegli.dev</Link>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/#about" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>about</Link>
          <Link href="/#contact" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>contact</Link>
          <Link href="/projects" style={{ fontSize: '13px', color: '#111', textDecoration: 'none', fontWeight: '500' }}>projects</Link>
        </div>
      </nav>

      <div style={{ padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Projects</p>
          <p style={{ fontSize: '28px', fontWeight: '500', margin: '0', letterSpacing: '-0.5px' }}>Things I've built</p>
          <p style={{ fontSize: '14px', color: '#888', margin: '8px 0 0' }}>A collection of UI demos and design explorations</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '16px' }}>
          {projects.map((project) => (
            <div key={project.slug} style={{ border: '0.5px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ height: '140px', background: project.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {project.emoji}
                  </div>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: '#666', padding: '3px 8px', borderRadius: '20px' }}>demo</span>
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 6px' }}>{project.title}</p>
                <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>{project.description}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {project.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '10px', background: '#f5f5f5', color: '#888', padding: '2px 8px', borderRadius: '20px' }}>{tag}</span>
                  ))}
                </div>
                <Link href={`/projects/${project.slug}`} style={{ fontSize: '12px', color: '#111', textDecoration: 'none', fontWeight: '500' }}>
                  View demo →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ padding: '2rem', borderTop: '0.5px solid #e5e5e5', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#aaa', margin: '0' }}>© 2026 hegli.dev</p>
      </footer>
    </main>
  )
}