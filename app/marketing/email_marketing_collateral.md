# More Community — Email Marketing Engine & Collateral

This document details the complete email marketing architecture, automated lifecycle sequences, conversion copy, and technical implementation for **More Community** (Tunbridge Wells & West Kent).

---

## 1. Email Architecture & Lifecycle Overview

```
                        ┌─────────────────────────────────────────────────┐
                        │              MORE COMMUNITY EMAIL HUB           │
                        └───────────────────────┬─────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
    ┌──────────────────────────┐                                  ┌──────────────────────────┐
    │  LEADER ACQUISITION FLOW │                                  │  MEMBER ENGAGEMENT FLOW  │
    ├──────────────────────────┤                                  ├──────────────────────────┤
    │ • Touch 1: Showcase Demo │                                  │ • Member Welcome         │
    │ • Touch 2: Meetup vs More│                                  │ • Weekly TW Digest       │
    │ • Touch 3: Coffee Invite │                                  │ • Event RSVP & Reminders │
    │ • Touch 4: Soft Close    │                                  │ • Post-Event Photo Recap │
    └──────────────────────────┘                                  └──────────────────────────┘
```

---

## 2. Leader Acquisition & Pitch Sequence (Cold / Warm Inbound)

### Email 1: The Pre-Built Showcase
* **Trigger:** Contact identified in `pipeline_tracker.csv` or inbound inquiry.
* **Timing:** Day 1.
* **Subject Lines:**
  * Variant A: *Quick question about {{community_name}} in Tunbridge Wells 🙌*
  * Variant B: *Put together a free microsite for {{community_name}}*
* **Preview Text:** *No catch, 100% free forever for local community champions in TW.*
* **Body Copy:**

```text
Hi {{first_name}},

Huge fan of what you’ve built with {{community_name}} in Tunbridge Wells — it’s such an inspiring space for the town.

I’m Matt, local to Tunbridge Wells. We recently launched More Community (morecommunity.app), a community platform built right here in Kent to support local champions like you.

I noticed how hard it is for organizers to coordinate meetups across chaotic WhatsApp chats and expensive tools like Meetup.com (£200+/year). 

To make your life easier, I’ve put together a quick draft microsite for {{community_name}}:
👉 https://www.morecommunity.app/community/{{community_id}}

Here’s what’s already ready for you:
• Your custom branded microsite link
• Clean RSVP lists with capacity caps (no manual counting hands in WhatsApp)
• Automated reminder emails to prevent drop-outs
• 1-second attendee QR check-in on your phone
• 100% Free Forever — no subscription fees, no platform cuts, zero catches.

Would love for you to claim it and test it for your next meetup. Mind if I send over a 60-second walkthrough, or would you fancy a quick 10-minute flat white in town this week?

Rooting for you and {{community_name}},

Matt
Founder, More Community (Royal Tunbridge Wells)
matt@morecommunity.app | 07xxx xxxxxx
```

---

### Email 2: The Honest Cost Comparison (Why £0 Forever?)
* **Trigger:** No reply to Email 1 after 72 hours.
* **Timing:** Day 4.
* **Subject Lines:**
  * Variant A: *Why we will never charge {{community_name}} a penny*
  * Variant B: *Meetup.com (£240/yr) vs More Community (£0)*
* **Preview Text:** *Life is meant to be experienced together. Organizers shouldn't pay to serve their town.*
* **Body Copy:**

```text
Hi {{first_name}},

One question organizers often ask when they see More Community is: "What's the catch? Why is it 100% free?"

Here is our honest philosophy:

Leading {{community_name}} is a public good. You bring people together, reduce social isolation, and make Tunbridge Wells a friendlier place. We believe charging leaders £180–£240 a year just to list their meetups is wrong.

How we compare:
───────────────────────────────────────────────────────────
Feature                  More Community       Meetup.com
───────────────────────────────────────────────────────────
Organizer Annual Cost    £0 Free Forever      £180 – £240/yr
Public Branded Microsite Included             Standard profile
RSVP & Waitlists         Automated            Yes
QR Phone Check-in        Built-in             Clunky
Attendee Ads             Zero Ads             Cluttered
Local Kent Support       Direct (Matt in TW)  Automated bot
───────────────────────────────────────────────────────────

You can claim {{community_name}} in 60 seconds here:
👉 https://www.morecommunity.app/community/{{community_id}}

No credit card required. Ever.

Best,
Matt
```

---

### Email 3: The Pantiles Coffee / Quick Call
* **Trigger:** No reply to Email 2 after 96 hours.
* **Timing:** Day 8.
* **Subject Lines:**
  * Variant A: *Coffee at The Pantiles / Even Flow this week?*
  * Variant B: *Quick 10-min chat about {{community_name}}?*
* **Preview Text:** *Grabbing coffee in town on Thursday morning — would love to say hello.*
* **Body Copy:**

```text
Hi {{first_name}},

Hope you're having a brilliant week!

I’m in town this Thursday and Friday catching up with a few local organizers over coffee (around Even Flow on St John’s or The Cake Shed at The Pantiles).

If you have 15 minutes, I'd love to buy you a flat white and hear more about your upcoming plans for {{community_name}}.

Are you free Thursday morning around 10:30 AM, or would Friday afternoon suit better?

Warmly,
Matt
```

---

### Email 4: The Graceful Soft Close
* **Trigger:** No reply to Email 3 after 6 days.
* **Timing:** Day 14.
* **Subject Lines:**
  * Variant A: *Left the keys with you for {{community_name}}!*
  * Variant B: *No worries at all, {{first_name}}!*
* **Preview Text:** *Your page is saved whenever you need it.*
* **Body Copy:**

```text
Hi {{first_name}},

I know how hectic running a community alongside work and family life is, so I won't crowd your inbox.

Just wanted to let you know that your {{community_name}} page is safely saved for you whenever you’re ready:
👉 https://www.morecommunity.app/community/{{community_id}}

Whenever you get fed up with tracking RSVPs in WhatsApp threads or want a slick home for your meetups, the doors are always open.

Wishing {{community_name}} all the very best!

Matt
Founder, More Community
```

---

## 3. Leader Onboarding & Activation Sequence

### Sequence Overview
```
[Leader Signs Up] 
       │
       ▼
[Email L1: Instant Welcome & Microsite Link] (Immediate)
       │
       ▼ 24 Hours Later
[Email L2: The 3-Click Event Launch Blueprint] (Day 2)
       │
       ▼ 48 Hours Later
[Email L3: The WhatsApp Growth Card & Autopilot Reminders] (Day 4)
```

---

### Email L1: Welcome to the Champions Club
* **Trigger:** Leader creates or claims a community profile.
* **Timing:** Immediate.
* **Subject:** *Welcome to More Community! Here are the keys to {{community_name}} 🎉*
* **Preview Text:** *Your public microsite is live. Here's your 60-second quick start guide.*
* **Key Components:**
  * Direct button to Leader Dashboard.
  * Their public vanity URL: `morecommunity.app/community/{{slug}}`.
  * One-tap WhatsApp group share snippet.

---

### Email L2: Launch Your Next Meetup in 60 Seconds
* **Trigger:** Leader hasn't published an upcoming event 24h after onboarding.
* **Timing:** Day 2.
* **Subject:** *Let's get your next {{community_name}} meetup scheduled 📅*
* **Preview Text:** *Set up your date, location pin, and attendee capacity in under a minute.*
* **Copy Focus:**
  * How setting an RSVP cap creates healthy urgency and accurate headcount.
  * The autopilot reminder system that slashes no-shows by 40%.
  * 1-click event creation walkthrough.

---

### Email L3: Copy & Paste WhatsApp Growth Template
* **Trigger:** Leader published their first event.
* **Timing:** Day 3.
* **Subject:** *Your event is live! Here is the copy to paste into WhatsApp 📲*
* **Preview Text:** *How to introduce your members to frictionless 1-tap RSVPs.*
* **Copy Focus:**
  * Ready-to-copy WhatsApp message with emojis and personalized event link.
  * Tips on printing the cafe table talker or QR flyer for in-person check-in.

---

## 4. Community Member Lifecycle & Engagement Sequence

### Email M1: Welcome to More Community (Tunbridge Wells)
* **Trigger:** Member signs up or RSVPs to their first event.
* **Subject:** *Welcome to More Community, {{first_name}}! Let's get you connected ☕*
* **Preview Text:** *Discover free local runs, walks, coffee socials, and creative circles in TW.*
* **Key Sections:**
  * The philosophy: Less screen time, more face-to-face connection.
  * Browse local communities in Tunbridge Wells.
  * Upcoming meetups happening this weekend.

---

### Email M2: The Weekly Tunbridge Wells Weekend Digest
* **Trigger:** Scheduled every Thursday morning at 8:00 AM.
* **Subject:** *What's happening in Tunbridge Wells this weekend ({{weekend_dates}}) 🌲☕*
* **Preview Text:** *Parkruns, creative circles, mindful walks & social drinks happening near you.*
* **Structure:**
  * **Featured Meetup of the Week:** High-engagement spotlight.
  * **Saturday Morning:** Running, walking, outdoor yoga, parkrun coffee.
  * **Saturday Afternoon / Evening:** Art classes, social drinks, live music.
  * **Sunday Morning:** Dog walks, wild swimming, trail runs, family strollers.
  * **Leader of the Week:** Quick 2-line recognition of a local organizer.

---

### Email M3: Automated Event Reminder & 1-Tap QR Pass
* **Trigger:** 24 hours and 2 hours before an RSVP'd event.
* **Subject:** *See you tomorrow at {{event_title}}! Here is your check-in pass 🎟️*
* **Preview Text:** *Starts at {{event_time}} at {{event_location}}. Add to calendar inside.*
* **Dynamic Content:**
  * High-contrast digital ticket pass with Event Name, Time, Exact Venue Map Pin.
  * Personalized attendee QR code for instant check-in.
  * Meeting point notes (e.g. *"Meet by the Dunorlan cafe patio near the fountain"*).
  * 1-click button to update RSVP if plans have changed (freeing up waitlist spots).

---

## 5. Technical Delivery & Compliance Architecture

1. **Email Service Provider (ESP):**
   * Compatible with **Resend** / **Supabase Auth Emails** / **Postmark** / **SendGrid**.
   * DKIM, SPF, and DMARC records aligned to `morecommunity.app`.
2. **Design Standards:**
   * Bulletproof responsive HTML tables (tested across Apple Mail, Gmail iOS/Android, Outlook).
   * Fallback fonts: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
   * Dark theme aesthetic matching More Community design tokens (`#020617`, `#0f172a`, `#14b8a6`, `#f8fafc`).
3. **PECR & UK GDPR Compliance:**
   * Single-click unsubscribe header (`List-Unsubscribe: <mailto:unsubscribe@morecommunity.app>`).
   * Transparent physical footer address: Royal Tunbridge Wells, Kent, United Kingdom.
   * Clear consent logging for marketing versus transactional messages.
