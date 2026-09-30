import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = body.prompt || '';
    const communityName = body.communityName || '';
    const communityTags = body.communityTags || [];

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ fallback: true, event: generateFallback(prompt, communityName) });
    }

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = 'You are a community events planner for ' + JSON.stringify(communityName) + '. Today: ' + today + '. Generate an event for: ' + JSON.stringify(prompt) + '. Return ONLY valid JSON with keys: title, description, date (YYYY-MM-DD 3-7 days from today), time (HH:MM), location, maxCapacity (string number), ticketPrice (string number), autoReminders (bool), autoFeedback (bool).';

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 512, responseMimeType: 'application/json' }
        })
      }
    );

    if (!response.ok) {
      return NextResponse.json({ fallback: true, event: generateFallback(prompt, communityName) });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ fallback: true, event: generateFallback(prompt, communityName) });

    const event = JSON.parse(text);
    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error('AI generate-event error:', err.message);
    return NextResponse.json({ fallback: true, event: generateFallback('', '') });
  }
}

function generateFallback(prompt, communityName) {
  const lower = (prompt || '').toLowerCase();
  const inDays = function(n) { return new Date(Date.now() + 86400000 * n).toISOString().split('T')[0]; };
  if (lower.includes('hike') || lower.includes('walk') || lower.includes('trail')) {
    return { title: 'Sunrise Trail Hike', description: 'Start your morning with fresh air and great company. All fitness levels welcome.', date: inDays(3), time: '07:30', location: 'Local Nature Reserve Trailhead', maxCapacity: '20', ticketPrice: '0', autoReminders: true, autoFeedback: true };
  }
  if (lower.includes('dinner') || lower.includes('food') || lower.includes('eat')) {
    return { title: 'Community Dinner and Connections', description: 'A relaxed evening of great food and even better conversation. Private dining reserved.', date: inDays(5), time: '19:00', location: 'The Local Bistro, High Street', maxCapacity: '16', ticketPrice: '25', autoReminders: true, autoFeedback: true };
  }
  if (lower.includes('drink') || lower.includes('pub') || lower.includes('social') || lower.includes('bar')) {
    return { title: 'After-Work Social Drinks', description: 'Unwind after the week with your community over drinks and good vibes. No agenda, just great people.', date: inDays(4), time: '18:30', location: 'The Tap Room, Town Centre', maxCapacity: '30', ticketPrice: '0', autoReminders: true, autoFeedback: true };
  }
  if (lower.includes('yoga') || lower.includes('fitness') || lower.includes('workout')) {
    return { title: 'Community Yoga and Wellness Morning', description: 'Reset and recharge with a guided yoga session designed for all levels. Bring your mat.', date: inDays(2), time: '08:00', location: 'Community Centre Studio', maxCapacity: '15', ticketPrice: '5', autoReminders: true, autoFeedback: true };
  }
  if (lower.includes('run') || lower.includes('jog') || lower.includes('5k')) {
    return { title: 'Community Parkrun Meetup', description: 'Whether you run, jog, or walk - this is your event. Coffee afterwards for all!', date: inDays(4), time: '09:00', location: 'Local Parkrun Start Line', maxCapacity: '25', ticketPrice: '0', autoReminders: true, autoFeedback: true };
  }
  return { title: (communityName ? communityName + ' ' : '') + 'Community Meetup', description: 'Join us for a brilliant community gathering. Good people, great conversations, and memories to last.', date: inDays(3), time: '11:00', location: 'City Park Main Entrance', maxCapacity: '40', ticketPrice: '0', autoReminders: true, autoFeedback: true };
}