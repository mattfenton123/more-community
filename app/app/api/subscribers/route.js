import { NextResponse } from 'next/navigation';
import { supabase } from '../../../src/lib/supabaseClient';
import { sendTownAlertConfirmationEmail } from '../../../src/lib/emailService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, source = 'newsletter', town = '' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const subscriberName = (name || cleanEmail.split('@')[0]).trim();
    const subId = `sub_${crypto.randomUUID()}`;

    const { error: userErr } = await supabase.from('users').insert({
      id: subId,
      name: subscriberName,
      role: 'Subscriber',
      bio: `[Email: ${cleanEmail}] [Source: ${source}] [Town: ${town}]`,
      joined: `Joined ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(subscriberName)}&background=0d9488&color=fff`,
      interests: [`email:${cleanEmail}`, 'subscriber', 'opt_in:true', `town:${town || 'general'}`],
      location: town || ''
    });

    if (userErr) {
      console.error('[Subscribers] Error creating subscriber:', userErr);
    }

    if (town) {
      await sendTownAlertConfirmationEmail({
        to: cleanEmail,
        name: subscriberName,
        town: town
      });
    }

    return NextResponse.json({ success: true, email: cleanEmail, town });
  } catch (err) {
    console.error('[Subscribers] Server error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
