"use client";
import { useState, useRef } from 'react';
import { useRouter as useNavigate, useParams } from 'next/navigation';
import { useAppContext } from '../../../src/context/AppContext';
import { useChat } from '../../../src/context/ChatContext';
import { useAuth } from '../../../src/context/AuthContext';
import { ArrowLeft, Users, Calendar, MapPin, Settings, Camera, Check, X, MessageCircle, Edit3, Trophy, Flame, Plus, Compass, Star, LogOut, ChevronRight, Shield, BarChart2 } from 'lucide-react';
import { useToast } from '../../../src/components/Toast';
import GamificationPanel, { BadgeRow, useGamification } from '../../../src/components/Gamification';
import { FALLBACK_IMAGES } from '../../../src/lib/constants';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, communities, communityMemberships, user: currentUser, updateUser, uploadImage, events, eventRsvps } = useAppContext();
  const { messages } = useChat();
  const { signOut } = useAuth();
  const { toast } = useToast();
  
  const targetId = id || currentUser.id;
  const profileUser = users.find(u => u.id === targetId) || currentUser;
  const isOwnProfile = targetId === currentUser.id;
  const { level, streak, earnedBadges, xp } = useGamification(targetId);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: profileUser.name, bio: profileUser.bio || '' });
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('badges');
  const fileInputRef = useRef(null);

  if (!profileUser) {
    return <div style={{ padding: '40px', color: 'var(--white)', textAlign: 'center' }}>User not found.</div>;
  }

  const joinedCommunityIds = [];
  Object.keys(communityMemberships).forEach(commId => {
    if (communityMemberships[commId].some(m => m.userId === targetId)) joinedCommunityIds.push(commId);
  });
  const joinedCommunities = communities.filter(c => joinedCommunityIds.includes(c.id));

  // Compute stats
  let eventsAttended = 0;
  Object.values(eventRsvps).forEach(rsvps => {
    if (rsvps.some(r => r.userId === targetId && r.status === 'going')) eventsAttended++;
  });
  const messagesSent = messages.filter(m => m.authorId === targetId).length;

  const handleAvatarClick = () => { if (isOwnProfile && isEditing) fileInputRef.current?.click(); };
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(file, 'avatars');
      await updateUser(targetId, { avatar: publicUrl });
      toast.success('Avatar updated!');
    } catch (err) { toast.error('Upload failed'); }
    finally { setIsUploading(false); }
  };
  const handleSave = async () => {
    try {
      await updateUser(targetId, { name: editForm.name, bio: editForm.bio });
      setIsEditing(false);
      toast.success('Profile saved');
    } catch (err) { toast.error('Failed to save profile'); }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate.push('/login');
    } catch (err) {
      toast.error('Sign out failed');
    }
  };

  // Quick action items for own profile
  const quickActions = [
    ...(currentUser.isAdmin ? [{ icon: Shield, label: 'Admin Hub', desc: 'Platform management', color: '#ef4444', href: '/admin' }] : []),
    ...(currentUser.leaderOf ? 
      [{ icon: BarChart2, label: 'Leader Dashboard', desc: 'Manage your communities', color: '#8b5cf6', href: '/dashboard' }] :
      [{ icon: Plus, label: 'Start a Community', desc: 'Create and lead your own group', color: '#8b5cf6', href: '/dashboard' }]
    ),
    { icon: Compass, label: 'Discover Communities', desc: 'Find groups near you', color: 'var(--teal-500)', href: '/discover' },
    { icon: Calendar, label: 'Browse Events', desc: 'See what\'s happening locally', color: '#3b82f6', href: '/events' },
    { icon: Star, label: 'Leaderboard', desc: 'See top community members', color: '#f59e0b', href: '/leaderboard' },
    { icon: Settings, label: 'Settings', desc: 'Account preferences', color: 'var(--slate-400)', href: '/settings' },
  ];

  return (
    <div className="view-profile" style={{ paddingBottom: '80px', overflowY: 'auto', height: '100%', background: 'var(--slate-950)' }}>
      {/* Hero Banner */}
      <div style={{ height: '180px', background: `url(${FALLBACK_IMAGES.general})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), var(--slate-950))' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
          <button className="interactive-press" onClick={() => navigate.push('/')} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: 'none', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isOwnProfile && (
              <button className="interactive-press" onClick={() => navigate.push(`/chat/dm/${targetId}`)} style={{ height: '40px', padding: '0 16px', borderRadius: '20px', background: 'var(--teal-500)', border: 'none', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <MessageCircle size={18} /> Message
              </button>
            )}
            {isOwnProfile && !isEditing && (
              <>
                <button className="interactive-press" onClick={() => setIsEditing(true)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(236,72,153,0.2)', border: '1px solid rgba(236,72,153,0.4)', backdropFilter: 'blur(10px)', color: 'var(--pink-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Edit3 size={20} />
                </button>
                <button className="interactive-press" onClick={() => navigate.push('/settings')} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)', backdropFilter: 'blur(10px)', color: 'var(--teal-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Settings size={20} />
                </button>
              </>
            )}
            {isOwnProfile && isEditing && (
              <>
                <button className="interactive-press" onClick={() => setIsEditing(false)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--red-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
                <button className="interactive-press" onClick={handleSave} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(20,184,166,0.9)', border: 'none', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Check size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginTop: '-60px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', marginBottom: '12px', cursor: isEditing ? 'pointer' : 'default' }} onClick={handleAvatarClick} className={isEditing ? 'interactive-hover' : ''}>
            <img src={profileUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name)}&background=0D8B93&color=fff`} alt={profileUser.name} style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--slate-950)', background: 'var(--slate-800)', opacity: isUploading ? 0.5 : 1 }} />
            {isEditing && <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)' }}><Camera size={28} /></div>}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            {/* Level Badge */}
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--slate-950)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--white)' }}>{level}</span>
            </div>
          </div>
          
          {isEditing ? (
            <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input" placeholder="Your Name" style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }} />
              <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="input" placeholder="Write a short bio..." style={{ textAlign: 'center', minHeight: '80px', resize: 'none' }} />
            </div>
          ) : (
            <>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: 'var(--white)' }}>{profileUser.name}</h1>
              
              {/* Level + XP + Streak row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '99px' }}>
                  <Trophy size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} /> Level {level} • {xp} XP
                </span>
                {streak > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: '99px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Flame size={11} style={{ marginRight: '2px', verticalAlign: 'middle' }} /> {streak}w streak
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-500)', fontSize: '0.8rem', marginBottom: '10px' }}>
                <Calendar size={12} /> Member since {profileUser.joined && !isNaN(new Date(profileUser.joined).getTime()) ? new Date(profileUser.joined).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'June 2025'}
              </div>

              <p style={{ margin: '0 0 12px 0', color: 'var(--slate-300)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '400px' }}>
                {profileUser.bio || "No bio yet."}
              </p>

              {/* Badge Row */}
              <BadgeRow userId={targetId} maxShow={6} />
              
              {/* Interests */}
              {profileUser.interests && profileUser.interests.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
                  {profileUser.interests.map(interest => (
                    <span key={interest} style={{ fontSize: '0.75rem', background: 'rgba(20,184,166,0.1)', color: 'var(--teal-300)', padding: '3px 10px', borderRadius: '99px', border: '1px solid rgba(20,184,166,0.2)' }}>{interest}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b82f6' }}>{joinedCommunities.length}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>Communities</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--teal-400)' }}>{eventsAttended}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>Events</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#22c55e' }}>{earnedBadges.length}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>Badges</div>
          </div>
        </div>

        {/* Quick Actions (own profile only) */}
        {isOwnProfile && !isEditing && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              {quickActions.map((action, i) => (
                <button
                  key={action.label}
                  onClick={() => navigate.push(action.href)}
                  className="interactive-press"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                    background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: i < quickActions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <action.icon size={18} color={action.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>{action.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>{action.desc}</div>
                  </div>
                  <ChevronRight size={16} color="var(--slate-600)" />
                </button>
              ))}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="interactive-press"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LogOut size={18} color="#ef4444" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.9rem' }}>Sign Out</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>Log out of your account</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '3px' }}>
          {['badges', 'communities'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              background: activeTab === tab ? 'rgba(20,184,166,0.15)' : 'transparent',
              color: activeTab === tab ? 'var(--teal-300)' : 'var(--slate-400)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize'
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Badges Tab */}
        {activeTab === 'badges' && <GamificationPanel userId={targetId} />}

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div style={{ marginBottom: '24px' }}>
            {joinedCommunities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>Not a member of any communities yet.</p>
                <button onClick={() => navigate.push('/discover')} className="btn btn-primary interactive-press" style={{ borderRadius: '99px' }}>
                  Discover Communities
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {joinedCommunities.map(comm => (
                  <div key={comm.id} onClick={() => navigate.push(`/community/${comm.id}`)} className="interactive-press" style={{ position: 'relative', height: '120px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: '100px', background: 'var(--slate-800)' }}>
                      <img src={comm.image || FALLBACK_IMAGES.community} alt={comm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.85rem', lineHeight: 1.2 }}>{comm.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
