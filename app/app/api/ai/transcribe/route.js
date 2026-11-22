import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Simple per-IP sliding window rate limiter (20 requests/min)
const rateLimitMap = new Map();
function isRateLimited(identifier, limit = 20, windowMs = 60000) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  rateLimitMap.set(identifier, recent);
  return false;
}

export async function POST(request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for') || 'unknown';
    const clientIp = forwardedFor.split(',')[0].trim();
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Too many voice requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Voice transcription is not configured on the server.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const contextHint = String(formData.get('context') || '').slice(0, 200);

    if (!audioFile || typeof audioFile.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No audio recording received.' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Audio recording was empty.' }, { status: 400 });
    }
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio clip is too long (max 10MB).' }, { status: 413 });
    }

    // Normalise MIME type (strip codec parameters like ';codecs=opus' for Gemini inlineData)
    const rawMime = String(audioFile.type || 'audio/webm').split(';')[0].trim().toLowerCase();
    const supportedMimes = ['audio/webm', 'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac'];
    const mimeType = supportedMimes.includes(rawMime) ? rawMime : 'audio/webm';
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const promptText = `Transcribe this UK English voice message accurately into clean, natural text with proper punctuation and capitalisation.
${contextHint ? `Context hint (names/places that may be mentioned): ${contextHint}` : ''}
Rules:
- Return ONLY the exact spoken transcript, with no quotes, labels, timestamps, or commentary.
- Remove filler stutters only if clearly accidental, keeping the speaker's exact meaning.
- If the audio is silent or unintelligible, return an empty string.`;

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = 'Could not transcribe audio.';

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: promptText },
                    { inlineData: { mimeType, data: base64Audio } },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 512,
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const transcript = String(
            data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          )
            .replace(/^["'`]+|["'`]+$/g, '')
            .trim();
          return NextResponse.json({
            success: true,
            text: transcript,
            modelUsed: model,
          });
        } else {
          const errText = await res.text().catch(() => '');
          lastError = `Gemini status ${res.status}: ${errText.slice(0, 120)}`;
        }
      } catch (err) {
        lastError = err?.message || lastError;
      }
    }

    return NextResponse.json({ error: lastError }, { status: 502 });
  } catch (err) {
    console.error('Voice transcribe error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process voice recording.' },
      { status: 500 }
    );
  }
}
