"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../src/components/AppHeader';
import CommunityOnboardingFlow from '../../src/views/CommunityOnboardingFlow';

export default function CreateCommunityPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-canvas)', color: 'var(--ink-primary)' }}>
      <AppHeader 
        title="Start a Community" 
        showBack={true} 
        onBack={() => router.push('/app')}
      />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '10px 16px 80px' }}>
        <CommunityOnboardingFlow onComplete={() => router.push('/app')} />
      </div>
    </div>
  );
}
