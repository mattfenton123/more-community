"use client";
import React from 'react';
import AppHeader from '../../../src/components/AppHeader';

export default function CookiesPolicy() {
  return (
    <div className="view-legal" style={{ minHeight: '100dvh', paddingBottom: '100px', background: 'var(--slate-950)' }}>
      <AppHeader title="Cookies Policy" showBack={true} />
      <div style={{ padding: '20px', color: 'var(--slate-300)', lineHeight: '1.6' }}>
        <h1 style={{ color: 'var(--white)', fontSize: '1.5rem', marginBottom: '16px' }}>Cookies Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>1. What are cookies?</h2>
        <p>Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>2. How we use cookies</h2>
        <p>We use cookies to enhance your experience on more. by remembering your preferences (like your dark/light mode theme), keeping you logged in, and understanding how you use our platform so we can improve it.</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>3. Types of cookies we use</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Essential cookies:</strong> Required for the operation of our platform.</li>
          <li><strong>Functionality cookies:</strong> Used to recognise you and remember your preferences.</li>
          <li><strong>Analytical cookies:</strong> Help us understand how visitors interact with the app.</li>
        </ul>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.2rem', marginTop: '24px' }}>4. Managing cookies</h2>
        <p>You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this platform may become inaccessible or not function properly.</p>
      </div>
    </div>
  );
}
