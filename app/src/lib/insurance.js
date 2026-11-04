import { jsPDF } from 'jspdf';
import { cleanLocationName } from './location';

export const LEADER_PRO_CONFIG = {
  monthlyPrice: 16.50,
  annualPrice: 165.00,
  coverAmount: 'Full Venue Compliance',
  underwriter: 'MORE Community Safety & Compliance Standards',
  schemeName: 'Community Leader Compliance & Safety Pack',
  perks: [
    {
      id: 'rams',
      title: '1-Click Venue RAMS Generator',
      badge: 'Instant PDF',
      desc: 'Auto-generate tailored Risk Assessment & Method Statement documents with hazard controls required by council parks, church halls, and venues.'
    },
    {
      id: 'waivers',
      title: 'Automated Attendee Health & Safety Waivers',
      badge: 'Audit Trail',
      desc: 'Digital liability waivers and fitness-to-participate disclaimers captured automatically on RSVP with timestamped audit logs.'
    },
    {
      id: 'fees',
      title: '2% Reduced Platform Ticket Fee',
      badge: 'Save 60% on Fees',
      desc: 'Keep 98% of your paid event ticket revenue (reduced from 5% standard; standard Stripe card processing fees apply).'
    },
    {
      id: 'badge',
      title: 'Verified Leader & Safety Badge',
      badge: 'Higher Trust',
      desc: 'Display the verified trust shield on your community microsite and event listings, reassuring new members and venues.'
    },
    {
      id: 'boost',
      title: 'Priority Local Discovery',
      badge: 'Growth Engine',
      desc: 'Featured placement in the Tunbridge Wells discovery feed, search suggestions, and weekly member digests.'
    },
    {
      id: 'guidance',
      title: 'Venue Compliance & Insurance Guidance',
      badge: 'Venue Ready',
      desc: 'Guidance and document checklist for council and venue permits, with direct access to recommended community group PLI brokers if required.'
    }
  ]
};

export const STANDARD_LIABILITY_WAIVER = `By RSVPing and attending this community event, I acknowledge that participation is voluntary. I confirm that I am in suitable health and physical condition to take part. I agree to adhere to all safety guidelines and instructions provided by the community organizers. I understand that the organizers carry out risk assessments and safety protocols, but I remain personally responsible for my own safety, belongings, and well-being during the event.`;

/**
 * Generates an official, branded Venue Safety & Compliance Declaration PDF using vector drawing.
 */
export function generateSafetyDeclarationPdf({ community, leaderName, policyNumber, expiryDate }) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const commName = community?.name || 'Community';
  const organizer = leaderName || 'Registered Community Leader';
  const policyNo = policyNumber || `MC-SAFE-2026-${(community?.id || 'COMM').slice(0, 6).toUpperCase()}`;
  const validUntil = expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const issueDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Border & Header Accents
  pdf.setDrawColor(20, 184, 166); // Teal
  pdf.setLineWidth(1.2);
  pdf.rect(10, 10, 190, 277);

  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.3);
  pdf.rect(12, 12, 186, 273);

  // Top header bar
  pdf.setFillColor(15, 23, 42); // Deep slate
  pdf.rect(12, 12, 186, 28, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text('MORE COMMUNITY COMPLIANCE', 105, 24, { align: 'center' });

  pdf.setFontSize(8.5);
  pdf.setTextColor(45, 212, 191); // Teal accent
  pdf.text('VENUE SAFETY & RISK MANAGEMENT DECLARATION', 105, 32, { align: 'center' });

  // Certificate Intro
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('TO VENUE MANAGERS & LOCAL AUTHORITIES', 105, 48, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('This document certifies that the community group named below operates under', 105, 54, { align: 'center' });
  pdf.text('MORE Community Leader Pro Health, Safety & Venue Risk Management Standards.', 105, 59, { align: 'center' });

  // Details Table Box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(20, 68, 170, 120, 3, 3, 'FD');

  const rows = [
    ['Named Community:', commName],
    ['Lead Organizer:', organizer],
    ['Compliance Reference:', policyNo],
    ['Operating Framework:', 'MORE Leader Pro Safety & Venue Compliance Pack'],
    ['Attendee Safety Protocol:', 'Digital liability waiver & emergency contact required on RSVP'],
    ['Risk Assessment (RAMS):', 'Full 5-step hazard identification & control measures filed'],
    ['First Aid & Escalation:', 'Designated first aid protocol & 999 emergency procedure'],
    ['Sanctioned Activities:', 'Community social gatherings, guided walks, amateur fitness, creative workshops, networking & venue hire'],
    ['Territorial Limits:', 'Great Britain, Northern Ireland, the Channel Islands and Isle of Man'],
    ['Validity Period:', `From ${issueDate} to ${validUntil} (12 Months)`]
  ];

  let currentY = 78;
  rows.forEach(([label, value], idx) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(label, 26, currentY);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    const splitValue = pdf.splitTextToSize(value, 95);
    pdf.text(splitValue, 85, currentY);

    currentY += Math.max(splitValue.length * 4.5, 9.5);

    if (idx < rows.length - 1) {
      pdf.setDrawColor(241, 245, 249);
      pdf.setLineWidth(0.2);
      pdf.line(26, currentY - 2.5, 184, currentY - 2.5);
    }
  });

  // Important Conditions Section
  pdf.setFillColor(240, 253, 250); // Light teal tint
  pdf.setDrawColor(153, 246, 228);
  pdf.roundedRect(20, 196, 170, 48, 3, 3, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 118, 110);
  pdf.text('VENUE CO-OPERATION & RISK PROTOCOLS', 26, 204);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  const notes = [
    '• Risk Management: Organizers maintain documented event risk assessments (RAMS) and participant briefing procedures for all scheduled events.',
    '• Attendee Waivers: All participants acknowledge health, safety, and personal responsibility disclaimers prior to admission.',
    '• Independent Insurance Notice: Where a venue requires commercial Public Liability Insurance, organizers attach their independent insurance certificate to this compliance pack. Contact compliance@morecommunity.app for verification.'
  ];
  let noteY = 211;
  notes.forEach(note => {
    const splitNote = pdf.splitTextToSize(note, 158);
    pdf.text(splitNote, 26, noteY);
    noteY += splitNote.length * 4 + 2;
  });

  // Signatures / Seals
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.4);
  pdf.line(26, 265, 85, 265);
  pdf.line(125, 265, 184, 265);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('MORE Community Standards', 26, 270);
  pdf.text('Registered Community Organizer', 125, 270);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Issued on behalf of MORE Community Platform • ${issueDate}`, 26, 274);
  pdf.text(organizer, 125, 274);

  // Save PDF
  const cleanFileName = `MORE-Venue-Compliance-${commName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  pdf.save(cleanFileName);
}

// Backwards-compatible alias for existing callers
export const generatePliCertificatePdf = generateSafetyDeclarationPdf;

/**
 * Generates an official 2-Page Risk Assessment & Method Statement (RAMS) PDF for venue and council approvals.
 */
export function generateRamsPdf({ community, event, leaderName, policyNumber }) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const commName = community?.name || 'Community';
  const evTitle = event?.title || 'Community Gathering';
  const evDate = event?.date || 'Scheduled Date';
  const evTime = event?.time || '10:00';
  const evLoc = cleanLocationName(event?.location || 'Designated Venue / Meeting Point');
  const lead = leaderName || 'Lead Organizer';
  const policyNo = policyNumber || `MC-SAFE-2026-${(community?.id || 'COMM').slice(0, 6).toUpperCase()}`;
  const capacity = event?.maxCapacity || event?.attendees || 25;

  // Header Box
  pdf.setFillColor(15, 23, 42);
  pdf.rect(10, 10, 190, 24, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('EVENT RISK ASSESSMENT & METHOD STATEMENT (RAMS)', 105, 20, { align: 'center' });

  pdf.setFontSize(8.5);
  pdf.setTextColor(45, 212, 191);
  pdf.text('Statutory Health, Safety & Venue Compliance Document • MORE Community Shield', 105, 28, { align: 'center' });

  // Section 1: Event Summary
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. EVENT & ORGANIZER PARTICULARS', 12, 42);

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(12, 46, 186, 36, 2, 2, 'FD');

  const metaCols = [
    ['Event Title:', evTitle],
    ['Community Group:', commName],
    ['Date & Time:', `${evDate} at ${evTime}`],
    ['Venue / Start Point:', evLoc],
    ['Lead Organizer:', lead],
    ['Expected Attendees:', `Approx. ${capacity} participants`],
    ['Safety Compliance:', `Venue RAMS & Waivers (Ref: ${policyNo})`],
    ['First Aider on Site:', `${lead} (First Aid Kit Carried)`]
  ];

  metaCols.forEach(([lbl, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 16 : 108;
    const y = 53 + (row * 7.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(lbl, x, y);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(pdf.splitTextToSize(val, 55)[0], x + 34, y);
  });

  // Section 2: Hazard Identification & Risk Matrix
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('2. HAZARD IDENTIFICATION & CONTROL MEASURES', 12, 90);

  // Table Header
  pdf.setFillColor(30, 41, 59);
  pdf.rect(12, 94, 186, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Hazard / Activity', 16, 99.5);
  pdf.text('Who is at Risk', 62, 99.5);
  pdf.text('Initial Risk', 92, 99.5);
  pdf.text('Control Measures & Mitigations', 116, 99.5);
  pdf.text('Residual', 184, 99.5);

  const hazards = [
    {
      hazard: 'Slips, Trips & Falls\n(Wet paths, uneven trails, steps)',
      risk: 'Members & Public',
      initial: 'Med',
      controls: 'Pre-event route inspection. Briefing on suitable footwear. Avoid unlit or icy paths. Lead walks at comfortable pace with sweeper.',
      res: 'Low'
    },
    {
      hazard: 'Road Crossings & Traffic\n(Urban routes, road transit)',
      risk: 'Pedestrians',
      initial: 'High',
      controls: 'Use designated signalized or zebra crossings only. Group waits for full clearance before proceeding. High-vis worn in dim light.',
      res: 'Low'
    },
    {
      hazard: 'Adverse Weather\n(Extreme heat, heavy rain, gale)',
      risk: 'All Participants',
      initial: 'Med',
      controls: 'Continuous Met Office forecast monitoring. Hydration reminders. Dynamic cancellation/postponement policy if severe weather warnings issued.',
      res: 'Low'
    },
    {
      hazard: 'Medical Emergency\n(Sudden illness, fainting, sprain)',
      risk: 'Affected Member',
      initial: 'Med',
      controls: 'Equipped First Aid kit carried by organizer. Mobile phone charged for 999 escalation. Emergency contact details stored in digital RSVP app.',
      res: 'Low'
    },
    {
      hazard: 'Lost / Separated Persons\n(Large groups, parkland trails)',
      risk: 'New Members',
      initial: 'Med',
      controls: 'Roll-call check-in via QR code at start and finish. Co-leader acts as rear sweeper. Agreed regrouping checkpoints every 15-20 minutes.',
      res: 'Low'
    }
  ];

  let tableY = 102;
  hazards.forEach((h, idx) => {
    pdf.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    pdf.rect(12, tableY, 186, 17, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.line(12, tableY + 17, 198, tableY + 17);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(h.hazard.split('\n')[0], 16, tableY + 5.5);
    if (h.hazard.includes('\n')) {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(h.hazard.split('\n')[1], 16, tableY + 9.5);
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(h.risk, 62, tableY + 7);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(h.initial === 'High' ? 220 : 180, h.initial === 'High' ? 38 : 100, 38);
    pdf.text(h.initial, 94, tableY + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    const splitCtrl = pdf.splitTextToSize(h.controls, 64);
    pdf.text(splitCtrl, 116, tableY + 5.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(22, 163, 74);
    pdf.text(h.res, 186, tableY + 7);

    tableY += 17;
  });

  // Section 3: Emergency Protocol & Declaration
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('3. EMERGENCY ESCALATION & SIGN-OFF', 12, 198);

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(12, 202, 186, 68, 2, 2, 'FD');

  const emergencySteps = [
    '1. Primary Care: Assess airway, breathing, circulation. Administer basic first aid from kit.',
    '2. Emergency Services: Call 999/112 immediately if condition is critical, head trauma, or fracture suspected.',
    '3. What3Words / Exact Coordinates: Provide precise GPS pin to paramedics from the MORE event map pin.',
    '4. Incident Reporting: File an incident report within 24 hours on the MORE Community Leader dashboard for compliance log.'
  ];

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Emergency Response Procedure:', 16, 209);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  emergencySteps.forEach((s, idx) => {
    pdf.text(s, 16, 215 + (idx * 5));
  });

  // Sign-off signature block
  pdf.line(16, 254, 85, 254);
  pdf.line(116, 254, 185, 254);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Lead Organizer Signature:', 16, 259);
  pdf.text('Date of Risk Assessment:', 116, 259);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(lead, 16, 264);
  pdf.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 116, 264);

  const cleanEvName = `MORE-RAMS-${evTitle.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  pdf.save(cleanEvName);
}
