import { Resend } from 'resend';
import { getGoogleCalendarUrl } from './calendarInvite';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'more. Community <onboarding@resend.dev>';

export async function sendTicketConfirmationEmail({ to, name, event, community, isGuest = false, plusOne = null }) {
  if (!to || !event) {
    return { success: false, error: 'Missing recipient or event' };
  }

  const googleCalUrl = getGoogleCalendarUrl(event);
  const eventLink = `https://morecommunity.app/events/${event.id}`;
  const encodedShareText = encodeURIComponent(`I'm going to ${event.title} on ${event.date}! Come along with me: ${eventLink}`);
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodedShareText}`;
  const mapsQuery = encodeURIComponent(event.location || '');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const subject = `🎟️ Confirmed: Your spot for ${event.title}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090d16; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background: #0f172a; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 24px 28px; background: linear-gradient(135deg, #134e4a 0%, #042f2e 100%); border-bottom: 1px solid rgba(255,255,255,0.1);">
              <div style="font-size: 1.4rem; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">more.</div>
              <div style="font-size: 0.8rem; color: #5eead4; margin-top: 4px; font-weight: 600;">COMMUNITY TICKET CONFIRMATION</div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h1 style="margin: 0 0 12px 0; font-size: 1.4rem; line-height: 1.3; color: #ffffff; font-weight: 800;">
                You're in, ${name || 'friend'}!
              </h1>
              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.5;">
                Your spot is confirmed for <strong>${event.title}</strong> hosted by <strong>${community?.name || 'more.'}</strong>.
              </p>

              <!-- Event Details Box -->
              <table role="presentation" width="100%" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; margin-bottom: 24px;" cellspacing="0" cellpadding="16">
                <tr>
                  <td>
                    <div style="margin-bottom: 14px;">
                      <div style="font-size: 0.72rem; color: #14b8a6; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📅 Date & Time</div>
                      <div style="font-size: 1rem; color: #ffffff; font-weight: 700; margin-top: 2px;">
                        ${event.date} at ${event.time}
                      </div>
                    </div>

                    <div style="margin-bottom: 14px;">
                      <div style="font-size: 0.72rem; color: #14b8a6; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📍 Meeting Point</div>
                      <div style="font-size: 0.95rem; color: #ffffff; font-weight: 600; margin-top: 2px;">
                        ${event.location || 'Meeting point to be updated by host'}
                      </div>
                      <div style="margin-top: 6px;">
                        <a href="${googleMapsUrl}" target="_blank" style="color: #38bdf8; font-size: 0.8rem; text-decoration: underline; font-weight: 600;">
                          Open Meeting Point in Google Maps →
                        </a>
                      </div>
                    </div>

                    ${plusOne ? `
                    <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; margin-top: 12px;">
                      <div style="font-size: 0.72rem; color: #a78bfa; font-weight: 700; text-transform: uppercase;">👥 +1 Guest Pass Included</div>
                      <div style="font-size: 0.88rem; color: #e2e8f0; margin-top: 2px;">
                        ${plusOne.name || 'Friend'} ${plusOne.email ? `(${plusOne.email})` : ''}
                      </div>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- 1-Tap Calendar CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${googleCalUrl}" target="_blank" style="display: block; background: #0d9488; color: #ffffff; font-weight: 700; font-size: 0.95rem; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; box-shadow: 0 4px 14px rgba(13,148,136,0.4);">
                      🗓️ Add to Google Calendar
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Viral WhatsApp Share Box -->
              <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 14px; padding: 18px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 0.95rem; font-weight: 700; color: #4ade80; margin-bottom: 6px;">
                  🤝 Events are better together!
                </div>
                <p style="margin: 0 0 14px 0; color: #94a3b8; font-size: 0.85rem; line-height: 1.4;">
                  Invite a friend or share with your family so they can join you.
                </p>
                <a href="${whatsappShareUrl}" target="_blank" style="display: inline-block; background: #22c55e; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 0.85rem; padding: 10px 20px; border-radius: 999px;">
                  Share on WhatsApp ↗
                </a>
              </div>

              <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; text-align: center;">
                <a href="${eventLink}" target="_blank" style="color: #94a3b8; font-size: 0.8rem; text-decoration: underline;">
                  View Event Page on more.
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.04); text-align: center;">
              <p style="margin: 0; color: #64748b; fontSize: 0.75rem; line-height: 1.4;">
                You received this ticket because an RSVP was submitted on morecommunity.app.<br>
                more. - Connecting people in real life.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // Send via Resend if API key is configured, otherwise simulate gracefully
  if (resend) {
    try {
      const data = await resend.emails.send({
        from: SENDER_EMAIL,
        to,
        subject,
        html
      });
      console.log(`[EmailService: Sent] Ticket email sent to ${to}`, data);
      return { success: true, data };
    } catch (err) {
      console.error('[EmailService: Error]', err);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[EmailService: Simulated Mode] To: ${to} | Subject: "${subject}" (RESEND_API_KEY not configured in .env.local)`);
    return { success: true, simulated: true };
  }
}

export async function sendTownAlertConfirmationEmail({ to, name, town }) {
  if (!to || !town) return { success: false, error: 'Missing email or town' };

  const subject = `📍 You're on the list for ${town}!`;
  const html = `
    <div style="font-family: sans-serif; background: #0f172a; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #14b8a6;">more.</h2>
      <h3>You're on the list, ${name || 'there'}!</h3>
      <p style="color: #94a3b8; line-height: 1.5;">
        We have added you to our notification alert for <strong>${town}</strong>.
        The moment a leader or community schedules an event near ${town}, you'll receive the first invitation.
      </p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; color: #64748b;">
        more. Community - https://morecommunity.app
      </div>
    </div>
  `;

  if (resend) {
    try {
      const data = await resend.emails.send({
        from: SENDER_EMAIL,
        to,
        subject,
        html
      });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[EmailService: Simulated Mode] Town alert email to ${to} for ${town}`);
    return { success: true, simulated: true };
  }
}
