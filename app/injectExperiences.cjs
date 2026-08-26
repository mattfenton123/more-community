const fs = require('fs');

// 1. Dashboard
let dashboard = fs.readFileSync('app/dashboard/page.jsx', 'utf8');
dashboard = dashboard.replace('checkInMember, broadcastNotification\n  } = useAppContext();', 'checkInMember, broadcastNotification, experiences\n  } = useAppContext();');
dashboard = dashboard.replace(
  `<button onClick={() => setActiveTab('sponsors')} style={{ padding: '12px 16px', background: 'transparent', border: 'none', color: activeTab === 'sponsors' ? 'white' : 'var(--slate-400)', borderBottom: activeTab === 'sponsors' ? '2px solid var(--teal-400)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>Sponsors</button>\n          </div>`,
  `<button onClick={() => setActiveTab('sponsors')} style={{ padding: '12px 16px', background: 'transparent', border: 'none', color: activeTab === 'sponsors' ? 'white' : 'var(--slate-400)', borderBottom: activeTab === 'sponsors' ? '2px solid var(--teal-400)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>Sponsors</button>
            <button onClick={() => setActiveTab('experiences')} style={{ padding: '12px 16px', background: 'transparent', border: 'none', color: activeTab === 'experiences' ? 'white' : 'var(--slate-400)', borderBottom: activeTab === 'experiences' ? '2px solid var(--teal-400)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16}/> Experiences</button>
          </div>`
);

const experiencesDashboardBlock = `
          {/* ===== EXPERIENCES MARKETPLACE TAB ===== */}
          {activeTab === 'experiences' && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'white', fontFamily: 'var(--font-heading)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe color="var(--teal-400)" /> Trips & Retreats Marketplace
                  </h2>
                  <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.95rem' }}>Curate premium, high-margin experiences for your community. Powered by Viator & TourRadar.</p>
                </div>
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
                              <select 
                                onChange={(e) => {
                                  exp.leaderMarkup = parseInt(e.target.value);
                                  toast(\`Markup set to +\${e.target.value}%\`, "success");
                                }}
                                style={{ background: 'var(--slate-800)', color: 'white', border: '1px solid var(--slate-700)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}
                              >
                                <option value="0">0%</option>
                                <option value="10">+10%</option>
                                <option value="15">+15%</option>
                                <option value="20">+20%</option>
                                <option value="30">+30%</option>
                              </select>
                            </div>
                            <button 
                              onClick={() => {
                                exp.promotedBy = community?.id;
                                toast(\`\${exp.title} added to your Community Profile!\`, "success");
                                setActiveTab('overview'); setTimeout(() => setActiveTab('experiences'), 10);
                              }}
                              className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                            >
                              Promote to Community
                            </button>
                          </div>
                        ) : (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: 'rgba(20,184,166,0.1)', padding: '10px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--teal-300)' }}>Selling Price: <strong>£{finalPrice}</strong></span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--teal-300)' }}>Profit: <strong>£{finalPrice - exp.basePrice}</strong></span>
                            </div>
                            <button 
                              onClick={() => {
                                exp.promotedBy = null;
                                toast(\`\${exp.title} removed.\`, "info");
                                setActiveTab('overview'); setTimeout(() => setActiveTab('experiences'), 10);
                              }}
                              className="btn btn-outline" style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                            >
                              Remove
                            </button>
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

// Insert the block before "</div>\n    </div>\n  );\n}"
dashboard = dashboard.replace(/(\s*)(<\/div>\s*<\/div>\s*\)\;\s*\})/s, experiencesDashboardBlock + '$1$2');

fs.writeFileSync('app/dashboard/page.jsx', dashboard);

// 2. Community Profile
let community = fs.readFileSync('app/community/[id]/page.jsx', 'utf8');

// Add Globe icon
community = community.replace(
  `import { ChevronLeft, Share2, Users, Calendar, Settings, ChevronDown, ChevronUp, Image as ImageIcon, ExternalLink, Camera, Mail, Activity, Sparkles, MapPin, Clock, Star, MessageCircle, Heart, BadgeCheck } from 'lucide-react';`,
  `import { ChevronLeft, Share2, Users, Calendar, Settings, ChevronDown, ChevronUp, Image as ImageIcon, ExternalLink, Camera, Mail, Activity, Sparkles, MapPin, Clock, Star, MessageCircle, Heart, BadgeCheck, Globe } from 'lucide-react';`
);

// Add experiences to context
community = community.replace(
  `const { communities, user, joinCommunity, leaveCommunity, events, isLoading, users, communityMemberships, eventRsvps, feedPosts, createFeedPost, likeFeedPost, uploadImage } = useAppContext();`,
  `const { communities, user, joinCommunity, leaveCommunity, events, isLoading, users, communityMemberships, eventRsvps, feedPosts, createFeedPost, likeFeedPost, uploadImage, experiences } = useAppContext();`
);

// Inject block before Reviews
const experiencesCommunityBlock = `
            {/* Promoted Experiences (Marketplace) */}
            {experiences && experiences.filter(exp => exp.promotedBy === community.id).length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="var(--teal-400)" /> Trips & Retreats
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {experiences.filter(exp => exp.promotedBy === community.id).map(exp => {
                    const finalPrice = exp.basePrice + Math.round(exp.basePrice * ((exp.leaderMarkup || 0) / 100));
                    return (
                      <div key={exp.id} onClick={() => navigate(\`/checkout/experience/\${exp.id}\`)} className="interactive-press" style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer' }}>
                        <div style={{ width: '100px', flexShrink: 0 }}>
                          <img src={exp.image} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '12px', flex: 1 }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{exp.category}</div>
                          <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem', marginBottom: '4px' }}>{exp.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}><Clock size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> {exp.duration}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>£{finalPrice}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
`;

community = community.replace(`            {/* Reviews */}`, experiencesCommunityBlock + `\n            {/* Reviews */}`);

fs.writeFileSync('app/community/[id]/page.jsx', community);

console.log('Injection successful');
