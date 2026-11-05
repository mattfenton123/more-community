"use client";
import React from 'react';
import AppHeader from '../../../src/components/AppHeader';

export default function TermsOfUse() {
  return (
    <div className="view-legal" style={{ minHeight: '100dvh', paddingBottom: '100px', background: 'var(--slate-950)' }}>
      <AppHeader title="Terms of Use" showBack={true} />
      <div style={{ padding: '24px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--slate-300)', lineHeight: '1.7', fontSize: '0.92rem' }}>
        <h1 style={{ color: 'var(--white)', fontSize: '1.75rem', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.82rem', marginBottom: '24px' }}>Last updated: March 2026</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>1. Acceptance of Terms</h2>
        <p>By accessing and using more. ("More Community"), you agree to be bound by these Terms of Service, our Privacy Policy, and any community-specific safety guidelines. If you do not agree, do not use the platform.</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>2. Real-World Community Meetups &amp; Safety</h2>
        <p>more. is a platform that connects local clubs, organisers, and members for in-person activities. Participation in any meetup, sports session, walk, or workshop is voluntary. Attendees are responsible for assessing their personal fitness and suitability for activities. Leaders must operate within local council regulations and safety standards.</p>
        
        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>3. Paid Events, Tickets &amp; Payment Processing</h2>
        <p>All ticket purchases, sponsorship contributions, and subscription payments on more. are securely processed through Stripe. By purchasing a ticket or sponsoring a club, you authorise Stripe to charge your designated payment method.</p>
        <ul>
          <li><strong>Ticket Pricing:</strong> Prices displayed on event pages are final and inclusive of applicable fees unless explicitly stated.</li>
          <li><strong>Platform &amp; Processing Fees:</strong> Standard card processing fees apply. Leader Pro subscribers benefit from reduced 2% platform fees.</li>
          <li><strong>Zero Card Data Storage:</strong> more. never stores credit or debit card numbers on our servers. All sensitive financial information is handled on Stripe's PCI-DSS Level 1 certified infrastructure.</li>
        </ul>

        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>4. Cancellations &amp; Refund Policy</h2>
        <ul>
          <li><strong>Event Cancelled by Organiser:</strong> If a leader or co-host cancels an event for any reason (including weather or venue issues), all registered ticket holders will receive an automatic 100% full refund to their original payment method.</li>
          <li><strong>Member Cancellation:</strong> Members may cancel their RSVP and request a refund in accordance with the event's stated cancellation window (typically up to 24 hours prior to the event start time).</li>
          <li><strong>Unattended Events:</strong> No-shows or failure to attend without prior notice are non-refundable.</li>
        </ul>

        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>5. Community Leader Responsibilities &amp; Fiduciary Duty</h2>
        <p>Community Leaders and Co-Leaders who collect ticket revenue or sponsorships act in a position of trust for their attendees and members:</p>
        <ul>
          <li><strong>Duty of Delivery:</strong> Leaders agree to deliver scheduled events as described or provide immediate refunds.</li>
          <li><strong>Stripe Connect Payouts:</strong> Revenue from paid events is disbursed via Stripe Express Connect subject to standard settlement schedules to protect against disputes, chargebacks, and cancellations.</li>
          <li><strong>Taxes &amp; Compliance:</strong> Organisers are responsible for any applicable local taxes or statutory obligations associated with their activities.</li>
        </ul>

        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>6. Suspension, Removal &amp; What Happens to Funds</h2>
        <p>To keep the community safe, more. reserves the right to suspend or permanently remove any user, member, leader, or partner who violates our Code of Conduct, engages in harassment, endangers participant safety, or engages in fraudulent activity.</p>
        <ul>
          <li><strong>If a Member is Removed:</strong> A member removed for code-of-conduct violations forfeits access immediately. Upcoming paid tickets may be refunded at the discretion of the platform.</li>
          <li><strong>If a Leader is Removed After Collecting Money:</strong>
            <ol style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li><strong>Pending Event Protection:</strong> If the leader was holding money for upcoming events that cannot take place, the events will be cancelled and <strong>100% of ticket fees will be refunded directly to attendees</strong>.</li>
              <li><strong>Co-Host Continuity:</strong> Where a qualified Co-Leader or Co-Host is active in the community, leadership may be transferred to the co-leader so scheduled meetups can proceed safely for members.</li>
              <li><strong>Payout Freeze:</strong> Pending Stripe payouts to a removed leader will be frozen to cover chargebacks, bank disputes, or attendee refunds. Funds will not be disbursed until all member claims are settled.</li>
            </ol>
          </li>
        </ul>

        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>7. Sponsorships &amp; Local Business Perks</h2>
        <p>Sponsorships are intended to support grassroots community groups. Local businesses receive banner placement, in-feed announcements, and perk promotion across their chosen catchment area. 80% of sponsorship fees are routed directly to club leader funds to support equipment, hall hire, and community meetups.</p>

        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>8. Limitation of Liability</h2>
        <p>more. acts as a discovery and coordination platform for independent clubs and organizers. To the maximum extent permitted by UK law, more. shall not be liable for indirect, incidental, or consequential damages resulting from event attendance, transport, injuries, or third-party venue conditions.</p>

        <h2 style={{ color: 'var(--teal-400)', fontSize: '1.15rem', marginTop: '28px', marginBottom: '8px', fontWeight: 700 }}>9. Contact &amp; Dispute Resolution</h2>
        <p>If you have any questions regarding these terms, payment disputes, or safety concerns, please contact our community support team at <strong>support@morecommunity.app</strong>.</p>
      </div>
    </div>
  );
}
