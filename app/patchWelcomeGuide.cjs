const fs = require('fs');
let content = fs.readFileSync('app/dashboard/page.jsx', 'utf8');

// Add showWelcomeGuide state
content = content.replace(
  "const [isGenerating, setIsGenerating] = useState(false);",
  "const [isGenerating, setIsGenerating] = useState(false);\n  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);"
);

// Insert the welcome guide right after the overview tab opens, before the stats grid
const welcomeGuide = `
              {/* Leader Welcome Guide - shows for new communities */}
              {showWelcomeGuide && communityEvents.length === 0 && (
                <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(139,92,246,0.08))',
                    border: '1px solid rgba(20,184,166,0.2)',
                    borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden'
                  }}>
                    {/* Dismiss */}
                    <button onClick={() => setShowWelcomeGuide(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    
                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🚀</div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'white', margin: '0 0 6px 0' }}>Welcome to your Dashboard!</h2>
                    <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                      This is your command centre for managing <strong style={{ color: 'var(--teal-300)' }}>{community?.name}</strong>. Here's how to get started:
                    </p>

                    {/* Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {[
                        { num: '1', icon: '📅', title: 'Create your first event', desc: 'Host a walk, meetup, or workshop. You can use AI to generate event details instantly.', action: () => { openEventWizard(); setShowWelcomeGuide(false); }, btn: 'Create Event' },
                        { num: '2', icon: '📣', title: 'Share your community', desc: 'Share the link or QR code so people can discover and join your community.', action: null, btn: null },
                        { num: '3', icon: '🌍', title: 'Add Viator experiences', desc: 'Curate premium trips & retreats from the Experiences tab and earn commission.', action: () => { setActiveTab('experiences'); setShowWelcomeGuide(false); }, btn: 'Browse Experiences' },
                        { num: '4', icon: '💬', title: 'Set up community chat', desc: 'Your members can message each other in community channels and direct messages.', action: null, btn: null },
                        { num: '5', icon: '💰', title: 'Monetise your community', desc: 'Set ticket prices, subscription fees, and promote paid experiences for revenue.', action: () => { setActiveTab('monetisation'); setShowWelcomeGuide(false); }, btn: 'View Monetisation' },
                      ].map(step => (
                        <div key={step.num} style={{ 
                          display: 'flex', gap: '14px', alignItems: 'flex-start',
                          background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '14px',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0
                          }}>{step.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem', marginBottom: '2px' }}>{step.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>{step.desc}</div>
                            {step.action && (
                              <button 
                                onClick={step.action}
                                className="interactive-press"
                                style={{ marginTop: '8px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', color: 'var(--teal-300)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                              >{step.btn}</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dashboard tour summary */}
                    <div style={{ 
                      background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
                      borderRadius: '12px', padding: '14px', marginBottom: '4px'
                    }}>
                      <div style={{ fontWeight: 600, color: '#c4b5fd', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✨ Dashboard Tabs Overview
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                        <div><strong style={{ color: 'var(--slate-300)' }}>Overview</strong> — Stats & quick actions</div>
                        <div><strong style={{ color: 'var(--slate-300)' }}>Events</strong> — Create & manage events</div>
                        <div><strong style={{ color: 'var(--slate-300)' }}>Monetisation</strong> — Revenue & pricing</div>
                        <div><strong style={{ color: 'var(--slate-300)' }}>Experiences</strong> — Viator marketplace</div>
                        <div><strong style={{ color: 'var(--slate-300)' }}>Social Hub</strong> — Posts & content</div>
                        <div><strong style={{ color: 'var(--slate-300)' }}>CRM</strong> — Member engagement</div>
                        <div><strong style={{ color: 'var(--slate-300)' }}>Members</strong> — Manage & promote</div>
                        <div><strong style={{ color: 'var(--slate-300)' }}>Settings</strong> — Community config</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
`;

// Insert after the overview tab conditional opening
content = content.replace(
  "{activeTab === 'overview' && (\n            <>\n              {/* Stats Grid",
  "{activeTab === 'overview' && (\n            <>" + welcomeGuide + "\n              {/* Stats Grid"
);

fs.writeFileSync('app/dashboard/page.jsx', content, 'utf8');
console.log('✅ Dashboard: Added leader welcome guide');
