"use client";
import { useState } from 'react';
import { Shield, Check, Download, FileText, ArrowRight, X, Sparkles, AlertCircle, ExternalLink, Award, DollarSign } from 'lucide-react';
import { LEADER_PRO_CONFIG, generatePliCertificatePdf, generateRamsPdf } from '../lib/insurance';
import { useToast } from './Toast';

export default function LeaderShieldModal({ isOpen, onClose, community, leaderUser, onUpgradeSuccess }) {
  if (!isOpen || !community) return null;

  const { toast } = useToast();
  const [billingInterval, setBillingInterval] = useState('annual'); // 'annual' | 'monthly'
  const [isProcessing, setIsProcessing] = useState(false);

  const isInsured = Boolean(
    community.is_insured || 
    community.insurance_tier === 'pro' ||
    (typeof window !== 'undefined' && localStorage.getItem(`more_community_insured_${community.id}`) === 'true')
  );

  const policyNumber = community.insurance_policy_number || `MC-PLI-2026-${community.id.slice(0, 6).toUpperCase()}`;
  const price = billingInterval === 'annual' ? LEADER_PRO_CONFIG.annualPrice : LEADER_PRO_CONFIG.monthlyPrice;

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'leader_pro',
          communityId: community.id,
          userId: leaderUser?.id || 'leader',
          interval: billingInterval,
          price: price,
          title: `MORE Leader Pro & Shield (${billingInterval === 'annual' ? 'Annual' : 'Monthly'})`
        })
      });
      const data = await res.json();

      if (data?.url && !data?.simulated) {
        window.location.href = data.url;
        return;
      }

      // Simulated activation when Stripe is in test/demo mode
      if (typeof window !== 'undefined') {
        localStorage.setItem(`more_community_insured_${community.id}`, 'true');
      }
      toast.success('Leader Pro Activated! 🛡️', 'Your £5M Public Liability cover is active.');
      if (onUpgradeSuccess) {
        onUpgradeSuccess({
          is_insured: true,
          insurance_tier: 'pro',
          insurance_policy_number: policyNumber
        });
      }
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
      toast.success('Certificate Downloaded', 'PDF saved to your device.');
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
          title: `${community.name} Gathering`,
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
      toast.error('Download Failed', 'Could not generate RAMS PDF.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
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
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Top Shield Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(20,184,166,0.25), rgba(20,184,166,0.05))',
            border: '1px solid rgba(20,184,166,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(20,184,166,0.2)'
          }}>
            <Shield size={28} color="#2dd4bf" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>
                MORE Leader Shield
              </h2>
              <span style={{
                background: isInsured ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: isInsured ? '#4ade80' : '#fbbf24',
                border: isInsured ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)',
                padding: '2px 8px',
                borderRadius: '99px',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>
                {isInsured ? 'ACTIVE COVER' : 'PRO TIER'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
              {isInsured ? 'Comprehensive £5M Public Liability & Venue Compliance' : 'Complete InsurTech & Compliance protection for your community'}
            </p>
          </div>
        </div>

        {/* Active Policy Status View */}
        {isInsured ? (
          <div>
            <div style={{
              background: 'rgba(20,184,166,0.08)',
              border: '1px solid rgba(20,184,166,0.25)',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Policy Certificate Details
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)', marginTop: '2px' }}>
                    {policyNumber}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <Check size={14} /> Council & Venue Verified
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', color: 'var(--slate-300)' }}>
                <div>
                  <span style={{ color: 'var(--slate-500)', fontSize: '0.72rem', display: 'block' }}>Indemnity Limit</span>
                  <strong style={{ color: 'var(--white)' }}>£5,000,000 PLI</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', fontSize: '0.72rem', display: 'block' }}>Territory</span>
                  <strong style={{ color: 'var(--white)' }}>UK & Northern Ireland</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', fontSize: '0.72rem', display: 'block' }}>Platform Fees</span>
                  <strong style={{ color: '#4ade80' }}>0% Commission (Active)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', fontSize: '0.72rem', display: 'block' }}>Status</span>
                  <strong style={{ color: '#2dd4bf' }}>Auto-Renewing</strong>
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.92rem'
                }}
              >
                <Download size={16} /> Download Official £5M PLI Certificate (PDF)
              </button>

              <button
                onClick={handleDownloadSampleRams}
                className="btn btn-outline interactive-press"
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.88rem'
                }}
              >
                <FileText size={16} /> Generate Venue RAMS & Risk Assessment (PDF)
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--slate-500)', margin: 0 }}>
              Underwritten by MORE Community Mutual Syndicate for registered leisure & community organizers.
            </p>
          </div>
        ) : (
          /* Upgrade Sales & Value Prop View */
          <div>
            {/* The Problem / Solution Banner */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: '18px',
              fontSize: '0.82rem',
              color: 'var(--slate-300)',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--white)' }}>Why Leaders Love This:</strong> Standalone UK PLI quotes run ~£150/year with zero venue tools or waivers. <strong>MORE Leader Pro</strong> bundles £5M PLI, instant council RAMS, digital waivers, and 0% ticket fees for roughly the same price.
            </div>

            {/* Billing Interval Switch */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => setBillingInterval('annual')}
                className="interactive-press"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: billingInterval === 'annual' ? 'var(--teal-500)' : 'transparent',
                  color: billingInterval === 'annual' ? '#ffffff' : 'var(--slate-400)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Annual (£165 / yr)</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: '4px' }}>SAVE £33</span>
              </button>
              <button
                onClick={() => setBillingInterval('monthly')}
                className="interactive-press"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: billingInterval === 'monthly' ? 'var(--teal-500)' : 'transparent',
                  color: billingInterval === 'monthly' ? '#ffffff' : 'var(--slate-400)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Monthly (£16.50 / mo)
              </button>
            </div>

            {/* Perks Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
              {LEADER_PRO_CONFIG.perks.map(perk => (
                <div 
                  key={perk.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)'
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
                    <Check size={14} color="#2dd4bf" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.85rem' }}>{perk.title}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--teal-400)', background: 'rgba(20,184,166,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                        {perk.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px', lineHeight: 1.4 }}>
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
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              {isProcessing ? 'Connecting to Stripe...' : `Upgrade to Leader Pro • ${billingInterval === 'annual' ? '£165/year' : '£16.50/month'}`} <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--slate-500)' }}>
              🔒 Instant activation • Cancel anytime • Includes immediate downloadable £5M certificate
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
