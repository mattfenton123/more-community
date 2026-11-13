import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, Users, Globe, Lock } from 'lucide-react';
import { isAffiliateExperience, getHostPassEconomics } from '../lib/experiencePricing';

export default function HostExperienceModal({ experience, communities, user, onClose, onHost }) {
  const isAffiliate = isAffiliateExperience(experience);
  const guidePrice = experience.supplierBase || experience.basePrice || 35;
  const defaultMemberPass = isAffiliate ? (experience.hostPassFee ?? experience.suggestedHostPass ?? 15) : (experience.basePrice + 10);
  const defaultNonMemberPass = isAffiliate ? Math.max(defaultMemberPass + 10, 25) : (experience.basePrice + 25);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [memberPrice, setMemberPrice] = useState(defaultMemberPass);
  const [nonMemberPrice, setNonMemberPrice] = useState(defaultNonMemberPass);
  const [minGroupSize, setMinGroupSize] = useState(experience.minGroupSize || 6);
  const [maxCapacity, setMaxCapacity] = useState(experience.spotsLeft || 20);
  const [communityId, setCommunityId] = useState(user.ledCommunities[0]);
  const [collabCommunityIds, setCollabCommunityIds] = useState([]);
  const [isPublic, setIsPublic] = useState(true);

  const econ = getHostPassEconomics({
    guidePrice,
    hostPassMember: memberPrice,
    minGroupSize,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onHost({
      communityId,
      date,
      time,
      memberPrice,
      nonMemberPrice,
      maxCapacity,
      minGroupSize,
      isPublic,
      collabCommunityIds,
      bookingModel: isAffiliate ? 'affiliate_host_pass' : 'direct_escrow',
      provider: experience.provider || experience.source || '',
      productUrl: experience.productUrl || '',
      supplierEstimate: guidePrice,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, 
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'var(--slate-900)', 
        width: '100%', maxWidth: '500px', 
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        padding: '24px 24px 100px 24px', 
        maxHeight: '90dvh', overflowY: 'auto',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>Host Experience</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Community</label>
            <select 
              value={communityId} 
              onChange={e => setCommunityId(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem' }}
            >
              {user.ledCommunities.map(id => {
                const c = communities.find(comm => comm.id === id);
                return <option key={id} value={id}>{c?.name || id}</option>;
              })}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> Invite Collabs (Optional)
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '8px', lineHeight: 1.4 }}>
              Select communities to cross-post this event to their feed and merge RSVPs.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {communities.filter(c => c.id !== communityId).map(c => {
                const isSelected = collabCommunityIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) setCollabCommunityIds(prev => prev.filter(id => id !== c.id));
                      else setCollabCommunityIds(prev => [...prev, c.id]);
                    }}
                    style={{
                      background: isSelected ? 'var(--teal-500)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--teal-400)' : 'rgba(255,255,255,0.1)',
                      color: isSelected ? 'white' : 'var(--slate-300)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Date</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
                <input 
                  type="date" 
                  required
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Time</label>
              <div style={{ position: 'relative' }}>
                <Clock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
                <input 
                  type="time" 
                  required
                  value={time} 
                  onChange={e => setTime(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(20,184,166,0.05)', borderRadius: '16px', border: '1px solid rgba(20,184,166,0.2)' }}>
            {isAffiliate ? (
              <>
                <h4 style={{ margin: '0 0 8px', color: 'var(--teal-400)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2-Step Group Host Pass ({experience.provider || 'Viator'} • Est. Ticket ~£{guidePrice})
                </h4>
                <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.45 }}>
                  Members pay <strong>{experience.provider || 'Viator'}</strong> directly for their tour ticket (~£{guidePrice}) via your tracked link once the group meets minimum numbers. Your <strong>More Group Host Pass</strong> covers hosting, More&apos;s 10% platform fee, and helps fund <strong>your own leader spot</strong>.
                </p>
              </>
            ) : (
              <h4 style={{ margin: '0 0 16px', color: 'var(--teal-400)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pricing Strategy (Base: £{experience.basePrice})
              </h4>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', marginBottom: '6px' }}>
                  {isAffiliate ? 'Member Host Pass (£)' : 'Member Price (£)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
                  <input 
                    type="number" 
                    min={isAffiliate ? 0 : experience.basePrice}
                    required
                    value={memberPrice} 
                    onChange={e => setMemberPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', marginBottom: '6px' }}>
                  {isAffiliate ? 'Non-Member Host Pass (£)' : 'Non-Member Price (£)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
                  <input 
                    type="number" 
                    min={Number(memberPrice) || 0}
                    required
                    value={nonMemberPrice} 
                    onChange={e => setNonMemberPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {isAffiliate && (
                <div style={{ flex: '1 1 120px' }}>
                  <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', marginBottom: '6px' }}>
                    Min Group Size
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Users size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
                    <input
                      type="number"
                      min={2}
                      max={experience.spotsLeft || 30}
                      required
                      value={minGroupSize}
                      onChange={e => setMinGroupSize(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {isAffiliate ? (
              <div style={{ fontSize: '0.82rem', color: '#ccfbf1', background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(45,212,191,0.28)', borderRadius: '10px', padding: '10px 12px', lineHeight: 1.45 }}>
                With <strong>{econ.minGroupSize} members</strong> × £{econ.hostPassMember} Pass = <strong>£{econ.pot} pot</strong> (~£{econ.netToHost} after More&apos;s 10% fee) —{' '}
                {econ.coversLeaderTicket
                  ? <strong>covers your own ~£{econ.guidePrice} ticket + £{econ.leaderNetAfterOwnTicket} club fund surplus.</strong>
                  : <strong>helps subsidise your ~£{econ.guidePrice} leader ticket.</strong>}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Tip: Setting a higher non-member price creates a &quot;Lead Magnet&quot; effect, incentivising them to join your community to unlock the cheaper price.
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Visibility</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setIsPublic(true)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: isPublic ? '2px solid var(--teal-500)' : '1px solid var(--slate-700)', background: isPublic ? 'rgba(20,184,166,0.1)' : 'var(--slate-800)', color: 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Globe size={24} color={isPublic ? 'var(--teal-400)' : 'var(--slate-400)'} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Public</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'center' }}>Visible on Discover feed to attract non-members.</span>
              </button>
              <button 
                type="button"
                onClick={() => setIsPublic(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: !isPublic ? '2px solid var(--teal-500)' : '1px solid var(--slate-700)', background: !isPublic ? 'rgba(20,184,166,0.1)' : 'var(--slate-800)', color: 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Lock size={24} color={!isPublic ? 'var(--teal-400)' : 'var(--slate-400)'} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Private</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'center' }}>Only visible to your community members.</span>
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Capacity</label>
            <div style={{ position: 'relative' }}>
              <Users size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
              <input 
                type="number" 
                min={1}
                max={experience.spotsLeft}
                required
                value={maxCapacity} 
                onChange={e => setMaxCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary interactive-press" style={{ padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, marginTop: '8px' }}>
            Host this Experience
          </button>

        </form>
      </div>
    </div>
  );
}
