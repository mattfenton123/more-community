// More Community - Verified Specialist & Provider Marketplace Data & State
// Handles accredited guides, fitness coaches, outdoor instructors, and wellness teachers.

export const VERIFIED_SPECIALISTS = [
  {
    id: 'spec-mountain-leader',
    name: 'David MacLeod',
    title: 'Summer & Winter Mountain Leader (MLT)',
    organization: 'Highland & Peak Navigation Guild',
    location: 'Peak District & North Wales',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: '14 years guiding experience across the UK. Specialist in night navigation, scramble safety, and mountain weather interpretation. Regular tutor for local outdoor clubs.',
    rating: 4.98,
    reviewsCount: 64,
    sessionsCompleted: 82,
    credentials: {
      ngb: 'Mountain Training UK (MLT #49102 - Summer & Winter ML)',
      insurancePolicy: 'Hiscox Instructor Combined PLI #HX-994218',
      insuranceCover: '£5,000,000 Public Liability + £2,000,000 Professional Indemnity',
      insuranceExpiry: '15 Nov 2027',
      firstAid: '16-Hour Outdoor Wilderness First Aid (REC Level 3 - Valid to Oct 2027)',
      dbs: 'Enhanced DBS Certificate #0015948291 (Updated 2026)',
      rams: 'RAMS Standard Mountain Protocol v4.2 On File'
    },
    proposals: [
      {
        id: 'prop-night-nav',
        title: 'Map, Compass & Night Navigation Workshop',
        category: 'Outdoor Skills & Hiking',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80',
        summary: 'A twilight practical workshop teaching contour reading, 1:25k bearings, pacing, and emergency relocation in low visibility. Perfect confidence builder for walking group members.',
        duration: '3.5 hours (Twilight / Sunset)',
        maxCapacity: 14,
        standardPrice: 35,
        communityPrice: 22,
        communityCut: 3.50, // Paid to club fund
        specialistCut: 16.50,
        platformCut: 2.00,
        equipmentProvided: 'Laminated 1:25k OS maps, Silva Type 4 compasses, emergency bivvy bags',
        memberNeeds: 'Walking boots, headtorch with spare batteries, warm layers, waterproofs',
        status: 'pending', // 'pending' | 'accepted' | 'dismissed'
        liabilityNote: 'Certified Instructor assumes direct primary on-hill duty of care under Mountain Training MLT standards and £5M insurance.'
      },
      {
        id: 'prop-scramble-primer',
        title: 'Grade 1 Scrambling & Steep Ground Primer',
        category: 'Adventure & Climbing',
        image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&auto=format&fit=crop&q=80',
        summary: 'Hands-on movement coaching on rocky ridges. Focuses on 3-point contact, foot placement on wet gritstone, and group safety protocols.',
        duration: '4 hours (Morning)',
        maxCapacity: 8,
        standardPrice: 48,
        communityPrice: 32,
        communityCut: 5.00,
        specialistCut: 24.00,
        platformCut: 3.00,
        equipmentProvided: 'Climbing helmets, group safety shelter, first aid kit',
        memberNeeds: 'Grippy approach or hiking boots, daypack, water, snacks',
        status: 'pending',
        liabilityNote: 'Accredited Mountain Leader leads all steep sections with maximum 1:8 leader ratio.'
      }
    ]
  },
  {
    id: 'spec-yoga-mobility',
    name: 'Sarah Jenkins, MSc',
    title: 'CIMSPA Level 3 Movement Coach & Yoga Instructor',
    organization: 'Kinetic Breathwork & Mobility UK',
    location: 'Kent & South East',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    bio: 'Former sports therapist specializing in active recovery, thoracic mobility, and nervous system regulation for runners, cyclists, and weekend walkers.',
    rating: 4.96,
    reviewsCount: 89,
    sessionsCompleted: 110,
    credentials: {
      ngb: 'CIMSPA Practitioner #CP-88412 / Yoga Alliance RYT-500',
      insurancePolicy: 'Balens Specialist Fitness & Movement #BL-449102',
      insuranceCover: '£5,000,000 Medical Malpractice & Public Liability',
      insuranceExpiry: '30 Aug 2027',
      firstAid: 'St John Ambulance Workplace First Aid (Valid to 2028)',
      dbs: 'Basic DBS Check Verified',
      rams: 'Indoor/Outdoor Movement Risk Assessment 2026'
    },
    proposals: [
      {
        id: 'prop-post-run-mobility',
        title: 'Post-Run Mobility & Functional Breathwork Clinic',
        category: 'Fitness & Wellness',
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
        summary: 'Targeted myofascial release, hip opening, and down-regulating breathwork. Can be hosted in a community hall or park gazebo immediately following your regular group session.',
        duration: '75 minutes',
        maxCapacity: 20,
        standardPrice: 22,
        communityPrice: 14,
        communityCut: 2.50,
        specialistCut: 10.00,
        platformCut: 1.50,
        equipmentProvided: 'Resistance bands, massage balls, guided audio session recap',
        memberNeeds: 'Yoga mat or towel, warm layer for relaxation',
        status: 'pending',
        liabilityNote: 'Specialist holds full professional indemnity and personal liability coverage.'
      }
    ]
  },
  {
    id: 'spec-foraging-bushcraft',
    name: 'Marcus Vance',
    title: 'Ethnobotanist & Foraging Instructor',
    organization: 'Association of Foragers (AoF)',
    location: 'South East & Home Counties',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'Professional wild food educator and botanist. Teaches sustainable seasonal foraging, botanical identification, and campfire preparations with zero environmental footprint.',
    rating: 4.95,
    reviewsCount: 47,
    sessionsCompleted: 53,
    credentials: {
      ngb: 'Association of Foragers (AoF) Certified Professional',
      insurancePolicy: 'Zurich Countryside & Bushcraft PLI #ZU-102948',
      insuranceCover: '£5,000,000 Public & Products Liability',
      insuranceExpiry: '12 May 2027',
      firstAid: 'Forestry & Outdoor Emergency First Aid +F (Valid to 2027)',
      dbs: 'Enhanced DBS Certificate #0099418292',
      rams: 'Wild Food Sampling & Habitat Protection Protocol'
    },
    proposals: [
      {
        id: 'prop-woodland-foraging',
        title: 'Wild Edibles & Botanical Identification Walk',
        category: 'Nature & Countryside',
        image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
        summary: 'A leisurely 2-hour guided trail identifying edible leaves, medicinal herbs, and seasonal fungi. Concludes with a warm wild herbal tea tasting brewed on site.',
        duration: '2.5 hours',
        maxCapacity: 16,
        standardPrice: 28,
        communityPrice: 18,
        communityCut: 3.00,
        specialistCut: 13.00,
        platformCut: 2.00,
        equipmentProvided: 'Field magnifying loupes, ID field guides, wild tea sample kit',
        memberNeeds: 'Outdoor shoes or wellies, weather-appropriate coat, small notepad',
        status: 'pending',
        liabilityNote: 'All sampled botanicals strictly checked and covered under verified Products & Public Liability.'
      }
    ]
  },
  {
    id: 'spec-physio-running',
    name: 'Dr. Liam Cooper, MCSP',
    title: 'Chartered Sports Physiotherapist & Running Coach',
    organization: 'UK Athletics / Chartered Society of Physiotherapy',
    location: 'London & Kent',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    bio: 'Former university lecturer and NHS clinical specialist. Specialises in cadence assessment, injury risk screening, and running economy workshops for amateur clubs.',
    rating: 5.0,
    reviewsCount: 38,
    sessionsCompleted: 42,
    credentials: {
      ngb: 'HCPC Registered #PH-11029 / England Athletics Coach',
      insurancePolicy: 'CSP / Graybrook Healthcare PLI #GB-884190',
      insuranceCover: '£10,000,000 Professional Indemnity & Public Liability',
      insuranceExpiry: '01 Oct 2027',
      firstAid: 'Trauma & Sports First Responder',
      dbs: 'Enhanced DBS Checked',
      rams: 'Dynamic Biomechanical Assessment Safety Plan'
    },
    proposals: [
      {
        id: 'prop-running-gait',
        title: 'Cadence & Running Economy Masterclass',
        category: 'Running & Athletics',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
        summary: 'Video gait capture and group drills to optimize stride cadence, reduce shin and knee overload, and shave minutes off your 5k/10k times safely.',
        duration: '2 hours',
        maxCapacity: 12,
        standardPrice: 40,
        communityPrice: 24,
        communityCut: 4.00,
        specialistCut: 17.50,
        platformCut: 2.50,
        equipmentProvided: 'Slow-motion video analysis feedback, warm-up resistance bands',
        memberNeeds: 'Running kit and regular running trainers',
        status: 'pending',
        liabilityNote: 'Supervised by HCPC registered physiotherapist with £10M clinical indemnity.'
      }
    ]
  }
];

const STORAGE_KEY_PROPOSALS = 'more_specialist_proposals_v1';
const STORAGE_KEY_APPLICATIONS = 'more_specialist_applications_v1';

export function getStoredProposals() {
  if (typeof window === 'undefined') return VERIFIED_SPECIALISTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROPOSALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(VERIFIED_SPECIALISTS));
      return VERIFIED_SPECIALISTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return VERIFIED_SPECIALISTS;
  }
}

export function saveStoredProposals(specialists) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(specialists));
  } catch (e) {
    console.error('Failed to save specialist proposals', e);
  }
}

export function updateProposalStatus(specialistId, proposalId, newStatus) {
  const current = getStoredProposals();
  const updated = current.map(spec => {
    if (spec.id === specialistId) {
      return {
        ...spec,
        proposals: spec.proposals.map(p => p.id === proposalId ? { ...p, status: newStatus } : p)
      };
    }
    return spec;
  });
  saveStoredProposals(updated);
  return updated;
}

export function saveSpecialistApplication(applicationData) {
  if (typeof window === 'undefined') return null;
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const newEntry = {
      id: 'app-' + Date.now(),
      submittedAt: new Date().toISOString(),
      status: 'pending_verification',
      ...applicationData
    };
    existing.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(existing));
    return newEntry;
  } catch (e) {
    console.error('Failed to save application', e);
    return null;
  }
}
