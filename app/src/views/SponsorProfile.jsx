import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, MapPin, Target, Users, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function SponsorProfile() {
  const router = useRouter();
  const { id } = useParams();
  const { sponsors, sponsorshipAssignments, communities } = useAppContext();
  
  const sponsor = sponsors.find(s => s.id === id);
  
  if (!sponsor) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--white)' }}>Sponsor not found</div>;
  }

  // Find communities they sponsor
  const sponsoredCommunities = sponsorshipAssignments
    .filter(a => a.sponsor_id === id && a.target_type === 'community')
    .map(a => communities.find(c => c.id === a.target_id))
    .filter(Boolean);

  const isRegionalSponsor = sponsorshipAssignments.some(a => a.sponsor_id === id && a.target_type === 'region');

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100dvh', background: 'var(--slate-950)' }}>
      {/* Header / Hero */}
      <div style={{ position: 'relative', height: '260px' }}>
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: `url(${sponsor.heroImage || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80'})`, 
          backgroundSize: 'cover', backgroundPosition: 'center' 
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.95) 100%)' }}></div>
        </div>
        
        <button 
          onClick={() => router.back()}
          className="interactive-press"
          style={{ position: 'absolute', top: '20px', left: '20px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', zIndex: 10 }}
        >
          <ArrowLeft size={20} />
        </button>

        {sponsor.tier === 'Headline' && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.5)', color: '#fde047', fontSize: '0.75rem', fontWeight: 800, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} /> HEADLINE SPONSOR
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid var(--slate-900)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <img src={sponsor.logo} alt={sponsor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, paddingBottom: '4px' }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: 800, color: 'var(--white)' }}>{sponsor.name}</h1>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--slate-300)' }}>
              {sponsor.industry && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Target size={14} /> {sponsor.industry}</span>}
              {sponsor.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {sponsor.location}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* About */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--white)' }}>About {sponsor.name}</h3>
          <p style={{ color: 'var(--slate-300)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            {sponsor.bio}
          </p>
          {sponsor.url && (
            <a href={sponsor.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--teal-400)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', marginTop: '12px' }}>
              Visit Website <ExternalLink size={16} />
            </a>
          )}
        </div>

        {/* Community Commitment */}
        <div style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--teal-400)' }}>
            <ShieldCheck size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Community Commitment</h3>
          </div>
          <p style={{ color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            {sponsor.communitySupportStatement}
          </p>
        </div>

        {/* Supported Communities */}
        {sponsoredCommunities.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--teal-500)" /> Communities Supported
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sponsoredCommunities.map(c => (
                <div key={c.id} onClick={() => router.push(`/community/${c.id}`)} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', cursor: 'pointer' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--white)' }}>{c.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{c.metrics?.members || 0} members</span>
                  </div>
                  <div style={{ padding: '6px 12px', background: 'var(--slate-800)', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--teal-400)' }}>
                    View
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isRegionalSponsor && (
           <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '20px' }}>
             <CheckCircle2 size={32} color="#eab308" style={{ margin: '0 auto 12px' }} />
             <h4 style={{ margin: '0 0 8px 0', color: '#fef08a', fontSize: '1.1rem' }}>Regional Headline Sponsor</h4>
             <p style={{ margin: 0, color: 'var(--slate-300)', fontSize: '0.9rem', lineHeight: 1.5 }}>
               {sponsor.name} is a cornerstone supporter of the Tunbridge Wells region, helping keep more. accessible to everyone.
             </p>
           </div>
        )}
      </div>
    </div>
  );
}
