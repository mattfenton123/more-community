"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../../../src/context/AppContext';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck, Ticket } from 'lucide-react';
import { useToast } from '../../../../src/components/Toast';

export default function ExperienceCheckout() {
  const { id } = useParams();
  const router = useRouter();
  const { experiences, communities } = useAppContext();
  const { toast } = useToast();
  const [checkoutState, setCheckoutState] = useState('idle'); // idle, processing, success
  
  const exp = experiences?.find(e => e.id === id);
  const community = exp ? communities?.find(c => c.id === exp.communityId) : null;

  if (!exp) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-950)', color: 'white' }}>
        Experience not found.
      </div>
    );
  }

  const totalPrice = Math.round(exp.basePrice * (1 + exp.leaderMarkup / 100));

  const handleCheckout = () => {
    setCheckoutState('processing');
    // Simulate payment processing
    setTimeout(() => {
      setCheckoutState('success');
      toast.success('Payment successful!');
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-950)', color: 'white', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ marginLeft: '1rem', fontFamily: "'Syne', sans-serif", fontSize: '1.15rem', fontWeight: 700 }}>Secure Checkout</h1>
      </div>

      {checkoutState === 'success' ? (
        <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid var(--teal-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--teal-400)' }}>
            <CheckCircle2 size={40} />
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>You're all set!</h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Your ticket for <strong>{exp.title}</strong> has been confirmed. A receipt has been sent to your email.
          </p>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '400px', marginBottom: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
               <span style={{ color: 'var(--slate-400)' }}>Date</span>
               <span style={{ fontWeight: 600 }}>{exp.date || 'TBD'}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
               <span style={{ color: 'var(--slate-400)' }}>Time</span>
               <span style={{ fontWeight: 600 }}>{exp.time || '10:00 AM'}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ color: 'var(--slate-400)' }}>Location</span>
               <span style={{ fontWeight: 600 }}>{exp.location}</span>
             </div>
          </div>

          <button onClick={() => router.push(`/community/${exp.communityId}`)} className="btn btn-primary interactive-press" style={{ width: '100%', maxWidth: '400px', padding: '16px', borderRadius: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Ticket size={20} /> View Ticket
          </button>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Summary Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{exp.title}</h2>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Hosted by {community?.name || 'Community Leader'}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'var(--slate-300)' }}>Total (incl. fees)</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--teal-400)' }}>£{totalPrice}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Payment Method</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--teal-500)', borderRadius: '12px', padding: '1rem' }}>
              <CreditCard size={24} color="var(--teal-400)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Apple Pay</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Default payment method</div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--teal-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }}></div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'var(--slate-400)', fontSize: '0.85rem', marginBottom: '2rem' }}>
            <ShieldCheck size={16} color="var(--teal-500)" />
            Payments are secure and encrypted
          </div>

          {/* Checkout Button */}
          <button 
            onClick={handleCheckout} 
            disabled={checkoutState === 'processing'}
            className="btn btn-primary interactive-press" 
            style={{ 
              width: '100%', padding: '18px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 600,
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              opacity: checkoutState === 'processing' ? 0.7 : 1
            }}
          >
            {checkoutState === 'processing' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                Processing...
              </span>
            ) : (
              `Pay £${totalPrice}`
            )}
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
