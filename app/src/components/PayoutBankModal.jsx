"use client";
import React, { useState } from 'react';
import { Building2, Check, X, Shield, Lock, CreditCard, ChevronRight, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useToast } from './Toast';

const UK_BANKS = [
  'Barclays UK',
  'Monzo Bank',
  'NatWest',
  'Lloyds Bank',
  'Starling Bank',
  'HSBC UK',
  'Santander UK',
  'Halifax',
  'Nationwide Building Society',
  'Revolut UK',
  'Royal Bank of Scotland (RBS)',
  'TSB Bank',
  'Co-operative Bank',
  'Other UK Bank'
];

export default function PayoutBankModal({ isOpen, onClose, community, onBankSaved }) {
  const { toast } = useToast();
  const [accountType, setAccountType] = useState('personal'); // 'personal' | 'business'
  const [bankName, setBankName] = useState('Monzo Bank');
  const [accountName, setAccountName] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Format sort code as XX-XX-XX
  const handleSortCodeChange = (e) => {
    let raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    if (raw.length > 4) {
      raw = `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}`;
    } else if (raw.length > 2) {
      raw = `${raw.slice(0, 2)}-${raw.slice(2)}`;
    }
    setSortCode(raw);
  };

  const handleAccountNumberChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
    setAccountNumber(raw);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanSort = sortCode.replace(/-/g, '');
    if (cleanSort.length !== 6) {
      toast.error('Invalid Sort Code', 'UK sort code must be 6 digits (e.g. 04-00-04)');
      return;
    }
    if (accountNumber.length !== 8) {
      toast.error('Invalid Account Number', 'UK account number must be 8 digits');
      return;
    }
    if (!accountName.trim()) {
      toast.error('Missing Account Name', 'Please provide the name on the account');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const last4 = accountNumber.slice(-4);
      const maskedSort = sortCode.slice(0, 2) + '-••-••';
      const bankData = {
        bankName,
        accountName: accountName.trim(),
        sortCodeMasked: maskedSort,
        accountMasked: '••••' + last4,
        accountType,
        last4,
        linkedAt: new Date().toISOString(),
        isCustom: true
      };

      if (onBankSaved) {
        onBankSaved(bankData);
      }

      toast.success('Payout Account Linked!', `${bankName} (•••• ${last4}) is set up for automatic Faster Payments.`);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100000,
      background: 'rgba(5, 10, 20, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="modal-content glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 16, 30, 0.98) 100%)',
        border: '1px solid rgba(45, 212, 191, 0.3)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(20, 184, 166, 0.15)',
        padding: '28px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)',
              border: '1px solid rgba(45, 212, 191, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--teal-400)'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                Set Up Payout Bank
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                Direct UK Faster Payments payouts to your account
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="interactive-press"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--slate-400)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Security / No-Stripe Redirect Banner */}
        <div style={{
          background: 'rgba(20, 184, 166, 0.08)',
          border: '1px solid rgba(45, 212, 191, 0.25)',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <Lock size={16} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--teal-200)', lineHeight: 1.4 }}>
            <strong>100% In-App Setup:</strong> No external accounts or separate merchant signups. Enter your bank details once and ticket revenue transfers directly via automated UK Faster Payments.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Account Type Toggle */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Account Classification</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setAccountType('personal')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: accountType === 'personal' ? '1px solid var(--teal-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: accountType === 'personal' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: accountType === 'personal' ? 'var(--teal-300)' : 'var(--slate-400)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Personal Account
              </button>
              <button
                type="button"
                onClick={() => setAccountType('business')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: accountType === 'business' ? '1px solid var(--teal-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: accountType === 'business' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: accountType === 'business' ? 'var(--teal-300)' : 'var(--slate-400)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Club / Business Account
              </button>
            </div>
          </div>

          {/* Bank Provider */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Bank or Building Society</label>
            <select
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '10px',
                background: 'var(--slate-800)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              {UK_BANKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Account Holder Name */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Account Holder Name *</label>
            <input 
              required
              type="text"
              placeholder={accountType === 'personal' ? 'e.g. David J. Smith' : 'e.g. Heathfield Community Club'}
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Sort Code & Account Number Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Sort Code (6 digits) *</label>
              <input 
                required
                type="text"
                placeholder="00-00-00"
                value={sortCode}
                onChange={handleSortCodeChange}
                maxLength={8}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Account Number (8 digits) *</label>
              <input 
                required
                type="text"
                placeholder="12345678"
                value={accountNumber}
                onChange={handleAccountNumberChange}
                maxLength={8}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline interactive-press"
              style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary interactive-press"
              style={{ padding: '10px 22px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700 }}
            >
              {isSubmitting ? 'Linking Bank...' : 'Save Payout Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
