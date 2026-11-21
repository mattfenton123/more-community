"use client";
import { Suspense } from 'react';
import PartnerHub from '../../src/views/PartnerHub';

export default function PartnerPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-muted)' }}>Loading Partner &amp; Sponsor Portal...</div>}>
      <PartnerHub />
    </Suspense>
  );
}
