"use client";
import { useState, useRef } from 'react';
import { Share2, Image as ImageIcon, Send, Activity, Users, Settings, Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { FALLBACK_IMAGES } from '../lib/constants';

export default function SocialHub({ communityId }) {
  const { connectedSocialAccounts, setConnectedSocialAccounts, createPost, uploadImage, broadcastHistory, feedPosts } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('composer'); // composer, calendar, accounts
  
  // Composer State
  const [postText, setPostText] = useState('');
  const [postMedia, setPostMedia] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [destinations, setDestinations] = useState({
    app: true,
    instagram: connectedSocialAccounts?.instagram?.connected || false,
    facebook: connectedSocialAccounts?.facebook?.connected || false,
    x: connectedSocialAccounts?.x?.connected || false,
    linkedin: connectedSocialAccounts?.linkedin?.connected || false
  });
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!postText.trim() && !postMedia) {
      toast.error('Cannot post empty content', 'Please add text or an image.');
      return;
    }
    const selectedDests = Object.keys(destinations).filter(k => destinations[k]);
    if (selectedDests.length === 0) {
      toast.error('No destinations selected', 'Please select at least one platform.');
      return;
    }

    setIsPosting(true);
    try {
      const result = await createPost(communityId, postText, postMedia, destinations);
      const extCount = result?.socialCount || 0;
      if (extCount > 0) {
        toast.success(
          'Broadcast Published!',
          `Live on Community Feed & sent to members! (${result.selectedSocials.join(', ')} queued in demo mode)`
        );
      } else {
        toast.success('Broadcast Published!', 'Published to Community Feed and sent to all members.');
      }
      setPostText('');
      setPostMedia(null);
      setActiveTab('calendar');
    } catch (err) {
      console.error(err);
      toast.error('Broadcast failed', err.message || 'There was an issue pushing the broadcast.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleAccount = (platform) => {
    setConnectedSocialAccounts(prev => ({
      ...prev,
      [platform]: { ...prev[platform], connected: !prev[platform].connected }
    }));
    if (connectedSocialAccounts[platform].connected) {
      setDestinations(prev => ({ ...prev, [platform]: false }));
      toast.info(`Disconnected ${platform}`);
    } else {
      setDestinations(prev => ({ ...prev, [platform]: true }));
      toast.success(`Connected ${platform}`);
    }
  };

  // Compile real community broadcasts from history and feed announcement posts
  const communityBroadcasts = [
    ...(broadcastHistory || []).filter(b => b.communityId === communityId),
    ...(feedPosts || [])
      .filter(p => p.communityId === communityId && (p.is_announcement || p.isAnnouncement))
      .filter(p => !(broadcastHistory || []).some(b => b.id === p.id))
      .map(p => ({
        id: p.id,
        communityId: p.communityId,
        text: p.text || p.content,
        media: p.media || p.media_url,
        destinations: { app: true },
        syndicatedTo: [],
        timestamp: p.timestamp || p.createdAt || p.created_at || new Date().toISOString(),
        status: 'published'
      }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Social Hub Header / Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '16px' }}>
        {['composer', 'calendar', 'accounts'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none',
              background: activeTab === tab ? 'var(--slate-800)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--slate-400)',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'capitalize',
              transition: 'all 0.2s', boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'composer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Main Composer Area */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={20} color="var(--teal-400)" /> Omnichannel Broadcaster
            </h3>
            
            {/* Platform Selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '8px', fontWeight: 600 }}>POST TO</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <PlatformToggle 
                  name="App Internal" 
                  active={destinations.app} 
                  onChange={() => setDestinations(p => ({ ...p, app: !p.app }))} 
                  color="var(--teal-500)" 
                />
                {Object.keys(connectedSocialAccounts).map(platform => {
                  if (!connectedSocialAccounts[platform].connected) return null;
                  return (
                    <PlatformToggle 
                      key={platform}
                      name={platform} 
                      active={destinations[platform]} 
                      onChange={() => setDestinations(p => ({ ...p, [platform]: !p[platform] }))} 
                      color={getPlatformColor(platform)} 
                    />
                  );
                })}
              </div>
            </div>

            {/* Text Area */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <textarea 
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="What's happening in your community?"
                style={{
                  width: '100%', minHeight: '140px', background: 'var(--slate-900)', border: '1px solid var(--slate-700)',
                  borderRadius: '16px', padding: '16px', color: 'var(--white)', fontSize: '1.05rem', resize: 'vertical',
                  fontFamily: 'inherit', transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal-400)'}
                onBlur={e => e.target.style.borderColor = 'var(--slate-700)'}
              />
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '0.8rem', color: postText.length > 280 ? 'var(--red-400)' : 'var(--slate-500)' }}>
                {postText.length}
              </div>
            </div>

            {/* Media Preview */}
            {postMedia && (
              <div style={{ position: 'relative', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--slate-700)' }}>
                <img src={postMedia} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                <button 
                  onClick={() => setPostMedia(null)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'var(--white)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploading(true);
                  try {
                    toast.info('Uploading media...', 'Please wait');
                    const url = await uploadImage(file);
                    setPostMedia(url);
                    toast.success('Media uploaded!');
                  } catch (err) {
                    toast.error('Upload failed', err.message || 'Could not upload media');
                  } finally {
                    setIsUploading(false);
                    if (e.target) e.target.value = '';
                  }
                }}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="interactive-press"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isUploading ? 0.6 : 1 }}
              >
                <ImageIcon size={18} /> {isUploading ? 'Uploading...' : 'Add Media'}
              </button>
              
              <button 
                onClick={handlePost}
                disabled={isPosting || isUploading || (!postText.trim() && !postMedia)}
                className="btn btn-primary interactive-press"
                style={{ padding: '12px 32px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', opacity: (isPosting || isUploading || (!postText.trim() && !postMedia)) ? 0.5 : 1 }}
              >
                {isPosting ? <span className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }}></span> : <Send size={18} />}
                {isPosting ? 'Broadcasting...' : 'Post Now'}
              </button>
            </div>
          </div>
          
          {/* Real-time Preview Card */}
          <div style={{ background: 'var(--slate-900)', border: '1px dashed var(--slate-700)', borderRadius: '24px', padding: '24px', opacity: (postText || postMedia) ? 1 : 0.5, transition: 'opacity 0.3s' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} /> LIVE PREVIEW (Internal App)
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--teal-500)' }}></div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>You (Leader)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Just now</div>
                </div>
              </div>
              <div style={{ color: 'var(--slate-200)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {postText || "Your text will appear here..."}
              </div>
              {postMedia && (
                <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={postMedia} alt="Preview" style={{ width: '100%' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--white)' }}>Content & Broadcast History</h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>View your announcements syndicated across the app and connected channels.</p>
          </div>
          
          <div style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.2)', padding: '14px 16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <CheckCircle2 color="var(--teal-400)" size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.9rem' }}>Community Syndication Engine Active</div>
              <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>Announcements automatically push to your Community Feed and dispatch in-app push alerts to members.</div>
            </div>
          </div>
          
          {communityBroadcasts.length === 0 ? (
            <div style={{ color: 'var(--slate-400)', textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Share2 size={32} style={{ color: 'var(--slate-600)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, color: 'var(--slate-300)', fontSize: '0.95rem' }}>No broadcasts published yet</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>Compose your first announcement above to syndicate it to your members.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {communityBroadcasts.map((item, idx) => (
                <div key={item.id || idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '99px', background: 'rgba(20,184,166,0.15)', color: 'var(--teal-300)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Published
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(20,184,166,0.1)', color: 'var(--teal-300)', border: '1px solid rgba(20,184,166,0.2)' }}>
                        App Feed
                      </span>
                      {item.syndicatedTo && item.syndicatedTo.map(soc => (
                        <span key={soc} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: `${getPlatformColor(soc)}15`, color: getPlatformColor(soc), border: `1px solid ${getPlatformColor(soc)}30`, textTransform: 'capitalize' }}>
                          {soc}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ color: 'var(--slate-200)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {item.text}
                  </div>
                  {item.media && (
                    <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', maxHeight: '180px', maxWidth: '320px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={item.media} alt="Broadcast attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ color: 'var(--white)', margin: '0 0 6px 0' }}>Connected Accounts</h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>Link your social media to broadcast updates seamlessly.</p>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertCircle size={18} color="var(--blue-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
              <strong style={{ color: 'white' }}>Live vs External Accounts:</strong> Internal app broadcast to your Community Feed and in-app member notifications is <strong>100% live</strong>. External social networks (Instagram, Facebook, X, LinkedIn) run in demonstration mode until official developer API keys (Meta Graph & X API) are integrated.
            </div>
          </div>
          
          {Object.keys(connectedSocialAccounts).map(platform => {
            const acc = connectedSocialAccounts[platform];
            const color = getPlatformColor(platform);
            return (
              <div key={platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: `1px solid ${acc.connected ? color + '40' : 'rgba(255,255,255,0.05)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: acc.connected ? color : 'var(--slate-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontSize: '1.2rem', fontWeight: 800, textTransform: 'capitalize' }}>
                    {platform[0]}
                  </div>
                  <div>
                    <div style={{ color: 'var(--white)', fontWeight: 600, textTransform: 'capitalize', fontSize: '1.1rem' }}>{platform}</div>
                    <div style={{ color: acc.connected ? 'var(--teal-400)' : 'var(--slate-500)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {acc.connected ? <><CheckCircle2 size={14} /> {acc.handle}</> : 'Not connected'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleAccount(platform)}
                  className={`btn ${acc.connected ? 'btn-outline' : 'btn-primary'} interactive-press`}
                  style={{ padding: '10px 20px', borderRadius: '99px' }}
                >
                  {acc.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlatformToggle({ name, active, onChange, color }) {
  return (
    <button
      onClick={onChange}
      className="interactive-press"
      style={{
        padding: '8px 16px', borderRadius: '99px', border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        background: active ? `${color}20` : 'transparent', color: active ? 'white' : 'var(--slate-400)',
        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? color : 'var(--slate-600)' }}></div>
      <span style={{ textTransform: 'capitalize' }}>{name}</span>
    </button>
  );
}

function getPlatformColor(platform) {
  switch (platform) {
    case 'instagram': return '#E1306C';
    case 'facebook': return '#1877F2';
    case 'x': return '#ffffff';
    case 'linkedin': return '#0A66C2';
    default: return 'var(--teal-500)';
  }
}
