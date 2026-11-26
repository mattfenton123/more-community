import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTownAlertConfirmationEmail } from '../../../src/lib/emailService';
import { getDefaultAvatar } from '../../../src/lib/avatar';

function isValidServiceRoleKey(key, url) {
  if (!key) return false;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (payload.ref) {
      const urlHost = new URL(url).hostname;
      if (!urlHost.includes(payload.ref)) return false;
    }
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

function getDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';
  const rawService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = isValidServiceRoleKey(rawService, url) ? rawService : anonKey;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, source = 'newsletter', town = '' } = body || {};

    if (!email || !String(email).includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const subscriberName = (name || cleanEmail.split('@')[0]).trim();
    const subId = `sub_${crypto.randomUUID()}`;
    const db = getDbClient();

    const subscriberMeta = {
      guest_email: cleanEmail,
      source,
      town: town || 'general',
      opt_in: true,
    };

    const { error: userErr } = await db.from('users').insert({
      id: subId,
      name: subscriberName,
      role: 'Subscriber',
      bio: '',
      joined: `Joined ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
      avatar: getDefaultAvatar(subscriberName),
      interests: [`__profile_meta:${JSON.stringify(subscriberMeta)}`],
      location: town || ''
    });

    if (userErr) {
      console.error('[Subscribers] Error creating subscriber:', userErr.message);
    }

    if (town) {
      try {
        await sendTownAlertConfirmationEmail({
          to: cleanEmail,
          name: subscriberName,
          town: town
        });
      } catch (emailErr) {
        console.error('[Subscribers] Confirmation email error:', emailErr?.message || emailErr);
      }
    }

    return NextResponse.json({ success: true, email: cleanEmail, town });
  } catch (err) {
    console.error('[Subscribers] Server error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
