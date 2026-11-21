import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatShareLocation } from '../../../../src/lib/location';

// Simple in-memory sliding window rate limiter (10 requests per minute per IP)
const rateLimitMap = new Map();
function isRateLimited(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  rateLimitMap.set(identifier, recent);
  return false;
}

// Sanitize user inputs: strip dangerous schemes and excessive length
function sanitizePrompt(rawPrompt) {
  if (typeof rawPrompt !== 'string') return '';
  let sanitized = rawPrompt
    .slice(0, 1000) // Strict 1,000 char cap prevents token exhaustion
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return sanitized.trim();
}


export const runtime = 'nodejs';

/**
 * Intelligent relative date calculator.
 * Parses expressions like "this saturday", "sunday", "tomorrow", "friday" etc.
 */
function resolveEventDate(prompt) {
  const lower = (prompt || '').toLowerCase();
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
  
  if (lower.includes('tomorrow')) {
    const d = new Date(now.getTime() + 86400000);
    return d.toISOString().split('T')[0];
  }

  const dayMap = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };

  for (const [dayName, targetDay] of Object.entries(dayMap)) {
    if (lower.includes(dayName)) {
      let daysAhead = (targetDay - currentDay + 7) % 7;
      if (daysAhead === 0) daysAhead = 7; // schedule for upcoming instance
      const d = new Date(now.getTime() + daysAhead * 86400000);
      return d.toISOString().split('T')[0];
    }
  }

  if (lower.includes('weekend')) {
    let daysAhead = (6 - currentDay + 7) % 7;
    if (daysAhead === 0) daysAhead = 7;
    const d = new Date(now.getTime() + daysAhead * 86400000);
    return d.toISOString().split('T')[0];
  }

  // Default to 4 days ahead
  const defaultDate = new Date(now.getTime() + 4 * 86400000);
  return defaultDate.toISOString().split('T')[0];
}

/**
 * Intelligent time parser.
 * Parses "morning", "sunset", "evening", "10am", "6:30pm" etc.
 */
function resolveEventTime(prompt) {
  const lower = (prompt || '').toLowerCase();

  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const match = lower.match(timeRegex);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = match[2] || '00';
    const meridian = match[3] ? match[3].toLowerCase() : null;

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    if (hours >= 6 && hours <= 22) {
      return String(hours).padStart(2, '0') + ':' + mins;
    }
  }

  if (lower.includes('sunrise') || lower.includes('dawn') || lower.includes('early morning')) return '07:30';
  if (lower.includes('morning') || lower.includes('coffee') || lower.includes('stroll')) return '10:00';
  if (lower.includes('lunch') || lower.includes('noon') || lower.includes('midday')) return '12:30';
  if (lower.includes('afternoon')) return '14:30';
  if (lower.includes('sunset') || lower.includes('golden hour') || lower.includes('dusk')) return '18:00';
  if (lower.includes('evening') || lower.includes('pub') || lower.includes('drinks') || lower.includes('dinner')) return '18:30';

  return '10:00';
}

export async function POST(request) {
  try {
    // 1. IP / Client Rate Limiting
    const forwardedFor = request.headers.get('x-forwarded-for') || 'unknown-client';
    const clientIp = forwardedFor.split(',')[0].trim();
    if (isRateLimited(clientIp, 12, 60000)) {
      return NextResponse.json({ 
        error: 'Too many requests. Please wait a moment before trying again.' 
      }, { status: 429 });
    }

    // 2. Authentication Check (optional bearer token validation)
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
          const { data: { user }, error: authErr } = await authClient.auth.getUser(token);
          if (authErr || !user) {
            console.warn('AI generate-event unauthorized token:', authErr?.message);
          }
        } catch (e) {}
      }
    }

    const body = await request.json();
    const rawPrompt = body.prompt || body.description || '';
    const prompt = sanitizePrompt(rawPrompt);
    const communityName = body.communityName || 'More Community';
    const communityLocation = body.communityLocation || '';
    const communityTags = Array.isArray(body.communityTags) ? body.communityTags : [];
    const mode = body.mode || 'full-event';

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt or notes are required' }, { status: 400 });
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '').trim();
    // Prioritize universally available Gemini 2.5 Flash (fast, strong reasoning & JSON outputs) with fallback chain
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-2.0-flash'];
    let lastApiError = null;

    // ==============================================================
    // Specialized Mode: Multi-Turn Conversational Leader Co-Pilot
    // ==============================================================
    if (mode === 'copilot-chat') {
      const loc = formatShareLocation(communityLocation, 'Tunbridge Wells');
      const memberCount = Number(body.memberCount) || 12;
      const verifiedCount = Number(body.verifiedCount) || Math.max(1, Math.round(memberCount * 0.6));
      const upcomingEvents = Array.isArray(body.upcomingEvents) ? body.upcomingEvents.slice(0, 6) : [];
      const snapshot = body.communitySnapshot && typeof body.communitySnapshot === 'object' ? body.communitySnapshot : {};
      const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
      const today = new Date().toISOString().split('T')[0];

      const fallbackReply = buildConversationalCoPilotFallback({
        prompt,
        history,
        communityName,
        loc,
        communityTags,
        memberCount,
        verifiedCount,
        upcomingEvents,
        snapshot,
      });

      if (!apiKey) {
        return NextResponse.json({
          success: true,
          fallback: true,
          mode: 'smart-template',
          ...fallbackReply,
        });
      }

      const memberBreakdown = snapshot.memberBreakdown || {
        total: memberCount,
        verifiedLocals: verifiedCount,
        regulars3Plus: Math.max(0, Math.round(verifiedCount * 0.35)),
        quietNeverAttended: Math.max(0, memberCount - verifiedCount),
      };
      const pastEventsSummary = Array.isArray(snapshot.pastEventsSummary) ? snapshot.pastEventsSummary.slice(0, 5) : [];
      const activePolls = Array.isArray(snapshot.activePolls) ? snapshot.activePolls.slice(0, 4) : [];
      const recentFeedPosts = Array.isArray(snapshot.recentFeedPosts) ? snapshot.recentFeedPosts.slice(0, 4) : [];

      const systemDirective = `You are "More AI", an expert, proactive, conversational Community Growth & Operations Co-Pilot for the leader of "${communityName}" in ${loc}.
Today's date is ${today}.

REAL-TIME LIVE COMMUNITY DATA (use these exact real numbers when advising):
- Community Name: ${communityName}
- Town / Location: ${loc}
- Activity Tags: ${communityTags.join(', ') || 'Local community, social, outdoors'}
- Current Community Bio: ${snapshot.description ? String(snapshot.description).slice(0, 320) : 'Not set yet'}
- Current Guidelines Count: ${Array.isArray(snapshot.guidelines) ? snapshot.guidelines.length : 0}
- WhatsApp Group Linked: ${snapshot.hasWhatsappGroup ? 'Yes' : 'No'}
- Member Standing Breakdown:
  * Total Members: ${memberBreakdown.total}
  * Verified Locals (1+ meetup attended): ${memberBreakdown.verifiedLocals}
  * Community Regulars (3+ meetups — ideal Co-Leader candidates): ${memberBreakdown.regulars3Plus}
  * Quiet Members (joined online, 0 meetups attended yet): ${memberBreakdown.quietNeverAttended}
- Ticket Revenue: £${Number(snapshot.totalRevenue || 0)} all-time (£${Number(snapshot.monthRevenue || 0)} this month)
- Pending Admin Items: ${Number(snapshot.pendingProposalsCount || 0)} member event proposals, ${Number(snapshot.pendingPitchesCount || 0)} local business/workshop pitches
- Upcoming Scheduled Events: ${upcomingEvents.length > 0 ? JSON.stringify(upcomingEvents) : 'NONE scheduled — high priority gap!'}
- Recent Past Events & Turnout: ${pastEventsSummary.length > 0 ? JSON.stringify(pastEventsSummary) : 'No past events recorded yet'}
- Active Community Polls: ${activePolls.length > 0 ? JSON.stringify(activePolls) : 'None active'}
- Recent Feed Posts: ${recentFeedPosts.length > 0 ? JSON.stringify(recentFeedPosts) : 'None yet'}

WHERE EVERY LAUNCHED ITEM APPEARS IN MORE COMMUNITY (always tell the leader clearly!):
- Events: Published immediately to the ${communityName} Calendar, Public Events Discovery (/events), and Dashboard → Events tab.
- Polls: Published immediately to the top of the ${communityName} Page (Overview + Feed & Photos tab) AND notifies all ${memberBreakdown.total} members to vote.
- Announcements / Broadcasts: Published to the ${communityName} Feed & Photos tab (optionally pinned) AND sends instant In-App & Push notifications to all members; WhatsApp & Instagram copy is ready to copy in 1 tap.
- Community Bio & Guidelines Updates: Updates the public ${communityName} microsite immediately.
- UK RAMS / Sponsor Pitches / Council Grants: Exportable documents ready to copy or download (.md).

HOW TO BE EXTRAORDINARILY USEFUL:
1. Be sharp, warm, specific to ${loc}, and reference the community's REAL numbers above (e.g. mention their ${memberBreakdown.quietNeverAttended} quiet newcomers, past turnout rates, or calendar gaps). Keep "reply" concise (2-4 short paragraphs) and clearly mention what you built in the Live Output & Launchpad panel and WHERE it will go when launched.
2. ALWAYS attach an executable "actionCard" whenever the leader asks to:
   - Launch a single event or multi-week schedule -> "events"
   - Create a poll / ask members to vote -> "poll"
   - Draft an announcement, re-engagement message, WhatsApp or Instagram post -> "broadcast"
   - Rewrite or improve their Community Bio / Description or Community Guidelines -> "community_update"
   - Audit their community health, diagnose low turnout, or ask "what should I do this week?" -> "audit" (with 3 concrete metrics + 3 clickable action steps!)
   - Generate a UK Council RAMS, Local Café/Business Sponsor Pitch, or UK Council/Lottery Grant -> "document"
3. If the leader asks to tweak a previous draft (e.g. "Change time to 9:30", "Make it £5", "Add a 4th poll option", "Make it friendlier"), return the FULL updated "actionCard" immediately so the Output Launchpad updates live!
4. Always provide 3 crisp, high-value "suggestedReplies" (under 8 words each).

RETURN FORMAT:
Return ONLY a valid JSON object matching this exact structure:
{
  "reply": "Your conversational response (markdown bold/bullets allowed)...",
  "actionCard": null OR one of:
    - {
        "type": "events",
        "title": "Launch New Event" | "Draft 4-Week Schedule",
        "events": [
          {
            "weekLabel": "This Weekend",
            "title": "Event Title",
            "date": "YYYY-MM-DD",
            "time": "HH:MM",
            "location": "Specific venue/landmark in ${loc}",
            "description": "Warm description with Meeting Point, What to Expect, What to Bring, and Post-Meetup Social",
            "maxCapacity": 25,
            "ticketPrice": 0
          }
        ]
      }
    - {
        "type": "poll",
        "title": "Launch Community Poll",
        "question": "Short clear question for members?",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
      }
    - {
        "type": "broadcast",
        "title": "Announcement & Social Copy",
        "announcementTitle": "Short title with emoji",
        "inAppAnnouncement": "2-3 sentence feed announcement",
        "pinToTop": true,
        "whatsappCopy": "WhatsApp message with *bold* highlights and emojis",
        "instagramCopy": "Instagram caption with local hashtags"
      }
    - {
        "type": "community_update",
        "title": "Community Profile & Guidelines Upgrade",
        "description": "Warm, welcoming public community description optimised for local discovery (2-3 short paragraphs)",
        "guidelines": ["Rule 1...", "Rule 2...", "Rule 3...", "Rule 4..."]
      }
    - {
        "type": "audit",
        "title": "Community Health & Growth Plan",
        "summary": "2-sentence executive diagnosis using real numbers",
        "metrics": [
          { "label": "Activation Rate", "value": "58%", "status": "good" | "warn" | "action" },
          { "label": "Quiet Newcomers", "value": "5 members", "status": "warn" },
          { "label": "Calendar Pipeline", "value": "1 upcoming", "status": "action" }
        ],
        "actions": [
          {
            "title": "Re-engage Quiet Newcomers",
            "reason": "Why this matters right now based on their data",
            "buttonLabel": "Draft Welcome Broadcast",
            "prompt": "Exact prompt to trigger next when clicked"
          }
        ]
      }
    - {
        "type": "document",
        "docType": "rams" | "sponsor" | "grant",
        "title": "Document Title",
        "document": "Full markdown document..."
      },
  "suggestedReplies": ["Follow-up prompt 1", "Follow-up prompt 2", "Follow-up prompt 3"]
}`;

      const contents = [
        ...history
          .filter((m) => {
            const msgText = m?.content ?? m?.text;
            return m && typeof msgText === 'string' && msgText.trim();
          })
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(m.content ?? m.text).slice(0, 1500) }],
          })),
        { role: 'user', parts: [{ text: prompt }] },
      ];

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemDirective }] },
                contents,
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 4096,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );
          if (response.ok) {
            const geminiData = await response.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              if (parsed?.reply) {
                return NextResponse.json({
                  success: true,
                  fallback: false,
                  mode: 'gemini',
                  modelUsed: model,
                  reply: parsed.reply,
                  actionCard: parsed.actionCard || null,
                  suggestedReplies:
                    Array.isArray(parsed.suggestedReplies) && parsed.suggestedReplies.length > 0
                      ? parsed.suggestedReplies.slice(0, 3)
                      : fallbackReply.suggestedReplies,
                });
              }
            }
          }
        } catch (err) {
          lastApiError = err.message;
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        mode: 'smart-template',
        ...fallbackReply,
      });
    }

    // ==============================================================
    // Specialized Mode: 4-Week Calendar Planner (AI Co-Pilot Layer A)
    // ==============================================================
    if (mode === 'plan-month') {
      const loc = formatShareLocation(communityLocation, 'Tunbridge Wells');
      const focus = prompt || 'Weekly local meetups';
      const fallbackPlan = buildFallbackFourWeekPlan(communityName, loc, communityTags, focus);

      if (!apiKey) {
        return NextResponse.json({
          success: true,
          fallback: true,
          mode: 'smart-template',
          events: fallbackPlan,
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const systemDirective = `You are the AI Community Co-Pilot for "${communityName}" based in ${loc} (tags: ${communityTags.join(', ') || 'community, social, outdoors'}).
Today's date is ${today}.
Leader request / focus: "${focus}"

TASK:
Design a 4-week calendar of 4 distinct, realistic, welcoming in-person events spaced roughly 1 week apart starting from the upcoming weekend.
Each event must feel authentic to ${loc}, beginner-friendly, and designed to turn newcomers into verified regulars.

Return ONLY a valid JSON object with key "events" containing an array of 4 objects, each with:
- "weekLabel": e.g. "Week 1 • Flagship Meetup"
- "title": catchy human title under 50 chars
- "date": YYYY-MM-DD
- "time": HH:MM (24h)
- "location": specific local landmark or venue in/near ${loc}
- "description": warm 3-paragraph markdown description including Meeting Point, What to Expect (zero pressure for first-timers), and Post-Event Social
- "maxCapacity": number (e.g. 20 or 25)
- "ticketPrice": number (0 for free community sessions)`;

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemDirective }] },
                contents: [{ role: 'user', parts: [{ text: `Create a 4-week event schedule for ${communityName} in ${loc}.` }] }],
                generationConfig: { temperature: 0.75, maxOutputTokens: 1800, responseMimeType: 'application/json' },
              }),
            }
          );
          if (response.ok) {
            const geminiData = await response.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed?.events) && parsed.events.length > 0) {
                return NextResponse.json({
                  success: true,
                  fallback: false,
                  mode: 'gemini',
                  modelUsed: model,
                  events: parsed.events,
                });
              }
            }
          }
        } catch (err) {
          lastApiError = err.message;
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        mode: 'smart-template',
        events: fallbackPlan,
      });
    }

    // ==============================================================
    // Specialized Mode: Leader Broadcast & Social Copywriter (Layer A)
    // ==============================================================
    if (mode === 'copilot-broadcast') {
      const loc = formatShareLocation(communityLocation, 'Tunbridge Wells');
      const memberCount = Number(body.memberCount) || 24;
      const nextEventTitle = body.nextEventTitle || 'our next weekend meetup';
      const nextEventDate = body.nextEventDate || 'this weekend';
      const fallbackCopy = buildFallbackBroadcastCopy(prompt, communityName, loc, memberCount, nextEventTitle, nextEventDate);

      if (!apiKey) {
        return NextResponse.json({
          success: true,
          fallback: true,
          mode: 'smart-template',
          ...fallbackCopy,
        });
      }

      const systemDirective = `You are the editorial voice and community manager for "${communityName}" in ${loc} (${memberCount} local members).
Next upcoming event: "${nextEventTitle}" (${nextEventDate}).
Goal: "${prompt}"

Return ONLY a valid JSON object with:
- "announcementTitle": Short title with 1 emoji for an in-app broadcast
- "inAppAnnouncement": Warm 2-3 sentence in-app announcement for community members
- "whatsappCopy": Formatted WhatsApp group message (using *bold* highlights and friendly emojis)
- "instagramCopy": Engaging Instagram caption with local hashtags for ${loc}`;

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemDirective }] },
                contents: [{ role: 'user', parts: [{ text: `Draft community copy for goal: ${prompt}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 900, responseMimeType: 'application/json' },
              }),
            }
          );
          if (response.ok) {
            const geminiData = await response.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              return NextResponse.json({
                success: true,
                fallback: false,
                mode: 'gemini',
                modelUsed: model,
                announcementTitle: parsed.announcementTitle || fallbackCopy.announcementTitle,
                inAppAnnouncement: parsed.inAppAnnouncement || fallbackCopy.inAppAnnouncement,
                whatsappCopy: parsed.whatsappCopy || fallbackCopy.whatsappCopy,
                instagramCopy: parsed.instagramCopy || fallbackCopy.instagramCopy,
              });
            }
          }
        } catch (err) {
          lastApiError = err.message;
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        mode: 'smart-template',
        ...fallbackCopy,
      });
    }

    // ==============================================================
    // Specialized Mode: UK Council RAMS & Local Sponsor/Grant Pitch (Layer B - Leader Pro)
    // ==============================================================
    if (mode === 'copilot-pro-doc') {
      const docType = body.docType || 'rams'; // 'rams' | 'sponsor' | 'grant'
      const loc = formatShareLocation(communityLocation, 'Tunbridge Wells');
      const memberCount = Number(body.memberCount) || 28;
      const verifiedCount = Number(body.verifiedCount) || Math.max(8, Math.round(memberCount * 0.65));
      const eventsHosted = Number(body.eventsHosted) || 6;
      const eventTitle = body.eventTitle || `${communityName} Meetup`;
      const eventLocation = formatShareLocation(body.eventLocation || communityLocation, loc);
      const fallbackDoc = buildFallbackProDocument({
        docType,
        communityName,
        loc,
        memberCount,
        verifiedCount,
        eventsHosted,
        eventTitle,
        eventLocation,
        notes: prompt,
      });

      if (!apiKey) {
        return NextResponse.json({
          success: true,
          fallback: true,
          mode: 'smart-template',
          ...fallbackDoc,
        });
      }

      const systemDirective =
        docType === 'rams'
          ? `You are a UK Health, Safety & Outdoor Community Compliance Advisor preparing a Venue & Trail Risk Assessment (RAMS) for "${communityName}" in ${loc}.
Event: "${eventTitle}" at "${eventLocation}". Additional context: "${prompt}".
Return ONLY a valid JSON object with keys:
- "title": Document title
- "document": Clean, comprehensive markdown Risk Assessment covering: 1. Activity & Venue Summary, 2. Key Hazards & Risk Ratings (Terrain/Slips, Weather/Exposure, Road/Traffic Crossings, First Aid/Medical, Safeguarding & First-Timer Welfare), 3. Control Measures & Leader Brief, 4. Emergency & Dynamic Stop Protocol.`
          : docType === 'grant'
          ? `You are a UK Community Grant & Social Prescribing Writer for "${communityName}" in ${loc}.
Metrics: ${memberCount} local members, ${verifiedCount} Verified In-Person Attendees, ${eventsHosted} in-person gatherings hosted. Focus: "${prompt}".
Return ONLY a valid JSON object with keys:
- "title": Grant Pitch Title
- "document": Persuasive UK National Lottery Awards for All / Local Council Wellbeing Fund application statement covering Community Need, Real-World Impact & Social Prescribing Outcomes, Safeguarding, and Budget Use.`
          : `You are a Local Partnership Director for "${communityName}" in ${loc}.
Metrics: ${memberCount} local members, ${verifiedCount} Verified In-Person Locals, ${eventsHosted} events hosted. Target business / note: "${prompt}".
Return ONLY a valid JSON object with keys:
- "title": Sponsorship Proposal Title
- "document": Warm, high-converting outreach pitch to a local independent business (cafe, gym, outdoor store, or brand) offering the £15/mo Directory Partner or £49/mo Headline Sponsor tier with an exclusive member perk.`;

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemDirective }] },
                contents: [{ role: 'user', parts: [{ text: `Generate ${docType} document for ${communityName}.` }] }],
                generationConfig: { temperature: 0.55, maxOutputTokens: 1600, responseMimeType: 'application/json' },
              }),
            }
          );
          if (response.ok) {
            const geminiData = await response.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              if (parsed?.document) {
                return NextResponse.json({
                  success: true,
                  fallback: false,
                  mode: 'gemini',
                  modelUsed: model,
                  title: parsed.title || fallbackDoc.title,
                  document: parsed.document,
                });
              }
            }
          }
        } catch (err) {
          lastApiError = err.message;
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        mode: 'smart-template',
        ...fallbackDoc,
      });
    }

    // ==============================================================
    // Specialized Mode: Expand rough bullet points into an enticing description
    // ==============================================================
    // ==============================================================
    // Specialized Mode: Member AI Event Matchmaker & Discovery
    // ==============================================================
    // ==============================================================
    // Specialized Mode: 1-Tap AI Event Recap (WhatsApp & Instagram)
    // ==============================================================
    if (mode === 'event-recap') {
      const eventTitle = body.eventTitle || 'Community Meetup';
      const community = body.communityName || 'More Community';
      const loc = formatShareLocation(body.location, 'Tunbridge Wells');
      const count = body.attendeeCount || 12;
      const eventDate = body.date || 'today';

      const fallbackWhatsapp = `*What a fantastic meetup!* 🥾✨\n\nHuge thank you to all *${count} legends* who joined us for *${eventTitle}* at ${loc}!\n\nFresh air, great conversations, and wonderful local connections. Community photos have been added to the event gallery 📸\n\nNext session is being scheduled now. Check upcoming dates and RSVP here:\nhttps://www.morecommunity.app`;

      const fallbackInstagram = `Good people, real life ✨\n\nOver ${count} of us gathered for ${eventTitle} in ${loc}. Real conversations, no screens, pure community.\n\nTag someone who should join the next one! 👇\n\n#LocalEvents #CommunityMatters #MoreCommunity #RealLifeConnection`;

      const fallbackStory = `${count} attendees, great conversations & real connection in ${loc} ✨`;

      if (!apiKey) {
        return NextResponse.json({
          success: true,
          fallback: true,
          mode: 'smart-template',
          whatsapp: fallbackWhatsapp,
          instagram: fallbackInstagram,
          storyQuote: fallbackStory
        });
      }

      const systemDirective = `You are a social media director and community storyteller for "${community}" in ${loc}.
A physical meetup titled "${eventTitle}" took place on ${eventDate} with ${count} attendees.

TASK:
Craft 3 distinct recap formats to share the success and celebrate the members:
1. "whatsapp": An enthusiastic, friendly WhatsApp broadcast post with good emojis, thanking the ${count} attendees, celebrating the community spirit, and inviting them to the next session.
2. "instagram": An engaging Instagram feed caption with natural line breaks, an opening hook, community vibe, call to action, and 5-7 local hashtags for ${loc} and Kent walking.
3. "storyQuote": A short, punchy 1-line phrase (under 12 words) perfect for an Instagram Story sticker or photo overlay.

RETURN FORMAT:
Return ONLY a valid JSON object with keys: "whatsapp", "instagram", "storyQuote".`;

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemDirective }] },
                contents: [
                  { role: 'user', parts: [{ text: `Generate recaps for ${eventTitle} with ${count} attendees.` }] }
                ],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 800,
                  responseMimeType: 'application/json'
                }
              })
            }
          );

          if (response.ok) {
            const geminiData = await response.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              return NextResponse.json({
                success: true,
                fallback: false,
                mode: 'gemini',
                modelUsed: model,
                whatsapp: parsed.whatsapp || fallbackWhatsapp,
                instagram: parsed.instagram || fallbackInstagram,
                storyQuote: parsed.storyQuote || fallbackStory
              });
            }
          }
        } catch (err) {
          lastApiError = err.message;
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        mode: 'smart-template',
        reason: lastApiError,
        whatsapp: fallbackWhatsapp,
        instagram: fallbackInstagram,
        storyQuote: fallbackStory
      });
    }

    if (mode === 'match-events') {
      const candidateEvents = Array.isArray(body.events) ? body.events : [];
      if (!apiKey || candidateEvents.length === 0) {
        const fallback = localSemanticMatch(prompt, candidateEvents);
        return NextResponse.json({
          success: true,
          fallback: true,
          mode: 'smart-template',
          ...fallback
        });
      }

      const eventSummaries = candidateEvents.slice(0, 15).map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        price: e.ticketPrice || 0,
        description: (e.description || '').slice(0, 180)
      }));

      const systemDirective = `You are the AI Concierge for More Community in Tunbridge Wells, Kent.
Your role is to help local residents find the exact in-person events, workshops, walks, and social gatherings that fit their schedule, energy, and mood.
Be warm, enthusiastic, and authentic. 

User query: "${prompt.trim()}"

Available Events:
${JSON.stringify(eventSummaries, null, 2)}

TASK:
1. Select the 1 to 3 events that BEST match what the user is asking for.
2. For each recommended event, write a warm, personalized 1-2 sentence match explanation explaining WHY it fits them (e.g. mention day/time, dog-friendly vibe, pace, or coffee stop).
3. Provide a friendly overall concierge summary.

RETURN FORMAT:
Return ONLY a valid JSON object with:
- "summary": (string) 1-2 warm sentences introducing your picks.
- "recommendations": [
    {
      "eventId": (string matching the event id),
      "matchReason": (string 1-2 personalized sentences),
      "highlightTag": (short tag like "🐕 Dog Friendly", "☕ Cafe Finish", "🌅 Saturday Morning", "🌿 Nature Trail")
    }
  ]`;

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemDirective }] },
                contents: [
                  { role: 'user', parts: [{ text: `Find the best events for: "${prompt}"` }] }
                ],
                generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 800,
                  responseMimeType: 'application/json'
                }
              })
            }
          );

          if (response.ok) {
            const geminiData = await response.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              return NextResponse.json({
                success: true,
                fallback: false,
                mode: 'gemini',
                modelUsed: model,
                summary: parsed.summary || "Here are the top matches for you:",
                recommendations: parsed.recommendations || []
              });
            }
          }
        } catch (err) {
          lastApiError = err.message;
        }
      }

      const fallback = localSemanticMatch(prompt, candidateEvents);
      return NextResponse.json({
        success: true,
        fallback: true,
        mode: 'smart-template',
        reason: lastApiError,
        ...fallback
      });
    }

    if (mode === 'expand-description') {
      if (!apiKey) {
        return NextResponse.json({
          success: true,
          fallback: true,
          mode: 'smart-template',
          reason: 'No GEMINI_API_KEY detected in server environment.',
          description: expandLocalBullets(prompt, communityName, communityLocation)
        });
      }

      const systemDirective = `You are an expert community event director and storyteller for "${communityName}"${communityLocation ? ` in ${communityLocation}` : ''}.
Your job is to transform raw host notes or rough bullet points into an enticing, warm, beautifully written community event description (whether it is a workshop, social, fitness session, creative meetup, or walk).

GUIDELINES:
- Avoid generic corporate clichés ("Whether you are a newcomer or regular...").
- Keep ALL specific facts provided by the host (times, meeting spots, dogs, coffee, terrain, rules).
- Write in a welcoming, enthusiastic, local voice.
- Format cleanly in markdown:
  1. A lively opening paragraph describing the spirit and vibe of the event.
  2. "**The Plan & Vibe:**" (what to expect, format, pace or skill level, accessibility).
  3. "**Meeting Point:**" (exact venue or landmark and how to spot the host).
  4. "**What to Bring:**" (bullet points tailored to the event type).
  5. "**Afterwards:**" (optional cafe, pub, or casual chat if applicable).

Return ONLY a valid JSON object with the single key "description" containing the markdown string.`;

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: systemDirective }]
                },
                contents: [
                  { role: 'user', parts: [{ text: `Here are the host notes to expand and polish:

${prompt}` }] }
                ],
                generationConfig: {
                  temperature: 0.75,
                  maxOutputTokens: 1200,
                  responseMimeType: 'application/json'
                }
              })
            }
          );

          if (response.ok) {
            const geminiData = await response.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              if (parsed.description) {
                return NextResponse.json({
                  success: true,
                  fallback: false,
                  mode: 'gemini',
                  modelUsed: model,
                  description: parsed.description
                });
              }
            }
          } else {
            const errBody = await response.text();
            console.error(`Gemini expand description [${model}] status ${response.status}:`, errBody);
            lastApiError = `${model} returned HTTP ${response.status}`;
          }
        } catch (err) {
          console.warn(`Gemini expand description with ${model} failed:`, err.message);
          lastApiError = err.message;
        }
      }

      return NextResponse.json({
        success: true,
        fallback: true,
        mode: 'smart-template',
        reason: lastApiError || 'Gemini API call failed',
        description: expandLocalBullets(prompt, communityName, communityLocation)
      });
    }

    // ==============================================================
    // Mode: Full Event Generation
    // ==============================================================
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        fallback: true,
        mode: 'smart-template',
        reason: 'No GEMINI_API_KEY detected in server environment.',
        event: generateRichLocalEvent(prompt, communityName, communityLocation, communityTags)
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const systemDirective = `You are a visionary community director and event creator for "${communityName}"${communityLocation ? ` based in ${communityLocation}` : ''}.
Today's date is ${today}.
Your task is to take a brief event idea or voice dictation and craft a complete, highly-engaging real-world community event (such as a workshop, social, fitness session, creative meetup, talk, or walk).

THE PHILOSOPHY:
In an era of endless screens, real-world physical presence and shared experiences are what build true belonging.
Write with warmth, local flavor, and character. Avoid robotic, boilerplate corporate text.

RETURN SPECIFICATIONS:
Return ONLY a valid JSON object with these exact keys:
- "title": (string) A catchy, memorable, human title under 50 characters.
- "description": (string) Markdown description with:
  1. An inviting opening hook capturing the vibe and feeling of the event.
  2. "**The Plan & Vibe:**" (what happens, format, pace or skill level, accessibility).
  3. "**Meeting Point:**" (unmistakable venue or landmark near ${communityLocation || communityName}).
  4. "**What to Bring:**" (bullet points tailored to the activity).
  5. "**Afterwards:**" (cafe, pub, or casual chats if applicable).
- "date": (string YYYY-MM-DD) Calculated intelligently relative to today (${today}). If they say "this saturday" or "sunday", calculate the exact next matching date!
- "time": (string HH:MM 24h format, e.g. "10:00", "09:30", "18:30").
- "location": (string) A recognizable, specific meeting venue or landmark.
- "maxCapacity": (string number) Recommended attendee limit (e.g. "25" for social meetups, "16" for workshops).
- "ticketPrice": (string number) "0" for free community events, or reasonable ticket price if specialized.
- "vibeTags": (array of 3-4 strings matching the event, e.g. ["Social", "Beginner Friendly", "Coffee Stop"] or ["Walk", "Dog Friendly", "Scenic"]).
- "autoReminders": true,
- "autoFeedback": true`;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemDirective }]
              },
              contents: [
                { role: 'user', parts: [{ text: `Create an event from this idea:
"${prompt}"` }] }
              ],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1400,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            const event = JSON.parse(cleaned);
            return NextResponse.json({
              success: true,
              fallback: false,
              mode: 'gemini',
              modelUsed: model,
              event
            });
          }
        } else {
          const errBody = await response.text();
          console.error(`Gemini generate-event [${model}] status ${response.status}:`, errBody);
          lastApiError = `${model} returned HTTP ${response.status}`;
        }
      } catch (err) {
        console.warn(`Gemini model ${model} fetch failed:`, err.message);
        lastApiError = err.message;
      }
    }

    return NextResponse.json({
      success: true,
      fallback: true,
      mode: 'smart-template',
      reason: lastApiError || 'Gemini API call failed',
      event: generateRichLocalEvent(prompt, communityName, communityLocation, communityTags)
    });
  } catch (err) {
    console.error('AI generate-event error:', err);
    return NextResponse.json({
      success: true,
      fallback: true,
      mode: 'smart-template',
      reason: err.message,
      event: generateRichLocalEvent('', 'More Community', '', [])
    });
  }
}

/**
 * Local semantic match fallback when AI keys are unavailable.
 * Matches user intent against candidate events and returns warm recommendations.
 */
function localSemanticMatch(prompt, candidateEvents = []) {
  if (!Array.isArray(candidateEvents) || candidateEvents.length === 0) {
    return {
      summary: 'No upcoming events match this exact search right now. Check out all upcoming events or propose a new one!',
      recommendations: []
    };
  }

  const query = (prompt || '').trim().toLowerCase();
  const queryTokens = query.split(/\s+/).filter(t => t.length > 2);

  const isDog = /dog|pup|hound|canine|four-legged/.test(query);
  const isCoffee = /coffee|cafe|tea|brew|roastery|latte/.test(query);
  const isPub = /pub|pint|beer|drink|social|bar/.test(query);
  const isSunset = /sunset|evening|dusk|night|golden hour/.test(query);
  const isMorning = /morning|early|sunrise|breakfast|am/.test(query);
  const isWeekend = /weekend|saturday|sunday|sat|sun/.test(query);
  const isSaturday = /saturday|sat\b/.test(query);
  const isSunday = /sunday|sun\b/.test(query);
  const isGentle = /gentle|easy|stroll|slow|beginner|flat|accessible/.test(query);
  const isHike = /hike|trail|ramble|trek|fast|hills|nature/.test(query);

  const scored = candidateEvents.map(event => {
    let score = 0;
    const reasons = [];
    const tags = [];

    const title = (event.title || '').toLowerCase();
    const desc = (event.description || '').toLowerCase();
    const loc = (event.location || '').toLowerCase();
    const vibeTags = Array.isArray(event.vibeTags) ? event.vibeTags.map(v => String(v).toLowerCase()) : [];
    const fullText = [title, desc, loc, vibeTags.join(' ')].join(' ');

    queryTokens.forEach(token => {
      if (title.includes(token)) score += 5;
      if (loc.includes(token)) score += 4;
      if (vibeTags.some(t => t.includes(token))) score += 4;
      if (desc.includes(token)) score += 2;
    });

    if (event.date) {
      const d = new Date(event.date + 'T12:00:00');
      const day = d.getDay();
      if (isSaturday && day === 6) {
        score += 6;
        reasons.push('takes place this Saturday');
        tags.push('🌅 Saturday Walk');
      } else if (isSunday && day === 0) {
        score += 6;
        reasons.push('takes place this Sunday');
        tags.push('🌿 Sunday Walk');
      } else if (isWeekend && (day === 0 || day === 6)) {
        score += 4;
        reasons.push('fits a weekend schedule');
        tags.push('🗓️ Weekend');
      }
    }

    if (event.time) {
      const timeLower = event.time.toLowerCase();
      const isEventMorning = timeLower.includes('am') || (/^\d{1,2}:/.test(timeLower) && parseInt(timeLower, 10) < 12);
      const isEventEvening = timeLower.includes('pm') && (/^[5-9]:/.test(timeLower) || /^(1[7-9]|2[0-3]):/.test(timeLower));

      if (isMorning && isEventMorning) {
        score += 4;
        reasons.push('morning start');
        tags.push('☕ Morning');
      }
      if (isSunset && isEventEvening) {
        score += 4;
        reasons.push('evening timing');
        tags.push('🌅 Golden Hour');
      }
    }

    if (isDog && (fullText.includes('dog') || fullText.includes('pup'))) {
      score += 7;
      reasons.push('dog friendly');
      tags.push('🐕 Dog Friendly');
    }
    if (isCoffee && (fullText.includes('coffee') || fullText.includes('cafe'))) {
      score += 6;
      reasons.push('stops for coffee afterwards');
      tags.push('☕ Cafe Finish');
    }
    if (isPub && (fullText.includes('pub') || fullText.includes('drink') || fullText.includes('pint'))) {
      score += 6;
      reasons.push('pub social finish');
      tags.push('🍻 Pub Stop');
    }
    if (isGentle && (fullText.includes('gentle') || fullText.includes('easy') || fullText.includes('stroll') || fullText.includes('flat'))) {
      score += 5;
      reasons.push('relaxed beginner-friendly pace');
      tags.push('👟 Gentle Pace');
    }
    if (isHike && (fullText.includes('trail') || fullText.includes('hike') || fullText.includes('nature') || fullText.includes('woods'))) {
      score += 5;
      reasons.push('scenic nature trail');
      tags.push('🌲 Nature Trail');
    }

    if (event.date) {
      const eventTime = new Date(event.date).getTime();
      const now = Date.now();
      if (eventTime >= now) {
        const daysAway = (eventTime - now) / (1000 * 60 * 60 * 24);
        if (daysAway <= 14) score += Math.max(1, 3 - Math.floor(daysAway / 4));
      }
    }

    const defaultReason = reasons.length > 0
      ? ('Great match: ' + reasons.join(', ') + '.')
      : ('Upcoming community event in ' + formatShareLocation(event.location, 'your area') + ' with a friendly local group.');

    const cleanTagLoc = formatShareLocation(event.location, '');
    const highlightTag = tags[0] || (cleanTagLoc ? ('📍 ' + cleanTagLoc.split(',')[0].trim()) : '✨ Community Pick');

    return {
      event,
      score,
      matchReason: defaultReason,
      highlightTag
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);
  const recommendations = top.map(item => ({
    eventId: item.event.id,
    eventTitle: item.event.title,
    matchReason: item.matchReason,
    highlightTag: item.highlightTag
  }));

  const summary = top.length > 0
    ? ('Found ' + top.length + ' ' + (top.length === 1 ? 'event' : 'events') + ' matching your search:')
    : 'Here are the top upcoming events across the community:';

  return {
    summary,
    recommendations
  };
}

/**
 * Local deterministic bullet points expander.
 * Takes user notes and formats them into an attractive community event description.
 */
function expandLocalBullets(bullets, communityName, communityLocation = '') {
  const locBase = communityLocation || (communityName ? communityName : 'Local Area');
  const lines = (bullets || '')
    .split('\n')
    .map(l => l.replace(/^[•\-\*\d\.]+\s*/, '').trim())
    .filter(Boolean);

  const lower = (bullets || '').toLowerCase();
  const hasDogs = lower.includes('dog') || lower.includes('pup');
  const hasCoffee = lower.includes('coffee') || lower.includes('cafe');
  const hasPub = lower.includes('pub') || lower.includes('drink');

  let meetingPoint = `Main Entrance Gates, ${locBase}`;
  const isWalkPrompt = lower.includes('walk') || lower.includes('hike') || lower.includes('trail') || lower.includes('stroll');
  let routeNotes = isWalkPrompt ? 'A gentle, conversational route suitable for all paces.' : 'A welcoming, well-paced session suitable for newcomers and regulars alike.';
  let kitNotes = isWalkPrompt ? ['Comfortable walking shoes', 'Water bottle', 'Weather-appropriate layers'] : ['Just yourself and an open mind', 'Water bottle (optional)'];
  let socialNotes = hasCoffee 
    ? 'Grabbing warm drinks and pastries at a local cafe afterwards.'
    : hasPub 
      ? 'Wrapping up at a nearby pub for relaxed conversation.'
      : 'Casual post-event chat with fellow members.';

  lines.forEach(line => {
    const l = line.toLowerCase();
    if (l.includes('meet') || l.includes('start') || l.includes('location') || l.includes('gate') || l.includes('car park') || l.includes('station')) {
      meetingPoint = line;
    } else if (l.includes('bring') || l.includes('wear') || l.includes('shoes') || l.includes('water') || l.includes('rain') || l.includes('jacket')) {
      kitNotes.push(line);
    } else if (l.includes('cafe') || l.includes('coffee') || l.includes('pub') || l.includes('social') || l.includes('drink')) {
      socialNotes = line;
    } else {
      routeNotes += ` ${line}.`;
    }
  });

  if (hasDogs) {
    kitNotes.push('Dog lead & waste bags');
  }

  const uniqueKit = Array.from(new Set(kitNotes));

  return `Join us for a friendly, welcoming community ${isWalkPrompt ? 'walk' : 'event'} in ${locBase}! Whether you are a regular or joining for the very first time, this is a relaxed space to disconnect from screens and meet great people from your local area.

**The Plan & Vibe:**
${routeNotes.trim()} Newcomers are warmly welcomed!

**Meeting Point:**
📍 ${meetingPoint}. Look out for the host - we usually gather 5-10 minutes before start time.

**What to Bring:**
${uniqueKit.map(k => `• ${k}`).join('\n')}

**Afterwards:**
${socialNotes} Everyone is invited to stay on!`;
}

/**
 * High-grade local semantic event generator.
 * Works completely offline without API keys, producing rich, warm, structured events.
 */
function generateRichLocalEvent(prompt, communityName, communityLocation = '', communityTags = []) {
  const lower = (prompt || '').toLowerCase();
  const targetDate = resolveEventDate(prompt);
  const targetTime = resolveEventTime(prompt);
  const locBase = communityLocation || (communityName ? communityName : 'Local Area');

  const isDogFriendly = lower.includes('dog') || lower.includes('pup') || lower.includes('hound');
  const isCoffee = lower.includes('coffee') || lower.includes('cafe') || lower.includes('brunch') || lower.includes('roastery');
  const isPub = lower.includes('pub') || lower.includes('drink') || lower.includes('pint') || lower.includes('beer') || lower.includes('wine');
  const isSunset = lower.includes('sunset') || lower.includes('golden hour') || lower.includes('dusk') || lower.includes('evening');
  const isHike = lower.includes('hike') || lower.includes('trail') || lower.includes('hill') || lower.includes('nature') || lower.includes('woods');
  const isGentle = lower.includes('beginner') || lower.includes('easy') || lower.includes('slow') || lower.includes('stroll') || lower.includes('accessible');

  const isWalkInput = lower.includes('walk') || lower.includes('stroll') || lower.includes('ramble') || isHike || isDogFriendly;
  let title = isWalkInput ? 'Weekend Community Walk & Social' : 'Weekend Community Meetup & Social';
  let vibes = isWalkInput ? ['Walk', 'Community'] : ['Event', 'Community'];
  let meetingSpot = `Main Entrance / Venue, ${locBase}`;
  let routePace = isWalkInput ? 'Gentle, conversational pace (approx. 4 - 5 km). Mostly flat paths.' : 'Relaxed, welcoming format open to newcomers and regulars alike.';
  let kit = isWalkInput
    ? ['Comfortable trainers or walking shoes', 'A bottle of water', 'Weather-appropriate layer (jacket or sunscreen)']
    : ['Just yourself', 'A bottle of water (optional)'];
  let social = 'Casual post-event chat with fellow members.';

  if (isDogFriendly) {
    title = isCoffee ? `Paws & Pour: Dog Walk & Coffee at ${locBase}` : `Four-Legged Friends Walk & Play`;
    vibes.push('Dog Friendly');
    if (isCoffee) vibes.push('Coffee Stop');
    meetingSpot = `Open Meadow Pavilion by the park gate, ${locBase}`;
    routePace = 'Relaxed, dog-friendly stroll (approx. 3.5 km) with open greens for friendly dogs to socialize.';
    kit.push('Dog lead & waste bags', 'Dog treats & travel water bowl');
    social = 'We will finish at an outdoor dog-friendly terrace for warm drinks and treats.';
  } else if (isSunset) {
    title = isPub ? `Golden Hour Stroll & Pub Finish` : `Sunset Scenic Walk at ${locBase}`;
    vibes.push('Golden Hour', 'Scenic');
    if (isPub) vibes.push('Pub Social');
    meetingSpot = `Scenic Overlook Point, ${locBase}`;
    routePace = 'Easy evening walk (approx. 4 km) timed to catch the golden light and sunset views.';
    kit.push('Light jacket or windbreaker as temperature drops after dusk', 'Phone/camera for sunset photos');
    social = isPub ? 'Ending at the local pub garden for a well-earned drink and chat.' : 'Ending at a scenic viewpoint for quiet conversations.';
  } else if (isHike) {
    title = `Scenic Nature Loop & Green Trail`;
    vibes.push('Nature', 'Scenic', 'Trail');
    meetingSpot = `Trailhead Car Park & Info Board, ${locBase}`;
    routePace = 'Invigorating woodland & nature loop (approx. 6 - 7 km). Moderate terrain with gentle inclines.';
    kit.push('Sturdy trail shoes or hiking boots with grip', 'Small backpack with snacks and water bottle');
    social = 'Optional stop at the trail tea room afterwards for hot drinks and fresh bakes.';
  } else if (isGentle) {
    title = `Gentle Morning Walk & Conversation`;
    vibes.push('Beginner Friendly', 'Gentle Pace', 'Accessible');
    meetingSpot = `Park Bandstand / Clock Tower, ${locBase}`;
    routePace = 'Easy, inclusive pace (approx. 2.5 - 3 km). Flat, paved, fully step-free route suitable for all.';
    kit.push('Comfortable walking shoes', 'Water bottle');
    social = 'Relaxed sit-down coffee and pastries at the local cafe directly afterwards.';
  } else if (isCoffee) {
    title = `Morning Coffee & Community Walk`;
    vibes.push('Coffee Stop', 'Social', 'Chill');
    meetingSpot = `Front of the Indie Coffee Roastery, ${locBase}`;
    routePace = 'Casual neighbourhood and park loop (approx. 4 km) designed for good chats and connection.';
    kit.push('Reusable takeaway coffee cup (optional)', 'Comfortable walking shoes');
    social = 'Grab a coffee together at the start or finish with 10% off for community members.';
  }

  const description = `Join us for a friendly, welcoming community ${isWalkInput ? 'walk' : 'event'} in ${locBase}! Whether you are a regular or joining for the very first time, this is a relaxed space to disconnect from screens and meet wonderful people from your local area.

**The Plan & Vibe:**
${routePace} Newcomers are warmly welcomed!

**Meeting Point:**
📍 ${meetingSpot}. Look out for the host - we usually gather 5-10 minutes before start time.

**What to Bring:**
${kit.map(k => `• ${k}`).join('\n')}

**Afterwards:**
${social} Everyone is invited to stay on!`;

  return {
    title: (prompt && prompt.length > 5 && prompt.length < 50) ? prompt.charAt(0).toUpperCase() + prompt.slice(1) : title,
    description,
    date: targetDate,
    time: targetTime,
    location: meetingSpot,
    maxCapacity: '25',
    ticketPrice: '0',
    vibeTags: vibes,
    autoReminders: true,
    autoFeedback: true
  };
}

function getUpcomingWeekendDate(weeksOut = 1, dayOfWeek = 6) {
  const now = new Date();
  const curDay = now.getDay();
  let daysUntil = (dayOfWeek - curDay + 7) % 7;
  if (daysUntil === 0) daysUntil = 7;
  const target = new Date(now.getTime() + (daysUntil + (weeksOut - 1) * 7) * 86400000);
  return target.toISOString().split('T')[0];
}

function buildFallbackFourWeekPlan(communityName, loc, tags = [], focus = '') {
  const lowerTags = (tags || []).map((t) => String(t).toLowerCase()).join(' ') + ' ' + String(focus).toLowerCase();
  const isOutdoor = /walk|hike|run|outdoor|trail|nature|dog|swim/.test(lowerTags);

  return [
    {
      weekLabel: 'Week 1 • Flagship Weekend Gathering',
      title: isOutdoor ? `${loc} Morning Trail Loop & Coffee` : `${communityName} Weekend Social & Welcome`,
      date: getUpcomingWeekendDate(1, 6),
      time: '10:00',
      location: `Main Meeting Point, ${loc}`,
      description: `Kick off the month with our flagship ${communityName} gathering in ${loc}! Designed to be super welcoming for first-timers and regulars alike.\n\n**The Plan & Vibe:**\nGentle, conversational pace with zero pressure. If it's your first meetup, look out for our host 10 minutes before we start — you'll be introduced right away.\n\n**Afterwards:**\nOptional coffee and catch-up at a local café afterwards.`,
      maxCapacity: 25,
      ticketPrice: 0,
    },
    {
      weekLabel: 'Week 2 • Mid-Week Reset',
      title: isOutdoor ? `Mid-Week Fresh Air Stroll & Chat` : `Mid-Week Evening Check-In & Tea`,
      date: getUpcomingWeekendDate(2, 3),
      time: '18:30',
      location: `Town Centre / Park Entrance, ${loc}`,
      description: `A relaxed mid-week pause to step away from screens and catch up with neighbours in ${loc}.\n\n**The Plan & Vibe:**\nInformal 60-minute session at an easy pace. Come as you are straight from work or home — zero pressure to stay the whole time.`,
      maxCapacity: 20,
      ticketPrice: 0,
    },
    {
      weekLabel: 'Week 3 • Explorer Session',
      title: isOutdoor ? `Scenic Woodland Route & Bakery Stop` : `${communityName} Deep-Dive & Skill Share`,
      date: getUpcomingWeekendDate(3, 0),
      time: '09:30',
      location: `Woodland Trailhead, ${loc}`,
      description: `Our Week 3 Sunday morning session exploring one of our favourite spots around ${loc}.\n\n**The Plan & Vibe:**\nFriendly group pace with plenty of stops to chat. Verified members can also offer or claim carpool seats directly on the event page!\n\n**What to Bring:**\n• Weather-appropriate layers & comfortable shoes\n• Water bottle`,
      maxCapacity: 25,
      ticketPrice: 0,
    },
    {
      weekLabel: 'Week 4 • End-of-Month Social',
      title: `${communityName} Monthly Social & Newcomer Buddy Meetup`,
      date: getUpcomingWeekendDate(4, 6),
      time: '10:30',
      location: `Local Independent Café, ${loc}`,
      description: `Our end-of-month social gathering in ${loc} celebrating everyone who came out this month and welcoming brand-new members looking to earn their Verified Local standing.\n\n**The Plan & Vibe:**\nWarm, casual social morning over coffee, followed by a gentle optional loop nearby.`,
      maxCapacity: 30,
      ticketPrice: 0,
    },
  ];
}

function buildFallbackBroadcastCopy(goal, communityName, loc, memberCount, nextEventTitle, nextEventDate) {
  const g = String(goal || '').toLowerCase();
  if (g.includes('welcome') || g.includes('first')) {
    return {
      announcementTitle: `👋 Welcome to our newest ${communityName} members!`,
      inAppAnnouncement: `A huge welcome to everyone who joined ${communityName} in ${loc} this week! Remember: your first in-person meetup unlocks Verified Local 🛡️ status (including 1:1 member messaging, offering carpools, and proposing events). Our next session is "${nextEventTitle}" (${nextEventDate}) — first-timers are greeted at the meeting point 10 minutes early!`,
      whatsappCopy: `*Welcome to all our new faces in ${communityName}!* 👋✨\n\nWe're now *${memberCount} locals strong* here in ${loc}.\n\nIf you haven't joined an in-person session yet, our next gathering is *${nextEventTitle}* (${nextEventDate}).\n\n🤝 *First-timer promise:* Zero pressure, go at your own pace, and I'll meet you 10 mins early at the start point so you never walk in alone.\n\n🛡️ Attending your 1st meetup also unlocks *Verified Local* status on the app!\n\nTap to RSVP here:\nhttps://www.morecommunity.app`,
      instagramCopy: `New to ${communityName} in ${loc}? Come join us in real life this week ✨\n\nOver ${memberCount} locals are part of our group, and almost everyone came to their first session solo.\n\n📅 Next up: ${nextEventTitle} (${nextEventDate})\n🤝 First-timer friendly • Zero pressure\n\nLink in bio / More Community app to grab your spot!\n\n#${loc.replace(/[^a-zA-Z0-9]/g, '')} #MoreCommunity #LocalCommunity #RealLifeConnection`,
    };
  }
  if (g.includes('thank') || g.includes('recap') || g.includes('photo')) {
    return {
      announcementTitle: `📸 Thank you for a brilliant session!`,
      inAppAnnouncement: `Huge thank you to everyone who came out for ${communityName} in ${loc}! If you snapped any photos during the meetup, head to the Event Memories gallery on the event page (private to attendees & leaders) and drop them in!`,
      whatsappCopy: `*Huge thank you to everyone who came out!* 🙌✨\n\nNothing beats real-world conversation here in ${loc}. For everyone who attended their first meetup: your *Verified Local 🛡️* badge is now unlocked!\n\n📸 *Got photos from today?* Upload them to the private Attendee Gallery on the event page.\n\nSee you at the next one: *${nextEventTitle}*!`,
      instagramCopy: `Real people, off screens, right here in ${loc} 🌿✨\n\nThank you to everyone who joined ${communityName} this week. Next session is now live on the calendar — come say hello!\n\n#${loc.replace(/[^a-zA-Z0-9]/g, '')} #MoreCommunity #LocalMeetup`,
    };
  }
  return {
    announcementTitle: `🗓️ Next Up: ${nextEventTitle}`,
    inAppAnnouncement: `Our next ${communityName} gathering in ${loc} — "${nextEventTitle}" (${nextEventDate}) — is open for RSVPs! Grab your spot on the calendar, check the Carpool Hub if you need or can offer a lift, and drop any questions in the Event Q&A thread.`,
    whatsappCopy: `*Next Meetup Confirmed: ${nextEventTitle}* 🗓️✨\n\n📍 *Where:* ${loc}\n⏰ *When:* ${nextEventDate}\n\n🚗 *Need or offering a lift?* Verified members can post spare seats in the Carpool Hub on the event page.\n💬 *Questions?* Drop them in the Event Q&A thread!\n\nRSVP your spot here:\nhttps://www.morecommunity.app`,
    instagramCopy: `Next up for ${communityName} in ${loc}: ${nextEventTitle} (${nextEventDate}) ✨\n\nCome join ${memberCount}+ local members for fresh air and good conversation. First-timers always welcome!\n\n#${loc.replace(/[^a-zA-Z0-9]/g, '')} #MoreCommunity #LocalEvents`,
  };
}

function buildFallbackProDocument({ docType, communityName, loc, memberCount, verifiedCount, eventsHosted, eventTitle, eventLocation, notes }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (docType === 'rams') {
    return {
      title: `RAMS Risk Assessment — ${eventTitle}`,
      document: `# VENUE & TRAIL RISK ASSESSMENT (RAMS)
**Community:** ${communityName} (${loc})
**Event / Activity:** ${eventTitle}
**Location / Meeting Point:** ${eventLocation}
**Date Prepared:** ${today}
${notes ? `**Leader Notes:** ${notes}\n` : ''}
---

## 1. Hazard Identification & Risk Matrix

| Hazard | Who Might Be Harmed | Initial Risk | Control Measures in Place | Residual Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Uneven terrain, mud, tree roots, or wet surfaces** | All participants | Medium | • Pre-session route check by leader.<br>• Clear "What to Bring" advisory on event page (appropriate footwear).<br>• Leader sets an inclusive pace and warns group at pinch points/steps. | **Low** |
| **Adverse weather (heavy rain, heat, high winds, cold)** | All participants | Medium | • Forecast checked 24h and 2h prior to start.<br>• Dynamic route shortening or postponement via 1-Tap Broadcast if Met Office warnings apply. | **Low** |
| **Road crossings, car parks & public rights of way** | All participants | Medium | • Group gathers away from active vehicle lanes at ${eventLocation}.<br>• Designated back-marker on groups over 12 attendees. | **Low** |
| **Medical incident, fatigue, or pre-existing condition** | Individual attendee | Medium | • Leader carries charged mobile phone, basic first-aid kit, and offline GPS coordinates.<br>• Zero-pressure policy allows any member to pause or turn back with support. | **Low** |
| **Safeguarding, lone travel & first-timer anxiety** | Newcomers & attendees | Low | • More Community 1st-Meetup Verification Gate: only verified in-person members can offer carpool lifts or initiate 1:1 DMs.<br>• Host greets newcomers 10 minutes prior to start. | **Low** |

---

## 2. Emergency & Dynamic Stop Protocol
1. **Immediate Stop:** Leader halts the group in a safe, visible area away from traffic or water hazards.
2. **Emergency Services:** Call **999** (or **112**) and share exact GPS / what3words pin from the More Community Event Location card.
3. **Incident Log:** Record any injury or near-miss in the Leader Dashboard immediately following the session.`,
    };
  }

  if (docType === 'grant') {
    return {
      title: `Community Wellbeing & Social Prescribing Grant Statement — ${communityName}`,
      document: `# COMMUNITY IMPACT & FUNDING STATEMENT
**Applicant Group:** ${communityName}
**Geographic Area Served:** ${loc} & surrounding parishes
**Date:** ${today}

## 1. Community Need & Purpose
${communityName} is a grassroots, in-person community based in ${loc} dedicated to reducing social isolation, improving physical and mental wellbeing, and helping local residents build lasting real-world friendships away from screens.${notes ? ` (${notes})` : ''}

## 2. Verified Real-World Impact (More Community Data)
- **Active Local Membership:** ${memberCount} local residents registered in ${loc}
- **Verified In-Person Attendance:** ${verifiedCount} members verified at physical meetups
- **Sessions Delivered:** ${eventsHosted}+ structured local gatherings hosted
- **Safeguarding & Accessibility:** Built-in in-person verification tiers (requiring physical meetup attendance before members can offer ride-shares or private message peers), clear first-timer buddy welcoming, and step-free / gentle-pace options.

## 3. Social Prescribing & Local Referral Readiness
Our sessions are structured to accept direct referrals from local GP Social Prescribing Link Workers, voluntary sector partners, and council wellbeing teams via tracked referral links with zero cost barrier to attendees.

## 4. Proposed Use of Micro-Grant Funding (£500 – £2,500)
- **Leader First Aid, Mental Health First Aid (MHFA) & Safeguarding accreditation**
- **Venue hire / wet-weather indoor community space during winter months**
- ** Subsidised tea/coffee & equipment for referred or low-income newcomers**`,
    };
  }

  return {
    title: `Local Business Sponsorship Proposal — ${communityName} (${loc})`,
    document: `Subject: Partnering with ${communityName} (${memberCount} local members in ${loc}) 🤝

Hi there,

I lead **${communityName}** here in ${loc} on the More Community platform. We currently bring together **${memberCount} local residents** (including **${verifiedCount} Verified In-Person Locals** who regularly attend our real-world meetups)${notes ? ` — ${notes}` : ''}.

Because our members actually meet up in person around ${loc} every week — and frequently grab coffee, food, or gear before and after our sessions — we partner with a small number of trusted local businesses.

### Two Simple Ways to Partner With Us:
1. **Headline Community Sponsor (£49/month):**
   - Featured sponsor banner on our ${communityName} community page & event pages
   - Highlighted post-event social spot / recommended local business
   - Exclusive member perk showcased to our Verified Regulars
2. **Local Directory & Perk Partner (£15/month):**
   - Listed in our local partner directory with a clickable link & member offer (e.g., *10% off for ${communityName} members*)

80% of sponsorship goes directly into supporting and running our local community sessions in ${loc}.

You can preview our group and activate a partnership in 2 minutes directly on our page:
https://www.morecommunity.app

Warm regards,
Leader, **${communityName}**`,
  };
}

function buildConversationalCoPilotFallback({
  prompt,
  history = [],
  communityName,
  loc,
  communityTags = [],
  memberCount = 12,
  verifiedCount = 6,
  upcomingEvents = [],
  snapshot = {},
}) {
  const lower = String(prompt || '').toLowerCase();
  const nextEv = upcomingEvents[0] || null;
  const lastAssistantMsg = [...(history || [])].reverse().find((m) => m?.role === 'assistant');
  const memberBreakdown = snapshot.memberBreakdown || {
    total: memberCount,
    verifiedLocals: verifiedCount,
    regulars3Plus: Math.max(0, Math.round(verifiedCount * 0.35)),
    quietNeverAttended: Math.max(0, memberCount - verifiedCount),
  };

  // 0. Live Community Health & Growth Audit
  if (
    lower.includes('audit') ||
    lower.includes('health') ||
    lower.includes('what should i do') ||
    lower.includes('grow') ||
    lower.includes('how is our club') ||
    lower.includes('how are we doing')
  ) {
    const activationPct = memberBreakdown.total > 0 ? Math.round((memberBreakdown.verifiedLocals / memberBreakdown.total) * 100) : 0;
    return {
      reply: `I've analysed **${communityName}** in ${loc} using your live dashboard data!\n\nRight now **${activationPct}%** of your members (${memberBreakdown.verifiedLocals}/${memberBreakdown.total}) have attended an in-person meetup, leaving **${memberBreakdown.quietNeverAttended} quiet newcomer${memberBreakdown.quietNeverAttended === 1 ? '' : 's'}** who joined online but haven't shown up yet. I've built a **3-step action plan** in the Output & Launchpad panel — tap any action to draft and launch it immediately.`,
      actionCard: {
        type: 'audit',
        title: `${communityName} Growth & Health Audit`,
        summary: `You have ${memberBreakdown.verifiedLocals} Verified Locals and ${upcomingEvents.length} upcoming meetup(s) on the calendar. Activating your ${memberBreakdown.quietNeverAttended} quiet newcomers and keeping 3–4 dates ahead on the calendar is your fastest lever this week.`,
        metrics: [
          { label: 'In-Person Activation', value: `${activationPct}%`, status: activationPct >= 50 ? 'good' : 'warn' },
          { label: 'Quiet Newcomers', value: `${memberBreakdown.quietNeverAttended} members`, status: memberBreakdown.quietNeverAttended > 0 ? 'warn' : 'good' },
          { label: 'Upcoming Calendar', value: `${upcomingEvents.length} scheduled`, status: upcomingEvents.length >= 2 ? 'good' : 'action' },
        ],
        actions: [
          {
            title: upcomingEvents.length < 2 ? 'Fill Your Next 4 Weeks on the Calendar' : 'Launch a Beginner-Friendly Coffee Meetup',
            reason: upcomingEvents.length < 2 ? 'Clubs with 3+ upcoming dates convert 2.4× more newcomers into first-time attendees.' : 'Low-pressure morning socials have the highest first-timer attendance rate.',
            buttonLabel: upcomingEvents.length < 2 ? 'Plan 4-Week Schedule' : 'Draft Beginner Meetup',
            prompt: upcomingEvents.length < 2
              ? `Plan our next 4 weeks of meetups in ${loc} with a mix of beginner-friendly and regular sessions.`
              : `Create a single welcoming beginner-friendly meetup for ${communityName} in ${loc} this Sunday at 10:00 AM with a post-event coffee stop.`,
          },
          {
            title: `Activate Your ${memberBreakdown.quietNeverAttended || 'Quiet'} Online Members`,
            reason: 'A warm, low-pressure message reassuring newcomers they can arrive solo doubles first-meetup turnout.',
            buttonLabel: 'Draft Welcome Broadcast',
            prompt: 'Draft a warm in-app announcement and WhatsApp message welcoming quiet newcomers and explaining how attending their first meetup unlocks Verified Local standing.',
          },
          {
            title: 'Let Members Vote on Next Meetup Time',
            reason: 'Members who vote on a poll are 3× more likely to RSVP when the winning date is published.',
            buttonLabel: 'Draft Live Poll',
            prompt: `Create a community poll asking members which day and time works best for our next meetup in ${loc}.`,
          },
        ],
      },
      suggestedReplies: [
        'Draft a welcome broadcast for quiet newcomers',
        'Plan our next 4 weeks of meetups',
        'Rewrite our community bio & guidelines',
      ],
    };
  }

  // 0b. Rewrite Community Bio & Guidelines
  if (lower.includes('bio') || lower.includes('description') || lower.includes('guideline') || lower.includes('rules')) {
    return {
      reply: `I've drafted a warmer, discovery-optimised **Community Description & Guidelines** for **${communityName}** in the Output & Launchpad panel!\n\nYou can edit any sentence directly on the right, then tap **Apply Live to Community Page** to update your public microsite immediately.`,
      actionCard: {
        type: 'community_update',
        title: `Profile & Guidelines Upgrade — ${communityName}`,
        description: `${communityName} is a welcoming, down-to-earth local group in ${loc} bringing friendly neighbours together in real life. Whether you're brand new to the area, coming solo for the first time, or a regular looking for good company, you'll get a warm hello from the moment you arrive.\n\nWe host relaxed, zero-pressure meetups with plenty of time to chat — usually wrapping up at a favourite local café or pub. Come once to earn your Verified Local badge and unlock carpool sharing, 1:1 member messaging, and proposing your own meetup ideas!`,
        guidelines: [
          'Everyone is welcome — say hello to newcomers and make sure nobody stands alone at the start.',
          'Keep RSVPs up to date: if your plans change, cancel at least 24 hours ahead so someone else can take the spot.',
          'No cold sales pitches, spam, or unsolicited promotion inside chats or events.',
          'Look out for each other on routes and socials — respect pace, personal space, and privacy.',
        ],
      },
      suggestedReplies: [
        'Make the bio shorter and punchier',
        'Add a dog-friendly rule to the guidelines',
        'Audit our community health & growth',
      ],
    };
  }

  // 1b. Launch a Community Poll
  if (lower.includes('poll') || lower.includes('vote') || lower.includes('ask members which')) {
    return {
      reply: `I've drafted a live poll for **${communityName}** in the Output & Launchpad panel!\n\n**Where it goes:** Launching this poll publishes it straight to the top of your **${communityName} Page (Overview & Feed tabs)** and sends a notification to all **${memberBreakdown.total} members** to vote. You can edit the question or options directly before tapping Launch.`,
      actionCard: {
        type: 'poll',
        title: `Community Poll for ${communityName}`,
        question: `Which slot works best for our next ${communityName} meetup in ${loc}?`,
        options: [
          'Saturday morning (9:30 AM)',
          'Sunday morning (10:00 AM)',
          'Weekday evening social (6:30 PM)',
          'Either weekend morning works for me!',
        ],
      },
      suggestedReplies: [
        'Change options to outdoor vs café social',
        'Draft a WhatsApp message to share this poll',
        'Create a new meetup for this Sunday at 10am',
      ],
    };
  }

  // 1. Follow-up tweak on a previously drafted event
  if (
    lastAssistantMsg?.actionCard?.type === 'events' &&
    (lower.includes('change') ||
      lower.includes('tweak') ||
      lower.includes('instead') ||
      lower.includes('time') ||
      lower.includes('9:') ||
      lower.includes('10:') ||
      lower.includes('11:') ||
      lower.includes('dog') ||
      lower.includes('coffee') ||
      lower.includes('shorter'))
  ) {
    const prevEvents = lastAssistantMsg.actionCard.events || [];
    const newTime = resolveEventTime(prompt);
    const updatedEvents = prevEvents.map((ev, idx) => {
      const touchesTime = /\b\d{1,2}(:\d{2})?\s*(am|pm)\b|morning|evening|sunset/i.test(prompt);
      const touchesDog = lower.includes('dog');
      return {
        ...ev,
        time: touchesTime ? newTime : ev.time,
        title: touchesDog && !ev.title.toLowerCase().includes('dog') ? `${ev.title} (Dog-Friendly)` : ev.title,
        description:
          touchesDog && !ev.description.toLowerCase().includes('dog')
            ? `${ev.description}\n\n🐕 **Dogs Welcome:** Friendly dogs on leads are very welcome on this route!`
            : ev.description,
      };
    });

    return {
      reply: `I've updated the draft schedule for **${communityName}** with your changes! Take a look at the revised card below — if that feels right, you can publish it straight to your calendar or tell me anything else you'd like to adjust.`,
      actionCard: {
        type: 'events',
        title: `Updated Draft for ${communityName}`,
        events: updatedEvents,
      },
      suggestedReplies: [
        'Draft a WhatsApp invite for this event',
        'Generate a UK RAMS risk assessment for this',
        'Add a post-meetup café stop',
      ],
    };
  }

  // 2. 4-Week / Monthly Calendar Planning
  if (lower.includes('4 week') || lower.includes('4-week') || lower.includes('month') || lower.includes('schedule') || lower.includes('plan')) {
    const plan = buildFallbackFourWeekPlan(communityName, loc, communityTags, prompt);
    return {
      reply: `Here is a balanced 4-week schedule tailored for **${communityName}** in **${loc}**. I've mixed a flagship weekend gathering, a mid-week evening reset, an explorer session, and an end-of-month newcomer social so members with different routines can make their first meetup.\n\nWant me to tweak any of the times, locations, or themes before you publish them?`,
      actionCard: {
        type: 'events',
        title: `4-Week Proposed Schedule (${loc})`,
        events: plan,
      },
      suggestedReplies: [
        'Make Week 1 dog-friendly at 09:30',
        'Draft a WhatsApp message announcing this schedule',
        'Generate a RAMS risk assessment for Week 1',
      ],
    };
  }

  // 3. Single Event Creation / Brainstorming an Event
  if (lower.includes('create an event') || lower.includes('draft an event') || lower.includes('saturday') || lower.includes('sunday') || lower.includes('walk') || lower.includes('meetup idea')) {
    const singleEv = generateRichLocalEvent(prompt, communityName, loc, communityTags);
    return {
      reply: `I've put together a draft for **"${singleEv.title}"** in **${loc}** on **${singleEv.date} at ${singleEv.time}**, including a warm first-timer reassurance note and meeting point details.\n\nWould you like to change the meeting spot, time, or capacity, or publish it straight to your calendar?`,
      actionCard: {
        type: 'events',
        title: 'Ready-to-Publish Event Draft',
        events: [
          {
            weekLabel: 'Draft Meetup',
            title: singleEv.title,
            date: singleEv.date,
            time: singleEv.time,
            location: singleEv.location,
            description: singleEv.description,
            maxCapacity: Number(singleEv.maxCapacity) || 25,
            ticketPrice: Number(singleEv.ticketPrice) || 0,
          },
        ],
      },
      suggestedReplies: [
        'Change start time to 09:30',
        'Also write a WhatsApp invite for this',
        'Create a RAMS risk assessment for this event',
      ],
    };
  }

  // 4. RAMS / Risk Assessment
  if (lower.includes('rams') || lower.includes('risk') || lower.includes('safety') || lower.includes('hazard')) {
    const doc = buildFallbackProDocument({
      docType: 'rams',
      communityName,
      loc,
      memberCount,
      verifiedCount,
      eventsHosted: Math.max(1, upcomingEvents.length),
      eventTitle: nextEv?.title || `${communityName} Meetup`,
      eventLocation: nextEv?.location || loc,
      notes: prompt,
    });
    return {
      reply: `I've prepared a UK Council & Venue-compliant **Risk Assessment (RAMS)** for **${nextEv?.title || communityName}** in **${loc}**. It covers terrain, weather, road crossings, first aid, and our 1st-Meetup Carpool & DM Safeguarding gate.\n\nLet me know if you want to add any specific site hazards (like water, dogs, or night walking)!`,
      actionCard: {
        type: 'document',
        docType: 'rams',
        title: doc.title,
        document: doc.document,
      },
      suggestedReplies: [
        'Add a water / lakeside hazard section',
        'Add dog walking etiquette controls',
        'Now draft a local café sponsor pitch',
      ],
    };
  }

  // 5. Sponsor Pitch or Council Grant
  if (lower.includes('sponsor') || lower.includes('cafe') || lower.includes('café') || lower.includes('business') || lower.includes('grant') || lower.includes('funding') || lower.includes('council')) {
    const isGrant = lower.includes('grant') || lower.includes('funding') || lower.includes('council') || lower.includes('lottery');
    const doc = buildFallbackProDocument({
      docType: isGrant ? 'grant' : 'sponsor',
      communityName,
      loc,
      memberCount,
      verifiedCount,
      eventsHosted: Math.max(2, upcomingEvents.length),
      eventTitle: nextEv?.title || `${communityName} Meetup`,
      eventLocation: loc,
      notes: prompt,
    });
    return {
      reply: isGrant
        ? `Here is a **UK Community Wellbeing & Social Prescribing Grant Statement** for **${communityName}** using your live group metrics (**${memberCount} members**, **${verifiedCount} Verified In-Person Locals** in **${loc}**).\n\nWant me to tailor the budget section toward venue hire, equipment, or leader First Aid training?`
        : `Here is a warm outreach pitch to a local business in **${loc}** highlighting that **${communityName}** has **${memberCount} local members (${verifiedCount} Verified In-Person Locals)** who gather regularly and offering your £15/mo Directory or £49/mo Headline Sponsor tier.\n\nTell me the name of a specific local café, pub, or shop in ${loc} and I'll personalise it for them!`,
      actionCard: {
        type: 'document',
        docType: isGrant ? 'grant' : 'sponsor',
        title: doc.title,
        document: doc.document,
      },
      suggestedReplies: isGrant
        ? ['Focus budget on winter indoor venue hire', 'Focus on Mental Health First Aid training', 'Also draft a local business sponsor pitch']
        : ['Personalise this for a local independent café', 'Personalise this for a local gym / wellness studio', 'Also draft a UK Council micro-grant pitch'],
    };
  }

  // 6. Broadcast / WhatsApp / Social / Welcoming Newcomers
  if (lower.includes('whatsapp') || lower.includes('broadcast') || lower.includes('announce') || lower.includes('welcome') || lower.includes('instagram') || lower.includes('message')) {
    const copy = buildFallbackBroadcastCopy(
      prompt,
      communityName,
      loc,
      memberCount,
      nextEv?.title || 'our next weekend gathering',
      nextEv?.date ? `${nextEv.date}${nextEv.time ? ' at ' + nextEv.time : ''}` : 'this weekend'
    );
    return {
      reply: `I've drafted a matching **In-App Announcement**, **WhatsApp Group message**, and **Instagram caption** for **${communityName}**. You can post the in-app announcement with 1 tap below, or tell me if you'd like the tone more casual or shorter!`,
      actionCard: {
        type: 'broadcast',
        ...copy,
      },
      suggestedReplies: [
        'Make the WhatsApp message shorter & punchier',
        'Focus on welcoming nervous first-timers',
        'Plan our next 4 weeks of events',
      ],
    };
  }

  // 7. General Community Growth / Engagement / First-Timer Advice
  return {
    reply: `Here are three high-impact ways we can grow **${communityName}** in **${loc}** right now (currently **${memberCount} members**, **${verifiedCount} Verified In-Person**):\n\n1. **Turn Newcomers into 1st-Time Attendees:** The biggest hurdle for any local member is walking up to their first gathering solo. Naming a **"First-Timer Welcome Point"** (meeting 10 minutes early with a designated buddy) typically doubles first-event turnout.\n2. **Keep a Consistent Rhythm on the Calendar:** Having at least 2–3 upcoming dates visible at all times lets members plan around family and work — even if one is a simple 45-minute mid-week coffee or stroll.\n3. **Remind Members of Their 1st-Meetup Unlock:** Let new signups know that attending their first meetup unlocks **Verified Local 🛡️** status (carpool driver offers, 1:1 member DMs, and proposing events).\n\nWhich of these should we tackle right now?`,
    actionCard: null,
    suggestedReplies: [
      'Plan our next 4 weeks of events',
      'Draft a warm welcome message for newcomers',
      'Write a pitch to a local café sponsor',
    ],
  };
}
