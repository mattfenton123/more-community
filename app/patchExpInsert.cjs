const fs = require('fs');
let lines = fs.readFileSync('app/dashboard/page.jsx', 'utf8').split('\n');

// Find the Social Hub comment
const socialIdx = lines.findIndex(l => l.includes('TAB: SOCIAL HUB'));
if (socialIdx < 0) { console.error('Cannot find SOCIAL HUB marker'); process.exit(1); }

// The experiences tab content to insert
const expContent = `
          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: EXPERIENCES MARKETPLACE                          */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'experiences' && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', margin: '0 20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'white', fontFamily: 'var(--font-heading)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe color="var(--teal-400)" /> Trips & Retreats Marketplace
                  </h2>
                  <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.95rem' }}>Curate premium, high-margin experiences for your community. Powered by Viator & TourRadar.</p>
                </div>
                <button onClick={() => setIsDiscoveryModalOpen(true)} className="btn btn-primary interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px' }}>
                  <Search size={16} /> Discover via API
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {experiences.map(exp => {
                  const isPromoted = exp.promotedBy === community?.id;
                  const finalPrice = exp.basePrice + Math.round(exp.basePrice * ((exp.leaderMarkup || 0) / 100));
                  return (
                    <div key={exp.id} style={{ background: 'rgba(255,255,255,0.03)', border: isPromoted ? '2px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ position: 'relative', height: '140px' }}>
                        <img src={exp.image} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: 'white', backdropFilter: 'blur(4px)' }}>
                          £{exp.basePrice} base
                        </div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{exp.category}</div>
                        <h4 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.05rem', lineHeight: 1.3 }}>{exp.title}</h4>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '16px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {exp.duration}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} color="#fbbf24" /> {exp.rating}</span>
                        </div>
                        {!isPromoted ? (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--slate-300)' }}>Your Markup:</span>
                              <select onChange={(e) => { exp.leaderMarkup = parseInt(e.target.value); toast(\\\`Markup set to +\\\${e.target.value}%\\\`, "success"); }}
                                style={{ background: 'var(--slate-800)', color: 'white', border: '1px solid var(--slate-700)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                <option value="0">0%</option><option value="10">+10%</option><option value="15">+15%</option><option value="20">+20%</option><option value="30">+30%</option>
                              </select>
                            </div>
                            <button onClick={() => { exp.promotedBy = community?.id; toast(\\\`\\\${exp.title} added!\\\`, "success"); setActiveTab('overview'); setTimeout(() => setActiveTab('experiences'), 10); }}
                              className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}>Promote to Community</button>
                          </div>
                        ) : (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: 'rgba(20,184,166,0.1)', padding: '10px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--teal-300)' }}>Selling: <strong>£{finalPrice}</strong></span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--teal-300)' }}>Profit: <strong>£{finalPrice - exp.basePrice}</strong></span>
                            </div>
                            <button onClick={() => { exp.promotedBy = null; toast(\\\`\\\${exp.title} removed.\\\`, "info"); setActiveTab('overview'); setTimeout(() => setActiveTab('experiences'), 10); }}
                              className="btn btn-outline" style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}>Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
`;

// Insert before the Social Hub marker line (which is preceded by a ══ line)
// socialIdx points to TAB: SOCIAL HUB, socialIdx-1 is ══, socialIdx-2 might be blank
const insertAt = socialIdx - 1; // before the ══ line
const expLines = expContent.split('\n');
lines.splice(insertAt, 0, ...expLines);

fs.writeFileSync('app/dashboard/page.jsx', lines.join('\n'), 'utf8');
console.log('✅ Experiences tab inserted at line ' + insertAt);
