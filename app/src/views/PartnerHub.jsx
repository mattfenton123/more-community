"use client";
import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  MapPin,
  Calendar,
  Store,
  Sparkles,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Shield,
  Award,
  Layers,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { cleanLocationName, matchCommunityLocation } from '../lib/location';
import CommunityPartnerModal from '../components/CommunityPartnerModal';
import Link from 'next/link';
import AppHeader from '../components/AppHeader';

const NICHE_CATEGORIES = [
  { id: 'All', label: 'All Niches' },
  { id: 'Dogs', label: '🐕 Dogs & Pets', match: ['Dog Walking', 'Pets'] },
  { id: 'Running', label: '🏃 Running & Athletics', match: ['Running', 'Athletics', 'Fitness'] },
  { id: 'Walking', label: '🚶 Walking & Hiking', match: ['Walking', 'Hiking', 'Adventure'] },
  { id: 'Wellness', label: '🧘 Wellness & Yoga', match: ['Wellness', 'Yoga', 'Mental Health'] },
  { id: 'Creative', label: '🎨 Creative & Arts', match: ['Creative', 'Art', 'Photography', 'Craft'] },
  { id: 'Social', label: '☕ Food & Social', match: ['Food & Drink', 'Social', 'Book Club', 'Coffee'] },
];

export default function PartnerHub() {
  const { communities, user, services } = useAppContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialModeParam = searchParams?.get('mode');
  const [activePortalTab, setActivePortalTab] = useState(
    initialModeParam === 'sponsors'
      ? 'sponsors'
      : initialModeParam === 'tracking'
      ? 'tracking'
      : 'partners'
  ); // 'partners' | 'sponsors' | 'tracking'

  useEffect(() => {
    if (initialModeParam === 'sponsors' || initialModeParam === 'partners' || initialModeParam === 'tracking') {
      setActivePortalTab(initialModeParam);
    }
  }, [initialModeParam]);

  const [selectedNiche, setSelectedNiche] = useState('All');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [activePartnerCommunity, setActivePartnerCommunity] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('session');
  const [modalBundleClubs, setModalBundleClubs] = useState([]);

  // Multi-club sponsor selection state (Business Sponsors tab only)
  const [selectedClubIds, setSelectedClubIds] = useState([]);

  // Filter welcoming communities
  const availableCommunities = useMemo(() => {
    return (communities || []).filter((c) => c.accepts_pitches !== false && !c.is_private);
  }, [communities]);

  const filteredCommunities = useMemo(() => {
    return availableCommunities.filter((comm) => {
      if (selectedNiche !== 'All') {
        const nicheDef = NICHE_CATEGORIES.find((n) => n.id === selectedNiche);
        if (nicheDef && nicheDef.match) {
          const categoryStr =
            (comm.category || '') + ' ' + (comm.name || '') + ' ' + (comm.description || '');
          const hasMatch = nicheDef.match.some((m) =>
            categoryStr.toLowerCase().includes(m.toLowerCase())
          );
          if (!hasMatch) return false;
        }
      }

      if (selectedRegion !== 'All Regions') {
        const regionQuery = selectedRegion === 'South East (All)' ? 'south east' : selectedRegion;
        if (!matchCommunityLocation(comm, regionQuery)) return false;
      }

      if (locationSearch.trim()) {
        if (!matchCommunityLocation(comm, locationSearch.trim())) return false;
      }

      return true;
    });
  }, [availableCommunities, selectedNiche, selectedRegion, locationSearch]);

  const toggleClubSelection = (clubId) => {
    setSelectedClubIds((prev) =>
      prev.includes(clubId) ? prev.filter((id) => id !== clubId) : [...prev, clubId]
    );
  };

  const selectedClubs = useMemo(() => {
    return (communities || []).filter((c) => selectedClubIds.includes(c.id));
  }, [communities, selectedClubIds]);

  const combinedAudience = useMemo(() => {
    return selectedClubs.reduce(
      (acc, c) => acc + (c.members ?? c.member_count ?? c.members_count ?? 1),
      0
    );
  }, [selectedClubs]);

  // Tracking dashboard data for current user
  const mySubmissions = useMemo(() => {
    if (!user?.id) return [];
    return (services || [])
      .filter((s) => s.userId === user.id)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [services, user?.id]);

  const openPitchModal = (community, tab = 'session', bundle = []) => {
    if (!user?.id) {
      router.push(`/login?redirect=${encodeURIComponent(`/partner?mode=${tab === 'sponsor' ? 'sponsors' : 'partners'}`)}`);
      return;
    }
    setActivePartnerCommunity(community);
    setActiveModalTab(tab);
    setModalBundleClubs(bundle);
  };

  const isSponsorTab = activePortalTab === 'sponsors';
  const isTrackingTab = activePortalTab === 'tracking';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-canvas)',
        color: 'var(--ink-primary)',
        paddingBottom: '100px',
      }}
    >
      <AppHeader title="Partner & Sponsor Portal" showBack />

      {/* Top Portal Mode Switcher */}
      <div
        style={{
          padding: '20px 20px 18px',
          background: isSponsorTab
            ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(235, 87, 56, 0.12) 0%, transparent 100%)',
          borderBottom: '1px solid var(--hairline-border)',
        }}
      >
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          {/* 3 Separated Purpose-Built Portal Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '6px',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border)',
              borderRadius: '14px',
              padding: '5px',
              marginBottom: '20px',
            }}
          >
            {[
              {
                id: 'partners',
                label: 'Workshop Partners',
                short: 'Workshops',
                icon: Award,
                accent: '#EB5738',
              },
              {
                id: 'sponsors',
                label: 'Business Sponsors',
                short: 'Sponsors',
                icon: Store,
                accent: '#f59e0b',
              },
              {
                id: 'tracking',
                label: `My Portal (${mySubmissions.length})`,
                short: `My Portal (${mySubmissions.length})`,
                icon: BarChart3,
                accent: '#10b981',
              },
            ].map((tab) => {
              const active = activePortalTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePortalTab(tab.id)}
                  className="interactive-press"
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: active ? `1px solid ${tab.accent}55` : '1px solid transparent',
                    background: active ? `${tab.accent}18` : 'transparent',
                    color: active ? tab.accent : 'var(--ink-secondary)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dedicated Hero per Portal Tab */}
          {activePortalTab === 'partners' && (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  background: 'rgba(235, 87, 56, 0.14)',
                  border: '1px solid rgba(235, 87, 56, 0.3)',
                  color: '#EB5738',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  marginBottom: '10px',
                }}
              >
                <Award size={13} /> For Instructors, Coaches, Guides &amp; Creative Hosts
              </div>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  margin: '0 0 8px 0',
                  fontFamily: 'var(--font-heading)',
                  lineHeight: 1.2,
                  color: 'var(--ink-primary)',
                }}
              >
                Host Paid Workshops &amp; Guest Sessions
              </h1>
              <p
                style={{
                  color: 'var(--ink-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: '640px',
                }}
              >
                Partner 1-on-1 with active local clubs to run guided hikes, yoga, breathwork, running clinics, or creative workshops. <strong>£0 upfront cost</strong> — share ticket revenue fairly with the club host.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '10px',
                  marginTop: '18px',
                }}
              >
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Upfront Fee</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>£0 / Free</div>
                </div>
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Revenue Model</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EB5738', marginTop: '2px' }}>Per-Ticket Split</div>
                </div>
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Safety &amp; Trust</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink-primary)', marginTop: '2px' }}>Direct Host Approval</div>
                </div>
              </div>
            </>
          )}

          {activePortalTab === 'sponsors' && (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  background: 'rgba(245, 158, 11, 0.14)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#f59e0b',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  marginBottom: '10px',
                }}
              >
                <Store size={13} /> For Local Cafés, Clinics, Pubs &amp; Independent Brands
              </div>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  margin: '0 0 8px 0',
                  fontFamily: 'var(--font-heading)',
                  lineHeight: 1.2,
                  color: 'var(--ink-primary)',
                }}
              >
                Sponsor Local Clubs &amp; Drive Real Footfall
              </h1>
              <p
                style={{
                  color: 'var(--ink-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: '640px',
                }}
              >
                Feature an exclusive member perk (e.g. <em>&ldquo;15% off post-walk coffee&rdquo;</em>) across 1 or multiple local clubs. <strong>80% of your sponsorship goes straight into the club&apos;s grassroots fund.</strong>
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '10px',
                  marginTop: '18px',
                }}
              >
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Directory Perk</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>£15 / mo</div>
                </div>
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Club Fund Share</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>80% to Club</div>
                </div>
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Town Bundles</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink-primary)', marginTop: '2px' }}>Multi-Club Select</div>
                </div>
              </div>
            </>
          )}

          {activePortalTab === 'tracking' && (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10b981',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  marginBottom: '10px',
                }}
              >
                <BarChart3 size={13} /> Partner &amp; Sponsor Tracking Dashboard
              </div>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  margin: '0 0 8px 0',
                  fontFamily: 'var(--font-heading)',
                  lineHeight: 1.2,
                  color: 'var(--ink-primary)',
                }}
              >
                My Active Pitches &amp; Sponsorships
              </h1>
              <p
                style={{
                  color: 'var(--ink-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: '640px',
                }}
              >
                Track leader approvals, active member perks, and guest workshop proposals across every community you&apos;ve partnered with.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '20px 20px 0' }}>
        {isTrackingTab ? (
          /* ===== TRACKING DASHBOARD ===== */
          <div>
            {!user?.id ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border)',
                  borderRadius: '18px',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔐</div>
                <h3 style={{ margin: '0 0 6px 0', color: 'var(--ink-primary)' }}>Sign in to view your Portal</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
                  Sign in with your account to track your workshop proposals and active local sponsorships.
                </p>
                <Link
                  href="/login?redirect=/partner?mode=tracking"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}
                >
                  Sign In to Partner Portal
                </Link>
              </div>
            ) : mySubmissions.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: 'var(--surface-card)',
                  border: '1px dashed var(--hairline-border-strong)',
                  borderRadius: '18px',
                }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>🤝</div>
                <h3 style={{ margin: '0 0 6px 0', color: 'var(--ink-primary)' }}>No pitches or sponsorships yet</h3>
                <p style={{ margin: '0 0 18px 0', fontSize: '0.86rem', color: 'var(--ink-secondary)', maxWidth: '420px', marginInline: 'auto' }}>
                  Pick a local community to pitch a guest workshop or sponsor a club with a member perk.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActivePortalTab('partners')}
                    className="btn btn-primary interactive-press"
                    style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    🎓 Browse Clubs for Workshops
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePortalTab('sponsors')}
                    className="btn btn-outline interactive-press"
                    style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    🏪 Sponsor a Local Club
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Summary strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                      {mySubmissions.filter((s) => s.status === 'approved').length}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Approved &amp; Live</div>
                  </div>
                  <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>
                      {mySubmissions.filter((s) => s.status === 'pending').length}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Pending Review</div>
                  </div>
                  <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)' }}>
                      {mySubmissions.reduce((sum, s) => {
                        const c = (communities || []).find((x) => x.id === s.communityId);
                        return sum + (c?.members ?? c?.member_count ?? 1);
                      }, 0)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Member Reach</div>
                  </div>
                </div>

                {mySubmissions.map((item) => {
                  const targetComm = (communities || []).find((c) => c.id === item.communityId);
                  const isSponsorItem = item.type === 'business_sponsor' || item.tier;
                  const statusCfg =
                    item.status === 'approved'
                      ? { label: 'Approved & Live', color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', Icon: CheckCircle2 }
                      : item.status === 'rejected'
                      ? { label: 'Declined', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', Icon: XCircle }
                      : { label: 'Pending Leader Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', Icon: Clock };
                  const StatusIcon = statusCfg.Icon;

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '99px',
                                background: isSponsorItem ? 'rgba(245, 158, 11, 0.14)' : 'rgba(235, 87, 56, 0.14)',
                                color: isSponsorItem ? '#f59e0b' : '#EB5738',
                              }}
                            >
                              {isSponsorItem ? '🏪 Business Sponsor' : '🎓 Guest Workshop'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '99px',
                                background: statusCfg.bg,
                                color: statusCfg.color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <StatusIcon size={12} /> {statusCfg.label}
                            </span>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--ink-primary)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                            Target Club: <strong>{targetComm?.name || item.communityId}</strong>
                            {targetComm ? ` (${targetComm.members ?? targetComm.member_count ?? 1} members)` : ''}
                          </div>
                        </div>

                        {targetComm && (
                          <Link
                            href={`/community/${targetComm.id}`}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '9px',
                              background: 'var(--surface-elevated)',
                              border: '1px solid var(--hairline-border)',
                              color: 'var(--ink-primary)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            View Club <ChevronRight size={14} />
                          </Link>
                        )}
                      </div>

                      {item.perk && (
                        <div style={{ fontSize: '0.82rem', padding: '8px 12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontWeight: 600 }}>
                          🎁 Member Perk: {item.perk}
                        </div>
                      )}
                      {!isSponsorItem && item.ticketPrice > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                          Ticket: <strong>£{item.ticketPrice}</strong> • Club Fund Share: <strong>£{item.clubCut || 0}/ticket</strong> • Capacity: {item.minCapacity || 4}–{item.maxCapacity || 14}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ===== SEPARATED DIRECTORY FOR WORKSHOP PARTNERS OR BUSINESS SPONSORS ===== */
          <>
            {/* Search & Catchment Filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search
                  size={16}
                  color="var(--ink-muted)"
                  style={{ position: 'absolute', left: '12px', top: '13px' }}
                />
                <input
                  type="text"
                  placeholder="Search by town (e.g. Tunbridge Wells, Sevenoaks, Brighton) or county..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    borderRadius: '12px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Regional Quick Filter Chips */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '10px',
                WebkitOverflowScrolling: 'touch',
              }}
              className="no-scrollbar"
            >
              {['All Regions', 'South East (All)', 'Kent', 'East Sussex', 'London'].map((reg) => {
                const isSelected = selectedRegion === reg;
                const matchCount =
                  reg === 'All Regions'
                    ? availableCommunities.length
                    : availableCommunities.filter((c) =>
                        matchCommunityLocation(c, reg === 'South East (All)' ? 'south east' : reg)
                      ).length;
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setSelectedRegion(reg)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '99px',
                      background: isSelected ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                      border: isSelected
                        ? '1px solid var(--brand-accent)'
                        : '1px solid var(--hairline-border-strong)',
                      color: isSelected ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{reg}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        opacity: 0.85,
                        background: 'var(--surface-elevated)',
                        padding: '1px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      {matchCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Niche Category Pills */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '12px',
                marginBottom: '18px',
                WebkitOverflowScrolling: 'touch',
              }}
              className="no-scrollbar"
            >
              {NICHE_CATEGORIES.map((niche) => {
                const isSelected = selectedNiche === niche.id;
                return (
                  <button
                    key={niche.id}
                    type="button"
                    onClick={() => setSelectedNiche(niche.id)}
                    className="interactive-press"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '99px',
                      border: isSelected
                        ? '1px solid var(--brand-accent)'
                        : '1px solid var(--hairline-border-strong)',
                      background: isSelected ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                      color: isSelected ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    {niche.label}
                  </button>
                );
              })}
            </div>

            {/* Multi-Club Sponsor Floating Bundle Bar (BUSINESS SPONSORS TAB ONLY) */}
            {isSponsorTab && selectedClubIds.length > 0 && (
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1.5px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.12)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--ink-primary)' }}>
                    {selectedClubIds.length} Local {selectedClubIds.length === 1 ? 'Club' : 'Clubs'} Selected for Sponsorship
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                    Combined Reach: <strong>{combinedAudience} local members</strong> • Bundle: <strong>£{selectedClubIds.length * 15}/mo</strong> (£{selectedClubIds.length * 12}/mo directly to club funds)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedClubIds([])}
                    className="btn btn-outline interactive-press"
                    style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem' }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedClubs.length > 0) {
                        openPitchModal(selectedClubs[0], 'sponsor', selectedClubs);
                      }
                    }}
                    className="btn btn-primary interactive-press"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: '#f59e0b',
                      color: '#090d16',
                      border: 'none',
                    }}
                  >
                    Sponsor All ({selectedClubs.length}) →
                  </button>
                </div>
              </div>
            )}

            {/* Directory Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>
                {filteredCommunities.length}{' '}
                {filteredCommunities.length === 1 ? 'Community' : 'Communities'} Open to{' '}
                {isSponsorTab ? 'Local Sponsors' : 'Guest Workshops'}
              </div>
              {isSponsorTab && filteredCommunities.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allIds = filteredCommunities.map((c) => c.id);
                    const allSelected = allIds.every((id) => selectedClubIds.includes(id));
                    if (allSelected) {
                      setSelectedClubIds((prev) => prev.filter((id) => !allIds.includes(id)));
                    } else {
                      setSelectedClubIds((prev) => Array.from(new Set([...prev, ...allIds])));
                    }
                  }}
                  style={{
                    background: 'rgba(245, 158, 11, 0.14)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    color: '#d97706',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {filteredCommunities.every((c) => selectedClubIds.includes(c.id))
                    ? 'Deselect All in Catchment'
                    : `+ Select All ${filteredCommunities.length} for Town Bundle`}
                </button>
              )}
            </div>

            {/* Community Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredCommunities.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'var(--surface-card)',
                    borderRadius: '16px',
                    border: '1px dashed var(--hairline-border-strong)',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    No communities found
                  </div>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                    Try selecting &ldquo;All Niches&rdquo; or clearing your town filter.
                  </p>
                </div>
              ) : (
                filteredCommunities.map((comm) => {
                  const isSelected = isSponsorTab && selectedClubIds.includes(comm.id);
                  const memberCount = comm.members ?? comm.member_count ?? comm.members_count ?? 1;

                  return (
                    <div
                      key={comm.id}
                      style={{
                        background: 'var(--surface-card)',
                        border: isSelected
                          ? '1.5px solid rgba(245, 158, 11, 0.55)'
                          : '1px solid var(--hairline-border)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                          <img
                            src={
                              comm.image ||
                              comm.cover_image ||
                              'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=120&q=80'
                            }
                            alt={comm.name}
                            style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '14px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h3
                                style={{
                                  fontSize: '1.02rem',
                                  fontWeight: 700,
                                  color: 'var(--ink-primary)',
                                  margin: 0,
                                }}
                              >
                                {comm.name}
                              </h3>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'var(--brand-accent-soft)',
                                  color: 'var(--brand-accent)',
                                  padding: '2px 8px',
                                  borderRadius: '99px',
                                  fontWeight: 700,
                                }}
                              >
                                {comm.category || 'Community'}
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '0.78rem',
                                color: 'var(--ink-muted)',
                                marginTop: '4px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={12} color="var(--brand-accent)" />
                                {cleanLocationName(comm.location_name || comm.city) || 'Local Area'}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={12} />
                                {memberCount} members
                              </span>
                            </div>

                            {comm.description && (
                              <p
                                style={{
                                  margin: '6px 0 0',
                                  fontSize: '0.8rem',
                                  color: 'var(--ink-secondary)',
                                  lineHeight: 1.4,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {comm.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Multi-club bundle checkbox ONLY on Business Sponsors tab */}
                        {isSponsorTab && (
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              flexShrink: 0,
                              padding: '5px 9px',
                              borderRadius: '8px',
                              background: 'var(--surface-elevated)',
                              border: '1px solid var(--hairline-border)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleClubSelection(comm.id)}
                              style={{ accentColor: '#f59e0b', width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-secondary)' }}>
                              Bundle
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Focused Single-Purpose CTA per Tab */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          borderTop: '1px solid var(--hairline-border)',
                          paddingTop: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {!isSponsorTab ? (
                          <button
                            type="button"
                            onClick={() => openPitchModal(comm, 'session', [])}
                            className="btn btn-primary interactive-press"
                            style={{
                              flex: 1,
                              minWidth: '170px',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              fontSize: '0.83rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <Calendar size={15} />
                            Pitch Guest Workshop (£0 Upfront)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPitchModal(comm, 'sponsor', [comm])}
                            className="interactive-press"
                            style={{
                              flex: 1,
                              minWidth: '170px',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              background: 'rgba(245, 158, 11, 0.16)',
                              border: '1px solid rgba(245, 158, 11, 0.45)',
                              color: '#d97706',
                              fontSize: '0.83rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <Store size={15} />
                            Sponsor &amp; Offer Perk (£15/mo)
                          </button>
                        )}

                        <Link
                          href={`/community/${comm.id}`}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--hairline-border)',
                            color: 'var(--ink-secondary)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          View Club <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Dedicated Locked-Mode Modal */}
      {activePartnerCommunity && (
        <CommunityPartnerModal
          isOpen={Boolean(activePartnerCommunity)}
          onClose={() => {
            setActivePartnerCommunity(null);
            setModalBundleClubs([]);
          }}
          community={activePartnerCommunity}
          selectedCommunities={modalBundleClubs}
          initialTab={activeModalTab}
          lockedMode={true}
        />
      )}
    </div>
  );
}
