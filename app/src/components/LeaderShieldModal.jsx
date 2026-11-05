"use client";
import React, { useState } from 'react';
import { 
  Shield, Check, Crown, Lock, Star, Download, FileText, X, 
  ArrowRight, Sparkles, AlertCircle, Building2, HelpCircle, 
  Award, CheckCircle2, FileCheck, Landmark
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './Toast';
import { LEADER_PRO_CONFIG, generatePliCertificatePdf, generateRamsPdf } from '../lib/insurance';

// Premium Heraldic Shield SVG Component
const ShieldEmblem = ({ isInsured = false, size = 64 }) => (
  <div style={{
    position: 'relative',
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }}>
    {/* Outer Glow Aura */}
    <div style={{
      position: 'absolute',
      inset: -6,
      borderRadius: '50%',
      background: isInsured 
        ? 'radial-gradient(circle, rgba(45,212,191,0.35) 0%, rgba(14,165,233,0.15) 50%, transparent 75%)' 
        : 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(217,119,6,0.15) 50%, transparent 75%)',
      filter: 'blur(8px)',
      zIndex: 0
    }} />

    {/* SVG Crest */}
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 115" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
    >
      <defs>
        {/* Shield Body Gradient */}
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isInsured ? "#14b8a6" : "#f59e0b"} />
          <stop offset="40%" stopColor={isInsured ? "#0f766e" : "#b45309"} />
          <stop offset="100%" stopColor={isInsured ? "#042f2e" : "#451a03"} />
        </linearGradient>

        {/* Shield Rim Gradient */}
        <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="50%" stopColor={isInsured ? "#2dd4bf" : "#fbbf24"} />
          <stop offset="100%" stopColor={isInsured ? "#0d9488" : "#d97706"} />
        </linearGradient>

        {/* Inner Plate Gradient */}
        <linearGradient id="innerPlate" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={isInsured ? "#0f172a" : "#1e1b18"} />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>
      </defs>

      {/* Outer Shield Shell */}
      <path 
        d="M50 4 L90 20 C90 62 68 95 50 110 C32 95 10 62 10 20 Z" 
        fill="url(#shieldGrad)" 
        stroke="url(#rimGrad)" 
        strokeWidth="3.5"
      />

      {/* Inner Recessed Plate */}
      <path 
        d="M50 13 L82 26 C82 60 64 88 50 99 C36 88 18 60 18 26 Z" 
        fill="url(#innerPlate)" 
        stroke="rgba(255,255,255,0.15)" 
        strokeWidth="1.5"
      />

      {/* Decorative Heraldic Cross / Radiance */}
      <path d="M50 20 L50 92" stroke={isInsured ? "rgba(45,212,191,0.25)" : "rgba(245,158,11,0.25)"} strokeWidth="1" strokeDasharray="2 3" />
      <path d="M22 52 L78 52" stroke={isInsured ? "rgba(45,212,191,0.25)" : "rgba(245,158,11,0.25)"} strokeWidth="1" strokeDasharray="2 3" />

      {/* Central Star Crest */}
      <path 
        d="M50 30 L53 38 L62 38 L55 43 L58 51 L50 46 L42 51 L45 43 L38 38 L47 38 Z" 
        fill={isInsured ? "#2dd4bf" : "#fbbf24"}
      />

      {/* Protective Checkmark Emblem */}
      <path 
        d="M38 65 L46 73 L63 56" 
        stroke="#ffffff" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  </div>
);

export default function LeaderShieldModal({ isOpen, onClose, community, leaderUser, onUpgradeSuccess }) {
  const { toast } = useToast();
  const [billingInterval, setBillingInterval] = useState('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !community) return null;

  const isInsured = community.is_insured || community.has_active_shield;
  const policyNumber = community.insurance_policy_number || `MC-PLI-2026-${community.id.slice(0, 6).toUpperCase()}`;
  const price = billingInterval === 'annual' ? LEADER_PRO_CONFIG.annualPrice : LEADER_PRO_CONFIG.monthlyPrice;

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      let authHeader = {};
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) authHeader = { 'Authorization': `Bearer ${session.access_token}` };
      } catch (e) {}

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          type: 'leader_pro',
          communityId: community.id,
          userId: leaderUser?.id || 'leader',
          interval: billingInterval,
          price: price,
          title: `MORE Leader Pro (${billingInterval === 'annual' ? 'Annual' : 'Monthly'})`
        })
      });
      const data = await res.json();

      if (res.ok && data?.url && !data?.simulated) {
        window.location.href = data.url;
        return;
      }

      toast.error('Checkout Error', data?.error || 'Could not initiate checkout session.');
    } catch (err) {
      console.error('Upgrade error:', err);
      toast.error('Upgrade Failed', err.message || 'Could not complete upgrade.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCertificate = () => {
    try {
      generatePliCertificatePdf({
        community,
        leaderName: leaderUser?.name || 'Community Leader',
        policyNumber
      });
      toast.success('Certificate Downloaded', 'Official PLI Certificate PDF saved.');
    } catch (err) {
      console.error('Cert download error:', err);
      toast.error('Download Failed', 'Could not generate certificate.');
    }
  };

  const handleDownloadSampleRams = () => {
    try {
      generateRamsPdf({
        community,
        event: {
          title: `${community.name} Meetup`,
          date: new Date().toISOString().split('T')[0],
          time: '18:30',
          location: community.location_name || 'Tunbridge Wells'
        },
        leaderName: leaderUser?.name || 'Community Leader',
        policyNumber
      });
      toast.success('RAMS Document Downloaded', 'Official Risk Assessment PDF saved.');
    } catch (err) {
      console.error('RAMS download error:', err);
      toast.error('Download Failed', 'Could not generate RAMS.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100000,
      background: 'rgba(5, 10, 20, 0.92)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '94vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0b1120 0%, #060a12 100%)',
          border: '1.5px solid rgba(45, 212, 191, 0.35)',
          borderRadius: '26px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(20, 184, 166, 0.15)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="interactive-press"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--slate-400)',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        {/* Top Header with Heraldic Shield Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '22px' }}>
          <ShieldEmblem isInsured={isInsured} size={64} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.45rem', color: 'var(--white)', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                MORE Leader Shield
              </h2>
              <span style={{
                background: isInsured ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.18)',
                color: isInsured ? '#4ade80' : '#fbbf24',
                border: isInsured ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(245,158,11,0.4)',
                padding: '2px 9px',
                borderRadius: '99px',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}>
                {isInsured ? 'ACTIVE COVER' : 'PRO TIER'}
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.84rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>
              {isInsured 
                ? 'Public Liability Insurance, Council RAMS Packs & 2% Ticket Fees' 
                : 'Built-in ?5M Public Liability Insurance, Council Venue RAMS, Attendee Waivers & 2% Ticket Fees.'}
            </p>
          </div>
        </div>

        {/* Active Policy Status View */}
        {isInsured ? (
          <div>
            {/* Digital Insurance Wallet Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(20, 184, 166, 0.18) 100%)',
              border: '1.5px solid rgba(45, 212, 191, 0.4)',
              borderRadius: '20px',
              padding: '22px',
              marginBottom: '20px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
            }}>
              {/* Metallic Chip & Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--teal-300)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    UK Statutory Group Protection
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                    {community.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                    Policy Holder: {leaderUser?.name || 'Community Leader'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    width: '38px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    marginBottom: '4px',
                    marginLeft: 'auto'
                  }} />
                  <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={12} strokeWidth={3} /> Council Verified
                  </span>
                </div>
              </div>

              {/* Policy Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem', padding: '14px', background: 'rgba(0,0,0,0.35)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <span style={{ color: 'var(--slate-400)', fontSize: '0.7rem', display: 'block' }}>Policy Number</span>
                  <strong style={{ color: 'var(--white)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{policyNumber}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-400)', fontSize: '0.7rem', display: 'block' }}>Indemnity Limit</span>
                  <strong style={{ color: '#2dd4bf' }}>?5,000,000 PLI Cover</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-400)', fontSize: '0.7rem', display: 'block' }}>Territory</span>
                  <strong style={{ color: 'var(--white)' }}>UK & Northern Ireland</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-400)', fontSize: '0.7rem', display: 'block' }}>Platform Ticket Fees</span>
                  <strong style={{ color: '#4ade80' }}>2% Reduced Fee (Active)</strong>
                </div>
              </div>
            </div>

            {/* Document Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <button
                onClick={handleDownloadCertificate}
                className="btn btn-primary interactive-press"
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Download size={16} /> Download Official Policy Certificate (PDF)
              </button>

              <button
                onClick={handleDownloadSampleRams}
                className="btn btn-secondary interactive-press"
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--white)'
                }}
              >
                <FileText size={16} color="var(--teal-400)" /> Generate Council Venue RAMS Document (PDF)
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--slate-500)' }}>
              Council parks, schools, church halls & community centres accept this certificate directly.
            </div>
          </div>
        ) : (
          /* Upgrade Sales & Value Prop View */
          <div>
            {/* The Legal Reality Callout */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '16px',
              marginBottom: '18px',
              fontSize: '0.82rem',
              color: 'var(--slate-300)',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--white)', display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>
                Do You Actually Need Leader Pro?
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.76rem', marginTop: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#2dd4bf', fontWeight: 800, display: 'block', marginBottom: '2px' }}>Stay on Free if:</span>
                  You run casual, 100% free social meetups where members just chat and no tickets or fees are ever charged.
                </div>
                <div style={{ background: 'rgba(20,184,166,0.09)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(45,212,191,0.25)' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 800, display: 'block', marginBottom: '2px' }}>Upgrade to Pro if:</span>
                  You charge for tickets/activities (which legally creates an organizer duty of care), hire council spaces, lead outdoor walks, or want built-in Public Liability Insurance so you are never personally liable.
                </div>
              </div>
            </div>

            {/* Billing Interval Switch */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '4px',
              marginBottom: '18px'
            }}>
              <button
                onClick={() => setBillingInterval('annual')}
                className="interactive-press"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: billingInterval === 'annual' ? 'var(--teal-500)' : 'transparent',
                  color: billingInterval === 'annual' ? '#090d16' : 'var(--slate-400)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Annual (?165 / yr)</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.25)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>SAVE ?33</span>
              </button>
              <button
                onClick={() => setBillingInterval('monthly')}
                className="interactive-press"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: billingInterval === 'monthly' ? 'var(--teal-500)' : 'transparent',
                  color: billingInterval === 'monthly' ? '#090d16' : 'var(--slate-400)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Monthly (?16.50 / mo)
              </button>
            </div>

            {/* Perks Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {LEADER_PRO_CONFIG.perks.map(perk => (
                <div 
                  key={perk.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(20,184,166,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Check size={14} color="#2dd4bf" strokeWidth={3} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.85rem' }}>{perk.title}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--teal-300)', background: 'rgba(20,184,166,0.12)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {perk.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: '2px', lineHeight: 1.4 }}>
                      {perk.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="btn btn-primary interactive-press"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              {isProcessing ? 'Connecting to Stripe...' : `Upgrade to Leader Pro ? ${billingInterval === 'annual' ? '?165/year' : '?16.50/month'}`} <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--slate-500)' }}>
              ?? Instant activation ? Cancel anytime ? Includes instant downloadable venue compliance pack
            </div>
          </div>
        )}
      </div>
    </div>
  );
}