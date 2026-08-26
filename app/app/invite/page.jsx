"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { MapPin, Users, HeartPulse, ArrowRight } from 'lucide-react';
import { FALLBACK_IMAGES } from '../../src/lib/constants';

export default function InvitePageWrapper() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-950)', color: 'var(--teal-400)' }}>Loading...</div>}>
      <InvitePage />
    </Suspense>
  );
}

function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  
  const { prescribingLinks, communities } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState(null);
  const [community, setCommunity] = useState(null);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    const link = prescribingLinks.find(l => l.id === code);
    if (link) {
      setPrescription(link);
      // Determine target community. For demo, default to a specific one if not specified
      const targetCommunityId = link.communityId || 'tw-tech-meetup';
      const foundCommunity = communities.find(c => c.id === targetCommunityId);
      setCommunity(foundCommunity);
    }
    setLoading(false);
  }, [code, prescribingLinks, communities]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-950)' }}>
        <div style={{ color: 'var(--teal-400)' }}>Loading prescription details...</div>
      </div>
    );
  }

  if (!prescription || !community) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-950)', color: 'white', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <HeartPulse size={32} color="#f43f5e" />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', marginBottom: '16px' }}>Invalid or Expired Link</h1>
        <p style={{ color: 'var(--slate-400)', maxWidth: '400px', lineHeight: 1.6 }}>We couldn't find a social prescription matching this link. Please check with your healthcare provider or link worker.</p>
        <button onClick={() => router.push('/')} className="btn btn-primary" style={{ marginTop: '32px', padding: '12px 24px' }}>
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-950)', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: `url(${community.image || FALLBACK_IMAGES.walking})`,
        backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.8) 50%, rgba(2,6,23,1) 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px 32px', backdropFilter: 'blur(12px)', width: '100%', marginTop: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', padding: '6px 16px', borderRadius: '20px', color: 'var(--teal-300)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '24px' }}>
            <HeartPulse size={16} /> NHS Social Prescription
          </div>
          
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0', lineHeight: 1.2 }}>
            You've been invited to join <span style={{ color: 'var(--teal-400)' }}>{community.name}</span>
          </h1>
          
          <p style={{ color: 'var(--slate-300)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Your healthcare provider recommends this community group as part of your wellbeing plan: <strong>{prescription.name}</strong>.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
              <MapPin size={16} color="var(--teal-400)" /> Tunbridge Wells
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
              <Users size={16} color="var(--teal-400)" /> {community.members || 1} members
            </div>
          </div>

          <button 
            onClick={() => router.push('/login')}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            Claim Prescription & Join <ArrowRight size={20} />
          </button>
          
          <p style={{ color: 'var(--slate-500)', fontSize: '0.8rem', marginTop: '16px' }}>
            By joining, you agree to our terms. It's completely free and you can leave at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
