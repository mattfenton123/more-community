"use client";
import React from 'react';
import AppHeader from '../../../src/components/AppHeader';

export default function PrivacyPolicy() {
  return (
    <div className="view-legal" style={{ minHeight: '100dvh', paddingBottom: '100px', background: 'var(--slate-950)' }}>
      <AppHeader title="Privacy Policy" showBack={true} />
      <div style={{ padding: '20px', color: 'var(--slate-300)', lineHeight: '1.6' }}>
        <h1 style={{ color: 'var(--white)', fontSize: '1.5rem', marginBottom: '16px' }}>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>1. Introduction</h2>
        <p>Welcome to more. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>2. Data We Collect</h2>
        <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier, and date of birth.</li>
          <li><strong>Contact Data:</strong> includes email address and location.</li>
          <li><strong>Profile Data:</strong> includes your interests, communities joined, and events attended.</li>
        </ul>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>3. How We Use Your Data</h2>
        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
          <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
          <li>Where we need to comply with a legal obligation.</li>
        </ul>
      </div>
    </div>
  );
}
