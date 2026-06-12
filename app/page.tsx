import Link from 'next/link'


export default function Home() {
  return (
    <main>

      <section style={{
        minHeight: '100vh',
        background: '#111',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem',
      }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', margin: '0', color: '#fff' }}>hegli.dev</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#about" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>about</a>
            <a href="#contact" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>contact</a>
          </div>
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '64px', fontWeight: '500', margin: '0', color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>hegli.dev</p>
          <p style={{ fontSize: '15px', color: '#888', margin: '16px 0 0' }}>developer · dillydallyer · player 1</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <a href="#about" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>scroll down ↓</a>
        </div>
      </section>

      <section id="about" style={{
        padding: '5rem 2rem',
        maxWidth: '680px',
        margin: '0 auto',
      }}>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>About</p>
        <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 16px', lineHeight: 1.4 }}>Hey, I'm Henry — a developer based in Auckland, NZ.</p>
        <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.8, margin: '0' }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>
      </section>

      <section id="contact" style={{
        padding: '5rem 2rem',
        maxWidth: '680px',
        margin: '0 auto',
        borderTop: '0.5px solid #e5e5e5',
      }}>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</p>
        <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 24px', lineHeight: 1.4 }}>Get in touch</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          
            <a href="https://github.com/nubstr3"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              border: '0.5px solid #e5e5e5',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              color: '#111',
            }}
          >
            GitHub
          </a>
          
            <a href="https://linkedin.com/in/henry-li-981280224"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              border: '0.5px solid #e5e5e5',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              color: '#111',
            }}
          >
            LinkedIn
          </a>
        </div>
      </section>

      <footer
        style={{
          padding: '2rem',
          borderTop: '0.5px solid #e5e5e5',
          textAlign: 'center',
        }}
      >
        <Link
          href="/login"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'default',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#aaa',
              margin: '0',
            }}
          >
            © {new Date().getFullYear()} hegli.dev
          </p>
        </Link>
</footer>

    </main>
  )
}