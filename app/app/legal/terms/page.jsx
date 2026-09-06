"use client";
import React from 'react';
import AppHeader from '../../../src/components/AppHeader';

export default function TermsOfUse() {
  return (
    <div className="view-legal" style={{ minHeight: '100dvh', paddingBottom: '100px', background: 'var(--slate-950)' }}>
      <AppHeader title="Terms of Use" showBack={true} />
      <div style={{ padding: '20px', color: 'var(--slate-300)', lineHeight: '1.6' }}>
        <h1 style={{ color: 'var(--white)', fontSize: '1.5rem', marginBottom: '16px' }}>Terms of Use</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>1. Acceptance of Terms</h2>
        <p>By accessing and using more., you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>2. User Conduct</h2>
        <p>You agree to use more. only for lawful purposes. You agree not to take any action that might compromise the security of the site, render the site inaccessible to others or otherwise cause damage to the site or its content.</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>3. Community Guidelines</h2>
        <p>more. is a platform for communities. Community leaders are responsible for the management of their communities. Users must adhere to community-specific guidelines as well as our overarching principles of respect and inclusivity.</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>4. Limitation of Liability</h2>
        <p>In no event will more., or its suppliers or licensors, be liable with respect to any subject matter of this agreement under any contract, negligence, strict liability or other legal or equitable theory for: (i) any special, incidental or consequential damages; (ii) the cost of procurement for substitute products or services; (iii) for interruption of use or loss or corruption of data.</p>
      </div>
    </div>
  );
}
