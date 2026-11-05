"use client";
import React, { useState } from 'react';
import { Shield, Award, CheckCircle2, Calendar, Clock, DollarSign, Users, ChevronRight, Check, X, ArrowUpRight, Sparkles, Filter, ExternalLink, HelpCircle, AlertCircle } from 'lucide-react';
import { getStoredProposals, updateProposalStatus } from '../lib/specialists';
import { useToast } from './Toast';

export default function LeaderProposalsInbox({ 
  community, 
  onAcceptProposalToEvent,
  onInspectSpecialist,
  onOpenApplyModal 
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'dismissed'
  const [specialists, setSpecialists] = useState(() => getStoredProposals());
  const [schedulingProposal, setSchedulingProposal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('10:00');

  // Flatten proposals with their specialist metadata
  const allProposals = specialists.flatMap(spec => 
    (spec.proposals || []).map(prop => ({
      ...prop,
      specialist: spec
    }))
  );

  const pendingProposals = allProposals.filter(p => p.status === 'pending');
  const acceptedProposals = allProposals.filter(p => p.status === 'accepted');
  const dismissedProposals = allProposals.filter(p => p.status === 'dismissed');

  const displayedProposals = 
    activeTab === 'pending' ? pendingProposals :
    activeTab === 'accepted' ? acceptedProposals : dismissedProposals;

  const handleDismiss = (specialistId, proposalId) => {
    const updated = updateProposalStatus(specialistId, proposalId, 'dismissed');
    setSpecialists(updated);
    toast.info('Proposal dismissed without sending direct DMs.');
  };

  const handleStartSchedule = (proposal) => {
    setSchedulingProposal(proposal);
  };

  const handleConfirmSchedule = async () => {
    if (!schedulingProposal) return;
    
    try {
      // 1. Mark proposal as accepted in local storage
      const updated = updateProposalStatus(
        schedulingProposal.specialist.id, 
        schedulingProposal.id, 
        'accepted'
      );
      setSpecialists(updated);

      // 2. Call handler to create event in AppContext
      if (onAcceptProposalToEvent) {
        await onAcceptProposalToEvent({
          title: schedulingProposal.title,
          description: `${schedulingProposal.summary}\n\nLed by certified specialist: ${schedulingProposal.specialist.name} (${schedulingProposal.specialist.title}).\n\nLiability & Safety: ${schedulingProposal.liabilityNote}\n\nEquipment provided: ${schedulingProposal.equipmentProvided}\nWhat to bring: ${schedulingProposal.memberNeeds}`,
          date: selectedDate,
          time: selectedTime,
          location: community?.location || 'Local Meeting Point',
          image: schedulingProposal.image,
          ticketPrice: schedulingProposal.communityPrice,
          maxCapacity: schedulingProposal.maxCapacity,
          cohost: schedulingProposal.specialist.name
        });
      }

      toast.success(`"${schedulingProposal.title}" scheduled to your community calendar!`);
      setSchedulingProposal(null);
      setActiveTab('accepted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to schedule proposal');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Asymmetric Pitch Overview Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid rgba(45, 212, 191, 0.3)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: 'rgba(20, 184, 166, 0.2)',
                color: 'var(--teal-300)',
                border: '1px solid rgba(20, 184, 166, 0.4)',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Anti-Spam Marketplace · Phase 2
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Zero Cold DMs to Organizers</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>
              Verified Specialist &amp; Activity Pitch Inbox
            </h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
              Mountain guides, yoga coaches, and local experts pitch ready-to-run workshops tailored to your group with exclusive community pricing. You keep a fundraising cut (£2.50 to £5/ticket) on every member booking, while the certified instructor carries the £5M PLI liability.
            </p>
          </div>

          <button
            onClick={onOpenApplyModal}
            className="btn btn-outline interactive-press"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.85rem'
            }}
          >
            <Sparkles size={16} color="var(--teal-400)" />
            Pitch As An Instructor / Guide
          </button>
        </div>

        {/* 3 Protection Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={18} color="var(--teal-400)" />
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)' }}>
              <strong>NGB &amp; DBS Verified:</strong> Checked before entering your inbox
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="var(--teal-400)" />
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)' }}>
              <strong>£5M Instructor Legal Shield:</strong> Lead instructor assumes primary duty of care
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={18} color="var(--teal-400)" />
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)' }}>
              <strong>Club Fundraising:</strong> Direct cash payout on every ticket to your club fund
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: activeTab === 'pending' ? 'var(--teal-500)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'pending' ? '#000' : 'var(--slate-300)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            New Proposals
            <span style={{
              background: activeTab === 'pending' ? '#000' : 'rgba(20, 184, 166, 0.2)',
              color: activeTab === 'pending' ? '#fff' : 'var(--teal-300)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '0.72rem'
            }}>
              {pendingProposals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('accepted')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: activeTab === 'accepted' ? 'var(--teal-500)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'accepted' ? '#000' : 'var(--slate-300)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Scheduled &amp; Active
            <span style={{
              background: activeTab === 'accepted' ? '#000' : 'rgba(255, 255, 255, 0.1)',
              color: activeTab === 'accepted' ? '#fff' : 'var(--slate-400)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '0.72rem'
            }}>
              {acceptedProposals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dismissed')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: activeTab === 'dismissed' ? 'var(--teal-500)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'dismissed' ? '#000' : 'var(--slate-300)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Dismissed ({dismissedProposals.length})
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
          Showing {displayedProposals.length} activities
        </div>
      </div>

      {/* Proposals List */}
      {displayedProposals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '18px',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          color: 'var(--slate-400)'
        }}>
          <CheckCircle2 size={36} color="var(--teal-400)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ color: 'var(--white)', margin: '0 0 6px 0', fontSize: '1.1rem' }}>No {activeTab} proposals</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {activeTab === 'pending' ? 'You are all caught up! New proposals from accredited guides will appear here.' : 'No items in this category.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {displayedProposals.map(proposal => {
            const spec = proposal.specialist;
            const discountPct = Math.round(((proposal.standardPrice - proposal.communityPrice) / proposal.standardPrice) * 100);

            return (
              <div
                key={proposal.id}
                className="glass-panel"
                style={{
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)'
                }}
              >
                {/* Specialist Header Strip */}
                <div style={{
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={spec.avatar}
                      alt={spec.name}
                      style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--teal-500)' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.95rem' }}>{spec.name}</span>
                        <span style={{
                          background: 'rgba(20, 184, 166, 0.2)',
                          color: 'var(--teal-300)',
                          border: '1px solid rgba(20, 184, 166, 0.4)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 8px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Shield size={10} /> Verified Pro
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>★ {spec.rating}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                        {spec.title} · {spec.location}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onInspectSpecialist(spec)}
                    className="interactive-press"
                    style={{
                      background: 'rgba(20, 184, 166, 0.1)',
                      border: '1px solid rgba(45, 212, 191, 0.25)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--teal-300)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Award size={14} />
                    Inspect Credential Vault &amp; Insurance
                  </button>
                </div>

                {/* Main Card Grid */}
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(260px, 1fr)', gap: '20px' }}>
                  {/* Left Column: Activity Info */}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      {proposal.category}
                    </div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', color: 'var(--white)', fontFamily: 'var(--font-heading)', lineHeight: 1.3 }}>
                      {proposal.title}
                    </h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                      {proposal.summary}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', color: 'var(--slate-300)', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div>
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Duration &amp; Size</div>
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>{proposal.duration} · Max {proposal.maxCapacity} spots</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Equipment Provided</div>
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>{proposal.equipmentProvided}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Economics & 1-Click Action */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Community Price</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--teal-400)', fontFamily: 'var(--font-heading)' }}>
                            £{proposal.communityPrice}
                            <span style={{ fontSize: '0.85rem', color: 'var(--slate-400)', textDecoration: 'line-through', marginLeft: '8px' }}>
                              £{proposal.standardPrice}
                            </span>
                          </div>
                        </div>
                        <span style={{
                          background: 'rgba(20, 184, 166, 0.15)',
                          color: 'var(--teal-300)',
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          Save {discountPct}%
                        </span>
                      </div>

                      {/* Revenue breakdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--teal-300)', fontWeight: 600 }}>
                          <span>Your Club Fund Earns:</span>
                          <span>+£{proposal.communityCut.toFixed(2)} / ticket</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)' }}>
                          <span>Guide Takes:</span>
                          <span>£{proposal.specialistCut.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-500)', fontSize: '0.72rem' }}>
                          <span>Club Kitty Potential:</span>
                          <span>£{(proposal.communityCut * proposal.maxCapacity).toFixed(2)} on full attendance</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {proposal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStartSchedule(proposal)}
                            className="btn btn-primary interactive-press"
                            style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Calendar size={16} />
                            Accept &amp; Schedule
                          </button>
                          <button
                            onClick={() => handleDismiss(spec.id, proposal.id)}
                            className="btn btn-outline interactive-press"
                            style={{ padding: '10px', borderRadius: '12px', color: 'var(--slate-400)' }}
                            title="Dismiss without notifying guide directly"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}

                      {proposal.status === 'accepted' && (
                        <div style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '12px',
                          background: 'rgba(20, 184, 166, 0.15)',
                          color: 'var(--teal-300)',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}>
                          <CheckCircle2 size={16} /> Scheduled to Community Calendar
                        </div>
                      )}

                      {proposal.status === 'dismissed' && (
                        <div style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--slate-400)',
                          fontSize: '0.8rem',
                          textAlign: 'center'
                        }}>
                          Dismissed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Scheduling Drawer / Modal */}
      {schedulingProposal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(5, 10, 20, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: '20px',
            border: '1px solid rgba(45, 212, 191, 0.3)',
            background: 'var(--slate-900)',
            padding: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>
              Schedule into Your Calendar
            </h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
              Confirm date &amp; start time for <strong>"{schedulingProposal.title}"</strong> with {schedulingProposal.specialist.name}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Event Date</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Start Time</label>
                <input 
                  type="time" 
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)' }}
                />
              </div>

              <div style={{ background: 'rgba(20, 184, 166, 0.08)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(45, 212, 191, 0.2)', fontSize: '0.8rem', color: 'var(--teal-200)' }}>
                ✨ <strong>Automatic Setup:</strong> Digital ticketing will be activated at £{schedulingProposal.communityPrice}, the specialist will be assigned as verified on-site instructor, and your members will receive an instant push/email invitation.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setSchedulingProposal(null)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSchedule}
                className="btn btn-primary"
                style={{ padding: '8px 20px', borderRadius: '10px' }}
              >
                Confirm &amp; Publish Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
