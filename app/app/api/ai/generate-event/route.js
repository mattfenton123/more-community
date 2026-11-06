import { NextResponse } from 'next/server';

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
    const body = await request.json();
    const prompt = body.prompt || body.description || '';
    const communityName = body.communityName || 'More Community';
    const communityLocation = body.communityLocation || '';
    const communityTags = Array.isArray(body.communityTags) ? body.communityTags : [];
    const mode = body.mode || 'full-event';

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt or notes are required' }, { status: 400 });
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '').trim();
    // Use proven, universally supported Gemini models on Google AI Studio
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastApiError = null;

    // ==============================================================
    // Specialized Mode: Expand rough bullet points into an enticing description
    // ==============================================================
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

      const systemDirective = `You are an expert community walk director and storyteller for "${communityName}"${communityLocation ? ` in ${communityLocation}` : ''}.
Your job is to transform raw host notes or rough bullet points into an enticing, warm, beautifully written community walk description.

GUIDELINES:
- Avoid generic corporate clichés ("Whether you are a newcomer or regular...").
- Keep ALL specific facts provided by the host (times, meeting spots, dogs, coffee, terrain, rules).
- Write in a welcoming, enthusiastic, local voice.
- Format cleanly in markdown:
  1. A lively opening paragraph describing the spirit and scenery of the meetup.
  2. "**The Route & Vibe:**" (pace, distance, path terrain, accessibility).
  3. "**Meeting Point:**" (exact landmark and how to spot the group).
  4. "**What to Bring:**" (bullet points of footwear, layers, water).
  5. "**Post-Walk Social:**" (cafe, pub, or casual conversation).

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
Your task is to take a brief event idea or voice dictation and craft a complete, highly-engaging real-world community walk or meetup.

THE PHILOSOPHY:
In an era of endless screens, real-world physical presence and walking side-by-side is the ultimate experience. 
Write with warmth, local flavor, and character. Avoid robotic, boilerplate corporate text.

RETURN SPECIFICATIONS:
Return ONLY a valid JSON object with these exact keys:
- "title": (string) A catchy, memorable, human title under 50 characters (e.g. "Sunset Heath Stroll & Pub Finish", "Four-Legged Friends Park Loop", "Sunrise Woodland Walk & Flat Whites").
- "description": (string) Markdown description with:
  1. An inviting opening hook capturing the vibe and feeling of the walk.
  2. "**The Route & Vibe:**" (pace, distance e.g. 4-5 km, terrain, accessibility).
  3. "**Meeting Point:**" (unmistakable landmark near ${communityLocation || communityName}).
  4. "**What to Bring:**" (bullet points: comfortable trainers/boots, water, layers).
  5. "**Post-Walk Social:**" (cafe, pub, or casual chats).
- "date": (string YYYY-MM-DD) Calculated intelligently relative to today (${today}). If they say "this saturday" or "sunday", calculate the exact next matching date!
- "time": (string HH:MM 24h format, e.g. "10:00", "09:30", "18:30").
- "location": (string) A recognizable, specific meeting landmark (e.g. "North Gate Clocktower, Richmond Park").
- "maxCapacity": (string number) Recommended attendee limit (e.g. "25" for social walks, "16" for intimate groups).
- "ticketPrice": (string number) "0" for community walks, or reasonable ticket price if specialized.
- "vibeTags": (array of 3-4 strings, e.g. ["Walk", "Dog Friendly", "Coffee Stop", "Scenic Nature"]).
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
 * Local deterministic bullet points expander.
 * Takes user notes and formats them into an attractive community walk description.
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
  let routeNotes = 'A gentle, conversational route suitable for all paces.';
  let kitNotes = ['Comfortable walking shoes', 'Water bottle', 'Weather-appropriate layers'];
  let socialNotes = hasCoffee 
    ? 'Grabbing warm drinks and pastries at a local cafe afterwards.'
    : hasPub 
      ? 'Wrapping up at a nearby pub garden for relaxed conversation.'
      : 'Casual post-walk chat with fellow members.';

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

  return `Join us for a friendly, welcoming community walk in ${locBase}! Whether you are a regular or joining for the very first time, this is a relaxed space to disconnect from screens, get some fresh air, and meet great people from your local area.

**The Route & Vibe:**
${routeNotes.trim()} All fitness levels and newcomers are warmly welcomed!

**Meeting Point:**
📍 ${meetingPoint}. Look out for the group - we usually gather 5-10 minutes before start time.

**What to Bring:**
${uniqueKit.map(k => `• ${k}`).join('\n')}

**Post-Walk Social:**
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

  let title = 'Weekend Community Walk & Social';
  let vibes = ['Walk', 'Community'];
  let meetingSpot = `Main Entrance Gates, ${locBase}`;
  let routePace = 'Gentle, conversational pace (approx. 4 - 5 km). Mostly flat trails and paved pathways.';
  let kit = [
    'Comfortable trainers or walking shoes',
    'A bottle of water',
    'Weather-appropriate layer (jacket or sunscreen)'
  ];
  let social = 'Casual post-walk chat with fellow members.';

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

  const description = `Join us for a friendly, welcoming community walk in ${locBase}! Whether you are a regular or joining for the very first time, this is a relaxed space to disconnect from screens, get some fresh air, and meet wonderful people from your local area.

**The Route & Vibe:**
${routePace} All fitness and confidence levels are welcome!

**Meeting Point:**
📍 ${meetingSpot}. Look out for the group - we usually gather 5-10 minutes before start time.

**What to Bring:**
${kit.map(k => `• ${k}`).join('\n')}

**Post-Walk Social:**
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
