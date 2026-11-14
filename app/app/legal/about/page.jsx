"use client";
import AppHeader from '../../../src/components/AppHeader';

export default function AboutPage() {
  return (
    <div className="view-legal" style={{ minHeight: '100dvh' }}>
      <AppHeader title="About More Community" showBack={true} />
      
      <div style={{ padding: '24px 20px', color: 'var(--slate-300)', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ padding: '18px 28px', background: 'rgba(20,184,166,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="More Community" className="theme-invert" style={{ height: '32px', display: 'block' }} />
          </div>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--white)', fontSize: '1.5rem', marginBottom: '16px', textAlign: 'center' }}>
          Welcome to More Community.
        </h2>
        
        <p style={{ marginBottom: '16px' }}>
          <strong>More Community</strong> is an independent community platform designed to bring people together in real life. We believe that local communities, shared interests, and face-to-face interactions are the foundation of a healthy, happy society.
        </p>

        <p style={{ marginBottom: '16px' }}>
          Built with ❤️ in Tunbridge Wells, we aim to provide community leaders with the best tools to manage, grow, and monetize their local groups without relying on algorithms or intrusive ads.
        </p>

        <h3 style={{ color: 'var(--white)', marginTop: '24px', marginBottom: '12px' }}>Our Mission</h3>
        <p style={{ marginBottom: '16px' }}>
          To empower local organizers and connect individuals through shared experiences. Whether it's a running club, a pottery workshop, or a tech meetup, we want to help you find your people.
        </p>

        <h3 style={{ color: 'var(--white)', marginTop: '24px', marginBottom: '12px' }}>Get in Touch</h3>
        <p style={{ marginBottom: '16px' }}>
          If you are interested in starting a community, or if you have any feedback on the app, please reach out to us at <strong>hello@morecommunity.co.uk</strong>.
        </p>
        
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          <p>Version 1.0.0</p>
          <p>© 2026 More Community Ltd.</p>
        </div>
      </div>
    </div>
  );
}
