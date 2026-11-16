import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, 'app', 'public', 'images');
const OUT_DIR = path.join(ROOT, 'app', 'public');

function loadImageDataUri(relPath) {
  const full = path.join(IMG_DIR, relPath);
  const ext = path.extname(full).toLowerCase().slice(1);
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const b64 = fs.readFileSync(full).toString('base64');
  return `data:${mime};base64,${b64}`;
}

const ASSETS = {
  logo: loadImageDataUri('logo.png'),
  leaders: loadImageDataUri('leaders-opt.jpg'),
  adventure: loadImageDataUri('adventure-opt.jpg'),
  running: loadImageDataUri('running-opt.jpg'),
  walking: loadImageDataUri('walking-opt.jpg'),
  wellness: loadImageDataUri('wellness-opt.jpg'),
  creative: loadImageDataUri('heroes/tw-creative-collective-opt.jpg'),
  interfaith: loadImageDataUri('heroes/tw-interfaith-network-opt.jpg'),
  mindful: loadImageDataUri('heroes/mindful-miles-opt.jpg'),
  entrepreneurs: loadImageDataUri('entrepreneurs-opt.jpg'),
  charity: loadImageDataUri('charity-opt.jpg'),
  twHero: loadImageDataUri('marketing/tw_community_hero.jpg'),
  pantiles: loadImageDataUri('marketing/the_pantiles_coffee_banner.jpg'),
};

const GUIDES = [
  {
    filename: 'more-community-leader-guide.pdf',
    docTitle: 'More Community — For Community Leaders',
    theme: {
      accentDark: '#0f766e',
      accentLight: '#14b8a6',
      softBg: '#ccfbf1',
    },
    photos: {
      p1Bg: { src: ASSETS.leaders, pos: 'center center' },
      p2Side: { src: ASSETS.mindful, pos: 'center center' },
      p2Bottom: { src: ASSETS.adventure, pos: 'center center' },
      p3Banner: { src: ASSETS.running, pos: 'center 35%' },
      p3Gallery: [
        { src: ASSETS.walking, pos: 'center center' },
        { src: ASSETS.wellness, pos: 'center center' },
        { src: ASSETS.creative, pos: 'center center' },
      ],
      p4Bg: { src: ASSETS.interfaith, pos: 'center 42%' },
    },
    p1: {
      badge: 'FOR COMMUNITY LEADERS',
      eyebrow: 'FREE FOR ORGANISERS',
      headline: 'The free app for<br>community leaders.',
      subtitle: 'Everything a community leader needs to host events, message members and grow a thriving group — free forever for organisers, with zero monthly fees.',
      pills: ['Free forever', 'AI events & flyers', 'Co-hosts & QR check-in'],
    },
    p2: {
      sideCaption: 'Lead with More Community.',
      eyebrow: 'THE OPPORTUNITY',
      headline: 'Leading should<br>feel good.',
      intro: 'Whether you run a walking group of ten or a club of five hundred, the work is the same: chasing RSVPs, answering directions and paying for tools yourself. More Community gives you the full app free — removing admin with AI event tools, printable flyers and member CRM.',
      calloutEyebrow: 'SUSTAINABLE COMMUNITIES',
      calloutTitle: 'Run free forever — fund your club when you choose',
      calloutBody: 'Free events and core leader tools always cost £0. As your group grows, optionally switch on paid memberships, ticketed events or local sponsorships inside your dashboard (80% goes straight to your club fund) via UK Faster Payments.',
      rows: [
        {
          icon: '🛡️',
          title: 'Venue & safety ready',
          desc: 'When venues or councils ask, unlock 1-click PDF RAMS packs, digital attendee waivers and safety check-ins right inside your dashboard.',
        },
        {
          icon: '📣',
          title: 'AI events and flyers',
          desc: 'Draft events with AI, design flyers with 20 fonts, set recurring schedules and share via WhatsApp.',
        },
        {
          icon: '📈',
          title: 'Member CRM and retention',
          desc: 'Track Active, Engaged, Slipping and Inactive members, delegate to co-hosts and automate welcome reminders.',
        },
      ],
    },
    p3: {
      eyebrow: 'WHAT YOU GET',
      headline: 'Everything a leader needs — free',
      cards: [
        {
          icon: '💰',
          title: 'Free core & club fundraising',
          desc: 'Free meetups cost £0 forever. Optionally add paid tickets, memberships or local sponsorships (80% to your club fund) paid out to your UK bank.',
        },
        {
          icon: '🛡️',
          title: 'Venue & safety ready',
          desc: 'Unlock instant council/venue PDF RAMS packs, digital member waivers and day-of safety check-ins from your dashboard when needed.',
        },
        {
          icon: '📅',
          title: 'QR check-in and calendar sync',
          desc: 'Recurring events, live calendar feeds, branded digital tickets, QR check-in and clear meeting map links.',
        },
        {
          icon: '🤖',
          title: 'AI event and flyer studio',
          desc: 'Generate event copy in seconds and export custom flyers with 20 Google Fonts for local noticeboards.',
        },
        {
          icon: '🤝',
          title: 'CRM, triggers and WhatsApp bridge',
          desc: 'Engagement scoring (Active to Inactive), automated reminders, moderation tools and WhatsApp sharing.',
        },
        {
          icon: '📊',
          title: 'You own your audience',
          desc: 'One-click export of your member and attendee list with verified attendance records. No lock-in.',
        },
      ],
    },
    p4: {
      eyebrow: 'THE COMPARISON',
      headline: 'How More Community compares',
      columns: ['SUBSCRIPTION PLATFORMS', 'GROUP CHATS', 'SOCIAL FEEDS'],
      rows: [
        {
          label: 'Cost for organisers',
          more: [true, 'Free forever for leaders'],
          others: [[false, 'Monthly sub + fees'], [true, 'Free'], [true, 'Free']],
        },
        {
          label: 'Funding for your group',
          more: [true, '80% sponsor split & memberships'],
          others: [[false, 'Leader pays fees'], [false, 'None'], [false, 'None']],
        },
        {
          label: 'Venue & safety packs',
          more: [true, 'In-dashboard RAMS & waivers'],
          others: [[false, 'None'], [false, 'None'], [false, 'None']],
        },
        {
          label: 'Retention & Member CRM',
          more: [true, 'Engagement tiers & triggers'],
          others: [[false, 'Basic member list'], [false, 'Manual'], [false, 'None']],
        },
        {
          label: 'Day-of check-in & calendar',
          more: [true, 'QR check-in & calendar feed'],
          others: [[false, 'Clunky'], [false, 'None'], [false, 'None']],
        },
        {
          label: 'Own your member list',
          more: [true, 'One-click export & records'],
          others: [[false, 'Restricted'], [false, 'Phone numbers'], [false, 'Platform owned']],
        },
      ],
      steps: [
        { title: 'Claim your community', desc: 'Create your free profile in minutes with your logo and mission.' },
        { title: 'Post your first event', desc: 'Add the date, meeting point, directions and capacity.' },
        { title: 'Share one link', desc: 'Members RSVP in seconds and add it to their calendar.' },
        { title: 'Welcome everyone', desc: 'Check people in with live check-in and watch your group grow.' },
      ],
      ctaHeadline: 'Ready to lead more?',
      ctaDesc: 'Start your community today. It takes two minutes and core leader tools are free forever.',
      ctaButton: 'Start your community free →',
      ctaUrl: 'https://morecommunity.app/create-community',
    },
  },
  {
    filename: 'more-community-sponsor-guide.pdf',
    docTitle: 'More Community — For Sponsors and Local Businesses',
    theme: {
      accentDark: '#4338ca',
      accentLight: '#818cf8',
      softBg: '#e0e7ff',
    },
    photos: {
      p1Bg: { src: ASSETS.pantiles, pos: 'right center' },
      p2Side: { src: ASSETS.interfaith, pos: 'center center' },
      p2Bottom: { src: ASSETS.walking, pos: 'center center' },
      p3Banner: { src: ASSETS.twHero, pos: 'center 35%' },
      p3Gallery: [
        { src: ASSETS.running, pos: 'center center' },
        { src: ASSETS.walking, pos: 'center center' },
        { src: ASSETS.charity, pos: 'center center' },
      ],
      p4Bg: { src: ASSETS.leaders, pos: 'center 42%' },
    },
    p1: {
      badge: 'FOR SPONSORS AND LOCAL BUSINESSES',
      eyebrow: 'BACK YOUR LOCAL COMMUNITY',
      headline: 'Real people through your door. Real goodwill in your town.',
      subtitle: 'Target local customers by geography, psychographics and demographics — be seen supporting community life, join real group conversations and attract footfall.',
      pills: ['Geo & lifestyle targeting', 'Seen supporting local', 'Chats & venue footfall'],
    },
    p2: {
      sideCaption: 'Back your local community.',
      eyebrow: 'THE OPPORTUNITY',
      headline: 'Marketing that people welcome.',
      intro: 'Generic local ads get ignored. More Community places your brand inside active neighbourhood clubs — letting you target exact towns, lifestyles and demographics while visibly showing residents you back local community life.',
      calloutEyebrow: 'TARGETED LOCAL PRESENCE',
      calloutTitle: 'Reach the right locals — and bring them through your door',
      calloutBody: 'Select communities filtered by geographic location, psychographic interests and member demographics. Connect authentically inside community chats and conversations, earn goodwill for supporting local clubs, and turn regular meetups into high-street footfall.',
      rows: [
        {
          icon: '🎯',
          title: 'Geo, psychographic & demographic targeting',
          desc: 'Choose exact towns and postcodes, shared interests (outdoors, wellness, business) and member demographics that match your customers.',
        },
        {
          icon: '❤️',
          title: 'Seen to be supporting local',
          desc: 'Build lasting town reputation with visible partner badges across club profiles, flyers and every event ticket.',
        },
        {
          icon: '☕',
          title: 'Access chats & attract footfall',
          desc: 'Participate naturally inside community chats and host meetup start points or post-event socials to fill quieter hours.',
        },
      ],
    },
    p3: {
      eyebrow: 'WHAT YOU GET',
      headline: 'How partnership works',
      cards: [
        {
          icon: '🎯',
          title: 'Geo, psychographic & demographic targeting',
          desc: 'Filter clubs by town and catchment (geographic), shared values and hobbies (psychographic) and member profile (demographic).',
        },
        {
          icon: '☕',
          title: 'Attract recurring footfall',
          desc: 'Host groups at your venue for pre-event coffees, start points and post-meetup socials during quieter trading hours.',
        },
        {
          icon: '💬',
          title: 'Access to community chats',
          desc: 'Be present inside active group channels and conversations with warm leader introductions — never cold ad spam.',
        },
        {
          icon: '❤️',
          title: 'Seen to be supporting local',
          desc: 'Earn real community goodwill with your logo and commitment statement prominently placed on club pages and tickets.',
        },
        {
          icon: '🎟️',
          title: 'Ticket perks & member offers',
          desc: 'Feature exclusive member perks directly on branded event tickets so regulars remember and visit your business.',
        },
        {
          icon: '📦',
          title: 'Single-club to town exclusivity',
          desc: 'Back one ideal club, bundle multiple aligned groups or secure town-wide category exclusivity, pitched directly to leaders.',
        },
      ],
    },
    p4: {
      eyebrow: 'THE COMPARISON',
      headline: 'How More Community compares',
      columns: ['SOCIAL ADS', 'FLYERS AND PRINT', 'ONLINE DIRECTORIES'],
      rows: [
        {
          label: 'Audience targeting',
          more: [true, 'Geo, psychographic & demographic'],
          others: [[false, 'Broad guesswork'], [false, 'Blind drops'], [false, 'Untargeted']],
        },
        {
          label: 'Brand perception',
          more: [true, 'Seen to be supporting local'],
          others: [[false, 'Ignored in feed'], [false, 'Seen as junk'], [false, 'Anonymous']],
        },
        {
          label: 'Community access',
          more: [true, 'Chats, channels & conversations'],
          others: [[false, 'One-way ads'], [false, 'No dialogue'], [false, 'Static listing']],
        },
        {
          label: 'Customer visits',
          more: [true, 'Attracts in-person venue footfall'],
          others: [[false, 'Clicks, not visits'], [false, 'Rarely acted on'], [false, 'Little footfall']],
        },
        {
          label: 'Measurability',
          more: [true, 'Ticket perks & partner visibility'],
          others: [[false, 'Hard to trace'], [false, 'No tracking'], [false, 'Limited']],
        },
      ],
      steps: [
        { title: 'Pick target audiences', desc: 'Filter local clubs by town, psychographic interests and demographics.' },
        { title: 'Join the conversation', desc: 'Appear on tickets, profiles and inside community chats as a trusted backer.' },
        { title: 'Attract regular footfall', desc: 'Welcome friendly locals through your door for meetups and member perks.' },
      ],
      ctaHeadline: 'Be part of the community.',
      ctaDesc: 'Reach the exact local customers you want, join real conversations and attract steady footfall.',
      ctaButton: 'Become a community partner →',
      ctaUrl: 'https://morecommunity.app/sponsors',
    },
  },
  {
    filename: 'more-community-provider-guide.pdf',
    docTitle: 'More Community — For Service Providers',
    theme: {
      accentDark: '#c2410c',
      accentLight: '#fb923c',
      softBg: '#ffedd5',
    },
    photos: {
      p1Bg: { src: ASSETS.wellness, pos: 'center center' },
      p2Side: { src: ASSETS.adventure, pos: 'center center' },
      p2Bottom: { src: ASSETS.interfaith, pos: 'center center' },
      p3Banner: { src: ASSETS.mindful, pos: 'center 35%' },
      p3Gallery: [
        { src: ASSETS.creative, pos: 'center center' },
        { src: ASSETS.running, pos: 'center center' },
        { src: ASSETS.leaders, pos: 'center center' },
      ],
      p4Bg: { src: ASSETS.walking, pos: 'center 42%' },
    },
    p1: {
      badge: 'FOR SERVICE PROVIDERS',
      eyebrow: 'SHARE YOUR EXPERTISE',
      headline: 'Grow your practice among people who value it.',
      subtitle: 'Reach engaged local communities with workshops, classes and experiences. Verified Specialist Vault, 24-48h post-event escrow, and free listing.',
      pills: ['Free to list', '24-48h escrow', 'Specialist Vault'],
    },
    p2: {
      sideCaption: 'Share your expertise.',
      eyebrow: 'THE OPPORTUNITY',
      headline: 'Skills deserve a good audience.',
      intro: 'Independent instructors and coaches often juggle expensive booking tools, ad spend and cold audiences. More Community puts you in the Specialist Vault with verified credentials and £5M insurance cover, connecting you 1-on-1 with active local clubs.',
      calloutEyebrow: 'SPECIALIST VAULT & MARKETPLACE',
      calloutTitle: 'Workshops for communities that show up',
      calloutBody: 'Pitch 1-on-1 guest sessions directly to club leaders without cluttering their inbox. Leaders approve in a single tap, ticketed funds sit safely in 24-48h post-event escrow, and you can also list in the hosted experiences marketplace.',
      rows: [
        {
          icon: '🛡️',
          title: 'Specialist Vault credentials',
          desc: 'Display your qualifications and £5M insurance cover so leaders book you with confidence.',
        },
        {
          icon: '📩',
          title: '1-on-1 pitches & Single-Tap Review',
          desc: 'Send tailored session proposals straight to leaders for clean, spam-free single-tap approval.',
        },
        {
          icon: '💳',
          title: '24-48h escrow & pay-as-you-earn fees',
          desc: 'Free to list your workshops — ticketed guest sessions release 24-48h post-event with a simple 5% fee plus Stripe fees.',
        },
      ],
    },
    p3: {
      eyebrow: 'WHAT YOU GET',
      headline: 'Built for practitioners',
      cards: [
        {
          icon: '🛡️',
          title: 'Specialist Vault & £5M cover',
          desc: 'Showcase verified credentials and £5M insurance cover directly to community leaders.',
        },
        {
          icon: '📩',
          title: '1-on-1 spam-free pitches',
          desc: 'Propose guest workshops directly to club leaders with Single-Tap Review approval.',
        },
        {
          icon: '🧘',
          title: 'Hosted experiences marketplace',
          desc: 'List workshops and classes where local members already browse for things to do.',
        },
        {
          icon: '💳',
          title: '24-48h post-event escrow',
          desc: 'Ticketed sessions hold funds safely and pay out 24-48h after the event completes.',
        },
        {
          icon: '💰',
          title: 'Simple pay-as-you-earn fee',
          desc: 'No monthly subscriptions — list free and pay a straightforward 5% platform fee plus Stripe fees only when tickets sell.',
        },
        {
          icon: '📅',
          title: 'Calendar sync & map links',
          desc: 'Attendees get branded digital tickets, calendar reminders and exact meeting directions.',
        },
      ],
    },
    p4: {
      eyebrow: 'THE COMPARISON',
      headline: 'How More Community compares',
      columns: ['BOOKING MARKETPLACES', 'TICKETING TOOLS', 'SOCIAL ADS'],
      rows: [
        {
          label: 'Trust & credentials',
          more: [true, 'Specialist Vault & £5M cover'],
          others: [[false, 'Basic bio'], [false, 'None'], [false, 'Unverified']],
        },
        {
          label: 'Club outreach',
          more: [true, '1-on-1 pitch & Single-Tap Review'],
          others: [[false, 'Cold messaging'], [false, 'No club link'], [false, 'Paid ads only']],
        },
        {
          label: 'Fees',
          more: [true, 'Free to list; 5% fee + Stripe'],
          others: [[false, 'High commission'], [false, 'Per-ticket fees'], [false, 'Ongoing ad spend']],
        },
        {
          label: 'Payment protection',
          more: [true, '24-48h post-event escrow'],
          others: [[false, 'Delayed payouts'], [false, 'Varies'], [false, 'None']],
        },
        {
          label: 'Discovery',
          more: [true, 'Hosted experiences marketplace'],
          others: [[false, 'Bargain hunters'], [false, 'General public'], [false, 'Cold audiences']],
        },
      ],
      steps: [
        { title: 'Apply as a provider', desc: 'Tell us about your practice and qualifications.' },
        { title: 'Build your profile', desc: 'Add your bio, credentials and the sessions you offer.' },
        { title: 'Publish and welcome', desc: 'List your first session and welcome local participants.' },
      ],
      ctaHeadline: 'Share your expertise.',
      ctaDesc: 'Apply today and start reaching communities who value what you do.',
      ctaButton: 'Apply as a service provider →',
      ctaUrl: 'https://morecommunity.app/partner',
    },
  },
  {
    filename: 'more-community-council-guide.pdf',
    docTitle: 'More Community — For Councils and BIDs',
    theme: {
      accentDark: '#1d4ed8',
      accentLight: '#60a5fa',
      softBg: '#dbeafe',
    },
    photos: {
      p1Bg: { src: ASSETS.twHero, pos: 'center center' },
      p2Side: { src: ASSETS.charity, pos: 'center center' },
      p2Bottom: { src: ASSETS.leaders, pos: 'center center' },
      p3Banner: { src: ASSETS.interfaith, pos: 'center 35%' },
      p3Gallery: [
        { src: ASSETS.walking, pos: 'center center' },
        { src: ASSETS.running, pos: 'center center' },
        { src: ASSETS.creative, pos: 'center center' },
      ],
      p4Bg: { src: ASSETS.mindful, pos: 'center 42%' },
    },
    p1: {
      badge: 'FOR COUNCILS AND BIDS',
      eyebrow: 'ACTIVATE YOUR TOWN',
      headline: 'Livelier high streets.<br>Stronger neighbourhoods.',
      subtitle: 'Digital community infrastructure that gets residents out, connected and supporting local business.',
      pills: ['NHS Social Value', 'Trackable GP links', 'Town chapters'],
    },
    p2: {
      sideCaption: 'Activate your town.',
      eyebrow: 'THE OPPORTUNITY',
      headline: 'Connection is local<br>infrastructure.',
      intro: 'Councils and business districts face rising loneliness and pressure on town centres. More Community gives you a live Council Dashboard tracking Social Contact Hours, Treasury Green Book NHS Social Value (£), repeat attendance and GP prescription redemptions.',
      calloutEyebrow: 'CIVIC IMPACT DASHBOARD',
      calloutTitle: 'Measure social value, not just page views',
      calloutBody: 'See active citizens, communities and upcoming events alongside Treasury Green Book NHS Social Value (£) estimates and Social Contact Hours. Generate trackable GP Social Prescription links for patient cohorts and watch redemptions in real time.',
      rows: [
        {
          icon: '📊',
          title: 'Treasury Green Book metrics',
          desc: 'Track Social Contact Hours, NHS Social Value (£) created and local repeat attendance.',
        },
        {
          icon: '🩺',
          title: 'Trackable prescription links',
          desc: 'Generate cohort invite links for GP social prescribing and monitor redemptions.',
        },
        {
          icon: '🌐',
          title: 'Town & sister chapters',
          desc: 'Connect local town chapters and sister-chapter cross-pollination to boost footfall.',
        },
      ],
    },
    p3: {
      eyebrow: 'WHAT YOU GET',
      headline: 'What it means for your town',
      cards: [
        {
          icon: '📊',
          title: 'Council impact dashboard',
          desc: 'Monitor Active Citizens, Communities, Upcoming Events, Social Contact Hours and Repeat Attendance.',
        },
        {
          icon: '💷',
          title: 'NHS Social Value (£)',
          desc: 'Quantify community wellbeing impact using Treasury Green Book social value calculations.',
        },
        {
          icon: '🩺',
          title: 'GP Social Prescription links',
          desc: 'Create trackable invite links for patient cohorts and track verified redemptions.',
        },
        {
          icon: '🏘️',
          title: 'High street footfall',
          desc: 'Groups meet and spend in independent cafes, pubs and shops across your town centre.',
        },
        {
          icon: '🌐',
          title: 'Town & sister chapters',
          desc: 'Support grassroots volunteer leaders with sister-chapter cross-pollination and town alerts.',
        },
        {
          icon: '🛡️',
          title: 'Orderly public space use',
          desc: 'Clear meeting points, capacity limits, QR check-in and 1-click council/venue safety RAMS packs.',
        },
      ],
    },
    p4: {
      eyebrow: 'THE COMPARISON',
      headline: 'How More Community compares',
      columns: ['STATIC WEBSITES', 'PRINTED LEAFLETS', 'SOCIAL MEDIA'],
      rows: [
        {
          label: 'Measurable social impact',
          more: [true, 'Social Contact Hours & NHS Value (£)'],
          others: [[false, 'Page hits only'], [false, 'Untracked'], [false, 'Likes only']],
        },
        {
          label: 'Social prescribing link',
          more: [true, 'Trackable GP links & redemptions'],
          others: [[false, 'Static directory'], [false, 'Easily lost'], [false, 'None']],
        },
        {
          label: 'High street footfall',
          more: [true, 'Groups meet and spend locally'],
          others: [[false, 'Untracked'], [false, 'Untracked'], [false, 'Indirect']],
        },
        {
          label: 'Cross-town growth',
          more: [true, 'Town chapters & sister-chapter model'],
          others: [[false, 'Siloed pages'], [false, 'Local only'], [false, 'Fragmented']],
        },
        {
          label: 'Safety and governance',
          more: [true, 'QR check-in & 1-click RAMS packs'],
          others: [[false, 'None'], [false, 'None'], [false, 'Unmoderated']],
        },
      ],
      steps: [
        { title: 'Partner with us', desc: 'Get in touch to set up a civic or BID partnership.' },
        { title: 'Showcase local groups', desc: 'Feature community chapters across your own channels.' },
        { title: 'Track the impact', desc: 'See participation grow alongside high street vibrancy.' },
      ],
      ctaHeadline: 'Let us activate your town.',
      ctaDesc: 'Talk to us about bringing more people together in your community.',
      ctaButton: 'Start a civic partnership →',
      ctaUrl: 'https://morecommunity.app/council-dashboard',
    },
  },
  {
    filename: 'more-community-collaborator-guide.pdf',
    docTitle: 'More Community — For Co-Hosts and Collaborators',
    theme: {
      accentDark: '#a21caf',
      accentLight: '#e879f9',
      softBg: '#fae8ff',
    },
    photos: {
      p1Bg: { src: ASSETS.charity, pos: 'center center' },
      p2Side: { src: ASSETS.entrepreneurs, pos: 'center center' },
      p2Bottom: { src: ASSETS.wellness, pos: 'center center' },
      p3Banner: { src: ASSETS.creative, pos: 'center 35%' },
      p3Gallery: [
        { src: ASSETS.leaders, pos: 'center center' },
        { src: ASSETS.running, pos: 'center center' },
        { src: ASSETS.walking, pos: 'center center' },
      ],
      p4Bg: { src: ASSETS.interfaith, pos: 'center 42%' },
    },
    p1: {
      badge: 'FOR CO-HOSTS AND COLLABORATORS',
      eyebrow: 'LEAD TOGETHER',
      headline: 'Share the load. Share the joy.',
      subtitle: 'Free tools for co-hosts, volunteers and partner groups to run great real-world experiences together.',
      pills: ['Co-host roles included', 'Network calendar sync', 'Sister chapters'],
    },
    p2: {
      sideCaption: 'Lead together.',
      eyebrow: 'WHY IT MATTERS',
      headline: 'No community should be one person deep.',
      intro: 'Groups stall when one founder runs out of time. More Community makes shared leadership natural — giving organisers free co-host assignments, sister chapters and network events that sync cleanly onto partner calendars.',
      calloutEyebrow: 'SHARED LEADERSHIP',
      calloutTitle: 'Build something that lasts',
      calloutBody: "Assign co-hosts, launch sister chapters across nearby towns and use 'Promote to My Community' to sync partner network events directly onto your group calendar.",
      rows: [
        {
          icon: '👥',
          title: 'Co-host assignments',
          desc: 'Give trusted deputy hosts event and check-in access without sharing passwords.',
        },
        {
          icon: '📅',
          title: 'Promote to My Community',
          desc: 'Sync network events from partner groups straight onto your community calendar.',
        },
        {
          icon: '🌐',
          title: 'Sister-chapter model',
          desc: 'Cross-pollinate events and welcome roaming members across neighbouring chapters.',
        },
      ],
    },
    p3: {
      eyebrow: 'WHAT YOU GET',
      headline: 'Tools for teams',
      cards: [
        {
          icon: '👥',
          title: 'Co-host role assignments',
          desc: 'Delegate event hosting and day-of check-ins to trusted volunteers cleanly.',
        },
        {
          icon: '📅',
          title: 'Network calendar sync',
          desc: "Use 'Promote to My Community' to cross-promote partner events on your calendar.",
        },
        {
          icon: '🌐',
          title: 'Sister-chapter network',
          desc: 'Connect neighbouring chapters so members and hosts can collaborate across towns.',
        },
        {
          icon: '🗺️',
          title: 'Shared meeting details',
          desc: 'Keep meeting points, arrival notes and briefings in one place for every host.',
        },
        {
          icon: '🛡️',
          title: 'Safer group continuity',
          desc: 'Backup co-hosts always have event details and check-in access if plans change.',
        },
        {
          icon: '💡',
          title: 'Community idea board',
          desc: 'Let co-hosts and volunteers pitch activities and shape the calendar together.',
        },
      ],
    },
    p4: {
      eyebrow: 'THE COMPARISON',
      headline: 'How More Community compares',
      columns: ['GROUP CHATS', 'TICKETING TOOLS', 'SOCIAL FEEDS'],
      rows: [
        {
          label: 'Co-host check-in',
          more: [true, 'Live QR check-in for assigned hosts'],
          others: [[false, 'Manual lists'], [false, 'Single user'], [false, 'None']],
        },
        {
          label: 'Cross-group promotion',
          more: [true, "'Promote to My Community' calendar sync"],
          others: [[false, 'Messy cross-posts'], [false, 'Not supported'], [false, 'Separate pages']],
        },
        {
          label: 'Town expansion',
          more: [true, 'Sister-chapter cross-pollination'],
          others: [[false, 'Start from zero'], [false, 'Siloed pages'], [false, 'Fragmented groups']],
        },
        {
          label: 'Safety and arrival notes',
          more: [true, 'Clear host and venue details'],
          others: [[false, 'Lost in chat'], [false, 'Basic email'], [false, 'None']],
        },
        {
          label: 'Sharing leadership',
          more: [true, 'Co-host roles included free'],
          others: [[false, 'Admin chaos'], [false, 'Paid seats'], [false, 'Limited']],
        },
      ],
      steps: [
        { title: 'Join a community', desc: 'Become an active member or volunteer in your local chapter.' },
        { title: 'Become a co-host', desc: 'Your leader grants co-host access in a single tap.' },
        { title: 'Create together', desc: 'Plan, host and grow experiences as a team.' },
      ],
      ctaHeadline: 'Lead together.',
      ctaDesc: 'Join a team of people building shared experiences in real life.',
      ctaButton: 'Join as a co-host or collaborator →',
      ctaUrl: 'https://morecommunity.app/partner',
    },
  },
  {
    filename: 'more-community-member-guide.pdf',
    docTitle: 'More Community — For Members',
    theme: {
      accentDark: '#047857',
      accentLight: '#10b981',
      softBg: '#d1fae5',
    },
    photos: {
      p1Bg: { src: ASSETS.walking, pos: 'center center' },
      p2Side: { src: ASSETS.twHero, pos: '42% center' },
      p2Bottom: { src: ASSETS.charity, pos: 'center center' },
      p3Banner: { src: ASSETS.adventure, pos: 'center 35%' },
      p3Gallery: [
        { src: ASSETS.wellness, pos: 'center center' },
        { src: ASSETS.creative, pos: 'center center' },
        { src: ASSETS.running, pos: 'center center' },
      ],
      p4Bg: { src: ASSETS.interfaith, pos: 'center 42%' },
    },
    p1: {
      badge: 'FOR MEMBERS',
      eyebrow: 'FIND YOUR PEOPLE',
      headline: 'Real friends. Real places. Real life.',
      subtitle: 'Discover groups, events and people near you, then turn up and belong. Always free for members.',
      pills: ['Free for members', 'Bring a friend', 'Close to home'],
    },
    p2: {
      sideCaption: 'Find your people.',
      eyebrow: 'WHY IT MATTERS',
      headline: 'Belonging starts with showing up.',
      intro: 'Making friends as an adult is hard, and feeds keep us scrolling alone. More Community makes it simple to find a welcoming group nearby, know exactly where to meet, and arrive with confidence.',
      calloutEyebrow: 'BETTER TOGETHER',
      calloutTitle: 'Share the journey, track your momentum',
      calloutBody: 'Swipe or browse the local map to find groups, earn XP, 12 badges and weekly streaks on the leaderboard, and unlock perks from local businesses that back your club.',
      rows: [
        {
          icon: '🗺️',
          title: 'Map & swipe discovery',
          desc: 'Explore nearby clubs, hosted experiences and events on a live map or swipe feed.',
        },
        {
          icon: '🏆',
          title: 'XP, badges & streaks',
          desc: 'Earn XP, unlock 12 badges, keep weekly streaks alive and share event recap cards.',
        },
        {
          icon: '💬',
          title: 'Channels & direct chat',
          desc: 'Join group channels, send direct messages and get push reminders without sharing your number.',
        },
      ],
    },
    p3: {
      eyebrow: 'WHAT YOU GET',
      headline: 'Made for members',
      cards: [
        {
          icon: '🗺️',
          title: 'Map view & hosted experiences',
          desc: 'Find local clubs and book specialist workshops in one place, with clear meeting points.',
        },
        {
          icon: '🏆',
          title: 'XP, 12 badges & leaderboard',
          desc: 'Build weekly attendance streaks, celebrate milestones and share recap cards after events.',
        },
        {
          icon: '🚗',
          title: 'Carpooling & sister chapters',
          desc: 'Request or offer a lift with fellow members and drop into sister chapters across the region.',
        },
        {
          icon: '💬',
          title: 'Channels, DMs & push alerts',
          desc: 'Stay in the loop with group channels, direct messages and timely push notifications.',
        },
        {
          icon: '👥',
          title: '+1 Guest Pass & perks',
          desc: 'Reserve a +1 spot for a friend with no extra sign-up, and unlock local perks at check-in.',
        },
        {
          icon: '🛡️',
          title: 'Privacy first',
          desc: 'No sharing your phone number with strangers in noisy public chats.',
        },
      ],
    },
    p4: {
      eyebrow: 'THE COMPARISON',
      headline: 'How More Community compares',
      columns: ['GROUP CHATS', 'SOCIAL FEEDS', 'SUBSCRIPTION PLATFORMS'],
      rows: [
        {
          label: 'Finding local groups',
          more: [true, 'Live map, swipe feed & experiences'],
          others: [[false, 'Buried in messages'], [false, 'Lost in the feed'], [false, 'Cluttered']],
        },
        {
          label: 'Momentum & recognition',
          more: [true, 'XP, 12 badges & weekly streaks'],
          others: [[false, 'None'], [false, 'Likes only'], [false, 'None']],
        },
        {
          label: 'Getting there & lifts',
          more: [true, 'Built-in carpooling & map links'],
          others: [[false, 'Chaotic threads'], [false, 'None'], [false, 'None']],
        },
        {
          label: 'Your first visit',
          more: [true, 'Digital ticket & +1 Guest Pass'],
          others: [[false, 'Awkward alone'], [false, 'Vague details'], [false, 'Extra sign-ups']],
        },
        {
          label: 'Communication',
          more: [true, 'Channels, DMs & push reminders'],
          others: [[false, 'Phone number exposed'], [false, 'Algorithmic noise'], [false, 'Basic email']],
        },
        {
          label: 'Local perks',
          more: [true, 'Offers from nearby businesses'],
          others: [[false, 'None'], [false, 'None'], [false, 'None']],
        },
      ],
      steps: [
        { title: 'Find your region', desc: 'Browse groups and events happening near you.' },
        { title: 'RSVP in one tap', desc: 'Add it to your calendar and bring a friend if you like.' },
        { title: 'Turn up and belong', desc: 'Meet at the point shown on your ticket and say hello.' },
      ],
      ctaHeadline: 'Your people are closer than you think.',
      ctaDesc: 'Find a group near you and join your first event this week.',
      ctaButton: 'Discover communities near you →',
      ctaUrl: 'https://morecommunity.app/discover',
    },
  },
  {
    filename: 'more-community-social-prescribing-guide.pdf',
    docTitle: 'More Community — For Health and Social Prescribing',
    theme: {
      accentDark: '#047857',
      accentLight: '#34d399',
      softBg: '#d1fae5',
    },
    photos: {
      p1Bg: { src: ASSETS.mindful, pos: 'center center' },
      p2Side: { src: ASSETS.walking, pos: 'center center' },
      p2Bottom: { src: ASSETS.adventure, pos: 'center center' },
      p3Banner: { src: ASSETS.wellness, pos: 'center 35%' },
      p3Gallery: [
        { src: ASSETS.interfaith, pos: 'center center' },
        { src: ASSETS.charity, pos: 'center center' },
        { src: ASSETS.leaders, pos: 'center center' },
      ],
      p4Bg: { src: ASSETS.twHero, pos: 'center 42%' },
    },
    p1: {
      badge: 'FOR HEALTH AND SOCIAL PRESCRIBING',
      eyebrow: 'PRESCRIBE CONNECTION',
      headline: 'A friendly first step into<br>community life.',
      subtitle: 'A simple, non-clinical pathway for link workers and health teams to connect people with welcoming local groups.',
      pills: ['Trackable GP links', '+1 Guest Pass', 'NHS Social Value'],
    },
    p2: {
      sideCaption: 'Prescribe connection.',
      eyebrow: 'WHY IT MATTERS',
      headline: 'Connection is good for us<br>all.',
      intro: 'Loneliness affects wellbeing, yet the hardest part is often walking into a room alone. More Community gives GP practices and link workers trackable prescription invite links, +1 Guest Passes and clear meeting directions.',
      calloutEyebrow: 'TRACKABLE PRESCRIPTIONS & VALUE',
      calloutTitle: 'Never walk in alone, and prove the impact',
      calloutBody: 'Generate trackable GP Social Prescription links for patient cohorts and monitor redemptions alongside Treasury Green Book NHS Social Value (£) and Social Contact Hours. Supports +1 Guest Passes and exact meeting directions.',
      rows: [
        {
          icon: '🩺',
          title: 'Trackable prescription links',
          desc: 'Generate cohort invite links for patients and track redemptions and repeat attendance.',
        },
        {
          icon: '👥',
          title: '+1 Guest Pass',
          desc: 'Patients can reserve a +1 spot for a friend, relative or support worker (free on free events).',
        },
        {
          icon: '💷',
          title: 'NHS Social Value metrics',
          desc: 'Capture Social Contact Hours and Treasury Green Book NHS Social Value (£) created.',
        },
      ],
    },
    p3: {
      eyebrow: 'WHAT YOU GET',
      headline: 'Designed to be welcoming',
      cards: [
        {
          icon: '🩺',
          title: 'GP Social Prescription links',
          desc: 'Generate trackable invite links for patient cohorts and see when patients redeem them.',
        },
        {
          icon: '👥',
          title: '+1 Guest Pass',
          desc: 'Patients never have to arrive alone: add a companion with no extra sign-up (free on free events).',
        },
        {
          icon: '📍',
          title: 'Clear meeting directions',
          desc: 'Exact meeting points, arrival notes and one-tap map directions on every ticket.',
        },
        {
          icon: '💷',
          title: 'NHS Social Value (£)',
          desc: 'Measure Social Contact Hours and repeat attendance using Treasury Green Book logic.',
        },
        {
          icon: '🆓',
          title: 'Free to join',
          desc: 'No subscriptions, no app install required and no barriers to booking in seconds.',
        },
        {
          icon: '📱',
          title: 'QR attendance confirmation',
          desc: 'Host QR check-in confirms attendance cleanly, supporting follow-up and reporting.',
        },
      ],
    },
    p4: {
      eyebrow: 'THE COMPARISON',
      headline: 'How More Community compares',
      columns: ['PRINTED LEAFLETS', 'OPEN SOCIAL GROUPS', 'ONLINE LISTINGS'],
      rows: [
        {
          label: 'Prescription tracking',
          more: [true, 'Trackable GP links & redemptions'],
          others: [[false, 'Never known if used'], [false, 'No tracking'], [false, 'No tracking']],
        },
        {
          label: 'Social value reporting',
          more: [true, 'Social Contact Hours & NHS Value (£)'],
          others: [[false, 'None'], [false, 'None'], [false, 'None']],
        },
        {
          label: 'Arrival anxiety',
          more: [true, '+1 Guest Pass & map link'],
          others: [[false, 'Goes alone'], [false, 'Intimidating'], [false, 'Unclear']],
        },
        {
          label: 'Ease of access',
          more: [true, 'One-tap booking, no passwords'],
          others: [[false, 'Easily lost'], [false, 'Needs accounts'], [false, 'Complex']],
        },
        {
          label: 'Confidence for patients',
          more: [true, 'Clear host and venue details'],
          others: [[false, 'Often outdated'], [false, 'Unmoderated'], [false, 'Limited detail']],
        },
      ],
      steps: [
        { title: 'Explore local groups', desc: 'Browse welcoming communities in your catchment area.' },
        { title: 'Share an event link', desc: 'Send it by text or email. Booking takes seconds, with no passwords.' },
        { title: 'Support the first visit', desc: 'Encourage a companion and share the clear arrival details.' },
      ],
      ctaHeadline: 'Prescribe connection.',
      ctaDesc: 'Find welcoming groups near the people you support.',
      ctaButton: 'Explore local communities →',
      ctaUrl: 'https://morecommunity.app/discover',
    },
  },
];

function renderHtml(g) {
  const { theme, photos, p1, p2, p3, p4 } = g;
  const colStyle = p4.steps.length === 4 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${g.docTitle}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 794px;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #ffffff;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    position: relative;
    width: 794px;
    height: 1122.5px;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .serif { font-family: Georgia, 'Times New Roman', serif; }

  /* PAGE 1: COVER */
  .cover { background: #0b1220; }
  .cover-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom,
      rgba(11,18,32,0.52) 0%,
      rgba(11,18,32,0.10) 36%,
      rgba(11,18,32,0.68) 65%,
      #0b1220 96%);
  }
  .cover-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 53px 60px 0;
  }
  .logo-img { height: 41px; width: auto; display: block; }
  .badge-pill {
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.35);
    color: #ffffff;
    font-size: 8.5px;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .cover-content {
    position: absolute;
    z-index: 2;
    left: 60px;
    right: 60px;
    bottom: 58px;
  }
  .eyebrow-row {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 14px;
  }
  .eyebrow-bar { width: 52px; height: 2px; background: ${theme.accentLight}; }
  .eyebrow-text {
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.18em;
    color: ${theme.accentLight};
    text-transform: uppercase;
  }
  .cover-h1 {
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: 44px;
    line-height: 1.07;
    color: #ffffff;
    margin-bottom: 18px;
    letter-spacing: -0.015em;
  }
  .cover-sub {
    font-size: 14.5px;
    line-height: 1.52;
    color: #e2e8f0;
    max-width: 590px;
    margin-bottom: 24px;
  }
  .pills-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.30);
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
  }
  .pill-plus { color: ${theme.accentLight}; font-weight: 900; }
  .cover-bottom-bar {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 15px;
    background: linear-gradient(90deg, ${theme.accentDark}, ${theme.accentLight});
    z-index: 3;
  }

  /* PAGE 2: SPLIT */
  .split { display: flex; background: #ffffff; }
  .split-left {
    width: 316px;
    height: 100%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    background: #0b1220;
  }
  .split-left img.bg { width: 100%; height: 100%; object-fit: cover; }
  .split-left-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(11,18,32,0.85) 0%, rgba(11,18,32,0.18) 38%, transparent 65%);
  }
  .split-caption {
    position: absolute;
    left: 44px;
    right: 24px;
    bottom: 98px;
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 14.5px;
    color: #ffffff;
  }
  .split-logo { position: absolute; left: 44px; bottom: 52px; height: 37px; width: auto; }
  .split-stripe {
    width: 11px;
    height: 100%;
    flex-shrink: 0;
    background: linear-gradient(to bottom, ${theme.accentDark}, ${theme.accentLight});
  }
  .split-right {
    flex: 1;
    padding: 58px 50px 52px 42px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .sec-eyebrow {
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.18em;
    color: ${theme.accentDark};
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .split-h2 {
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: 26.5px;
    line-height: 1.15;
    color: #0f172a;
    margin-bottom: 12px;
  }
  .split-intro {
    font-size: 12px;
    line-height: 1.54;
    color: #475569;
    margin-bottom: 16px;
  }
  .callout-box {
    background: linear-gradient(135deg, ${theme.accentDark} 0%, #0f172a 100%);
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 14px;
  }
  .callout-eyebrow {
    font-size: 8.5px;
    font-weight: 900;
    letter-spacing: 0.16em;
    color: ${theme.accentLight};
    text-transform: uppercase;
    margin-bottom: 5px;
  }
  .callout-title {
    font-family: Georgia, serif;
    font-size: 16px;
    line-height: 1.24;
    color: #ffffff;
    margin-bottom: 6px;
  }
  .callout-body { font-size: 10.7px; line-height: 1.48; color: #e2e8f0; }
  .feature-rows { display: flex; flex-direction: column; }
  .feature-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid #e2e8f0;
  }
  .icon-box {
    width: 37px;
    height: 37px;
    border-radius: 9px;
    background: ${theme.softBg};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    flex-shrink: 0;
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif;
  }
  .row-title { font-size: 12.2px; font-weight: 900; color: #0f172a; margin-bottom: 2px; }
  .row-desc { font-size: 10.8px; line-height: 1.42; color: #64748b; }
  .split-bottom-card {
    margin-top: 14px;
    flex: 1;
    min-height: 180px;
    position: relative;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(15,23,42,0.16);
    background: #0b1220;
  }
  .split-bottom-card img.bg { width: 100%; height: 100%; object-fit: cover; }
  .split-bottom-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(11,18,32,0.65) 0%, transparent 45%);
  }
  .split-bottom-logo { position: absolute; left: 16px; bottom: 14px; height: 28px; width: auto; }

  /* PAGE 3: FEATURES */
  .features-page { background: #f1f5f9; }
  .p3-banner {
    position: relative;
    width: 100%;
    height: 392px;
    overflow: hidden;
    background: #0b1220;
  }
  .p3-banner img { width: 100%; height: 100%; object-fit: cover; }
  .p3-banner-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(11,18,32,0.72) 0%, rgba(11,18,32,0.28) 65%, rgba(11,18,32,0.45) 100%);
  }
  .p3-banner-text { position: absolute; top: 55px; left: 60px; right: 60px; }
  .p3-eyebrow {
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.18em;
    color: #ffffff;
    margin-bottom: 6px;
  }
  .p3-h2 {
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: 33px;
    color: #ffffff;
  }
  .p3-body {
    position: relative;
    z-index: 2;
    margin-top: -44px;
    padding: 0 53px;
  }
  .cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 18px;
  }
  .feature-card {
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    border-top: 3.5px solid ${theme.accentLight};
    padding: 16px 18px;
    height: 150px;
    box-shadow: 0 8px 20px rgba(15,23,42,0.08);
    display: flex;
    flex-direction: column;
  }
  .card-icon {
    width: 37px;
    height: 37px;
    border-radius: 8px;
    background: ${theme.softBg};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    margin-bottom: 10px;
    flex-shrink: 0;
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif;
  }
  .card-title { font-size: 12.2px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
  .card-desc { font-size: 10.8px; line-height: 1.44; color: #64748b; }
  .p3-gallery {
    display: grid;
    grid-template-columns: 1fr 1.28fr 1fr;
    gap: 14px;
    align-items: center;
  }
  .p3-gal-item {
    height: 212px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(15,23,42,0.14);
    background: #0b1220;
  }
  .p3-gal-item.center {
    height: 238px;
    box-shadow: 0 12px 26px rgba(15,23,42,0.18);
  }
  .p3-gal-item img { width: 100%; height: 100%; object-fit: cover; }

  /* PAGE 4: COMPARISON & FOOTER */
  .compare-page { display: flex; flex-direction: column; background: #ffffff; }
  .p4-top { padding: 52px 60px 24px; flex-shrink: 0; }
  .p4-h2 {
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: 25.5px;
    color: #0f172a;
    margin-bottom: 14px;
  }
  table.cmp {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e2e8f0;
    margin-bottom: 20px;
    table-layout: fixed;
  }
  table.cmp th {
    background: #0f172a;
    color: #ffffff;
    font-size: 8.3px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 10px 9px;
    text-align: left;
    line-height: 1.3;
  }
  table.cmp th.more-col { background: ${theme.accentDark}; }
  table.cmp td {
    font-size: 9.7px;
    padding: 8px 9px;
    border-top: 1px solid #e2e8f0;
    color: #475569;
    vertical-align: middle;
    line-height: 1.34;
  }
  table.cmp td.row-label { font-weight: 700; color: #0f172a; }
  table.cmp td.more-col { background: ${theme.softBg}; font-weight: 700; color: #0f172a; }
  .chk { color: ${theme.accentDark}; font-weight: 900; margin-right: 3px; }
  .crs { color: #ef4444; font-weight: 700; margin-right: 3px; }
  .gs-h3 {
    font-family: Georgia, serif;
    font-size: 21.5px;
    font-weight: 400;
    color: #0f172a;
    margin-bottom: 11px;
  }
  .steps-grid { display: grid; gap: 11px; }
  .step-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    padding: 12px 13px;
  }
  .step-num {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: ${theme.accentDark};
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .step-title { font-size: 11.2px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
  .step-desc { font-size: 9.8px; line-height: 1.38; color: #64748b; }

  .p4-footer {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #0b1220;
    min-height: 440px;
  }
  .p4-footer img.bg { width: 100%; height: 100%; object-fit: cover; }
  .p4-footer-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom,
      rgba(11,18,32,0.16) 0%,
      rgba(11,18,32,0.72) 60%,
      #0b1220 98%);
  }
  .p4-cta-wrap {
    position: absolute;
    left: 60px;
    right: 60px;
    bottom: 88px;
    z-index: 2;
  }
  .p4-cta-h2 {
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: 32px;
    color: #ffffff;
    margin-bottom: 8px;
  }
  .p4-cta-desc {
    font-size: 12.5px;
    color: #e2e8f0;
    margin-bottom: 18px;
    max-width: 560px;
  }
  .cta-btn {
    display: inline-block;
    padding: 11px 22px;
    border-radius: 999px;
    background: ${theme.accentLight};
    color: #0b1220;
    font-size: 11.8px;
    font-weight: 900;
    text-decoration: none;
  }
  .p4-bottom-bar {
    position: absolute;
    left: 60px;
    right: 60px;
    bottom: 42px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .p4-contact { font-size: 10px; color: #cbd5e1; }
  .p4-logo { height: 30px; width: auto; }
</style>
</head>
<body>

  <!-- PAGE 1 -->
  <section class="page cover">
    <img class="cover-bg" src="${photos.p1Bg.src}" style="object-position: ${photos.p1Bg.pos};" alt="">
    <div class="cover-overlay"></div>
    <div class="cover-top">
      <img class="logo-img" src="${ASSETS.logo}" alt="More Community">
      <span class="badge-pill">${p1.badge}</span>
    </div>
    <div class="cover-content">
      <div class="eyebrow-row">
        <div class="eyebrow-bar"></div>
        <div class="eyebrow-text">${p1.eyebrow}</div>
      </div>
      <h1 class="cover-h1">${p1.headline}</h1>
      <p class="cover-sub">${p1.subtitle}</p>
      <div class="pills-row">
        ${p1.pills.map((p) => `<span class="pill"><span class="pill-plus">+</span> ${p}</span>`).join('')}
      </div>
    </div>
    <div class="cover-bottom-bar"></div>
  </section>

  <!-- PAGE 2 -->
  <section class="page split">
    <div class="split-left">
      <img class="bg" src="${photos.p2Side.src}" style="object-position: ${photos.p2Side.pos};" alt="">
      <div class="split-left-scrim"></div>
      <div class="split-caption">${p2.sideCaption}</div>
      <img class="split-logo" src="${ASSETS.logo}" alt="More Community">
    </div>
    <div class="split-stripe"></div>
    <div class="split-right">
      <div class="sec-eyebrow">${p2.eyebrow}</div>
      <h2 class="split-h2">${p2.headline}</h2>
      <p class="split-intro">${p2.intro}</p>
      <div class="callout-box">
        <div class="callout-eyebrow">${p2.calloutEyebrow}</div>
        <div class="callout-title">${p2.calloutTitle}</div>
        <div class="callout-body">${p2.calloutBody}</div>
      </div>
      <div class="feature-rows">
        ${p2.rows.map((r) => `
          <div class="feature-row">
            <div class="icon-box">${r.icon}</div>
            <div>
              <div class="row-title">${r.title}</div>
              <div class="row-desc">${r.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="split-bottom-card">
        <img class="bg" src="${photos.p2Bottom.src}" style="object-position: ${photos.p2Bottom.pos};" alt="">
        <div class="split-bottom-scrim"></div>
        <img class="split-bottom-logo" src="${ASSETS.logo}" alt="More Community">
      </div>
    </div>
  </section>

  <!-- PAGE 3 -->
  <section class="page features-page">
    <div class="p3-banner">
      <img src="${photos.p3Banner.src}" style="object-position: ${photos.p3Banner.pos};" alt="">
      <div class="p3-banner-scrim"></div>
      <div class="p3-banner-text">
        <div class="p3-eyebrow">${p3.eyebrow}</div>
        <h2 class="p3-h2">${p3.headline}</h2>
      </div>
    </div>
    <div class="p3-body">
      <div class="cards-grid">
        ${p3.cards.map((c) => `
          <div class="feature-card">
            <div class="card-icon">${c.icon}</div>
            <div class="card-title">${c.title}</div>
            <div class="card-desc">${c.desc}</div>
          </div>
        `).join('')}
      </div>
      <div class="p3-gallery">
        <div class="p3-gal-item"><img src="${photos.p3Gallery[0].src}" style="object-position: ${photos.p3Gallery[0].pos};" alt=""></div>
        <div class="p3-gal-item center"><img src="${photos.p3Gallery[1].src}" style="object-position: ${photos.p3Gallery[1].pos};" alt=""></div>
        <div class="p3-gal-item"><img src="${photos.p3Gallery[2].src}" style="object-position: ${photos.p3Gallery[2].pos};" alt=""></div>
      </div>
    </div>
  </section>

  <!-- PAGE 4 -->
  <section class="page compare-page">
    <div class="p4-top">
      <div class="sec-eyebrow">${p4.eyebrow}</div>
      <h2 class="p4-h2">${p4.headline}</h2>
      <table class="cmp">
        <colgroup>
          <col style="width: 24%;">
          <col style="width: 26%;">
          <col style="width: 18%;">
          <col style="width: 16%;">
          <col style="width: 16%;">
        </colgroup>
        <thead>
          <tr>
            <th>WHAT MATTERS</th>
            <th class="more-col">MORE COMMUNITY</th>
            ${p4.columns.map((c) => `<th>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${p4.rows.map((r) => `
            <tr>
              <td class="row-label">${r.label}</td>
              <td class="more-col"><span class="${r.more[0] ? 'chk' : 'crs'}">${r.more[0] ? '✓' : '✗'}</span>${r.more[1]}</td>
              ${r.others.map(([ok, txt]) => `<td><span class="${ok ? 'chk' : 'crs'}">${ok ? '✓' : '✗'}</span>${txt}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <h3 class="gs-h3">Getting started</h3>
      <div class="steps-grid" style="grid-template-columns: ${colStyle};">
        ${p4.steps.map((s, idx) => `
          <div class="step-card">
            <div class="step-num">${idx + 1}</div>
            <div class="step-title">${s.title}</div>
            <div class="step-desc">${s.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="p4-footer">
      <img class="bg" src="${photos.p4Bg.src}" style="object-position: ${photos.p4Bg.pos};" alt="">
      <div class="p4-footer-scrim"></div>
      <div class="p4-cta-wrap">
        <h2 class="p4-cta-h2">${p4.ctaHeadline}</h2>
        <p class="p4-cta-desc">${p4.ctaDesc}</p>
        <a class="cta-btn" href="${p4.ctaUrl}">${p4.ctaButton}</a>
      </div>
      <div class="p4-bottom-bar">
        <div class="p4-contact">morecommunity.app &nbsp;|&nbsp; hello@morecommunity.app</div>
        <img class="p4-logo" src="${ASSETS.logo}" alt="More Community">
      </div>
    </div>
  </section>

</body>
</html>`;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    for (const guide of GUIDES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      const html = renderHtml(guide);
      await page.setContent(html, { waitUntil: 'load' });
      const outPath = path.join(OUT_DIR, guide.filename);
      await page.pdf({
        path: outPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      await page.close();
      console.log('Generated:', guide.filename);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
