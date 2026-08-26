const fs = require('fs');
let html = fs.readFileSync('investor-deck.html', 'utf8');

const newSlide = `<!-- ═══════════════════════════════════════════════
     SLIDE 16 — TEAM & ADVISORS
═══════════════════════════════════════════════ -->
<div class="slide" id="s16">
  <div class="bg-img">
    <img src="images/adventure.png" alt="">
  </div>
  <div class="bg-overlay-center" style="background:rgba(2,6,23,0.85)"></div>
  <div class="panel" style="position:relative;z-index:2;align-items:flex-start;text-align:left;padding:4rem;max-width:1100px;margin:0 auto;height:100%;justify-content:center">
    <div class="eyebrow anim-1">Team &amp; Advisors</div>
    <h2 class="disp anim-2" style="font-size:clamp(2rem,3.5vw,2.5rem);margin-bottom:2rem">Building the <span class="grad">foundation.</span></h2>
    
    <div style="display:flex;gap:2rem;width:100%" class="anim-3">
      <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:2rem;border-radius:16px;border-top:3px solid var(--teal-400)">
        <div style="font-family:var(--f-head);font-size:.7rem;font-weight:700;letter-spacing:2px;color:var(--slate-400);text-transform:uppercase;margin-bottom:1rem">Current Leadership</div>
        <h3 style="font-family:var(--f-disp);font-size:1.5rem;color:var(--white);margin-bottom:.5rem">Founder &amp; CEO</h3>
        <p style="font-size:.9rem;color:var(--slate-300);line-height:1.5">Qualified Mental Health First Aider, counselling skills practitioner, and active community facilitator. Brings the lived experience and operational playbook required to build real-world communities.</p>
      </div>
      <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:2rem;border-radius:16px;border-top:3px solid var(--amber-400)">
        <div style="font-family:var(--f-head);font-size:.7rem;font-weight:700;letter-spacing:2px;color:var(--slate-400);text-transform:uppercase;margin-bottom:1rem">Key Seed Hires</div>
        <h3 style="font-family:var(--f-disp);font-size:1.5rem;color:var(--white);margin-bottom:.5rem">Technical Co-Founder</h3>
        <p style="font-size:.9rem;color:var(--slate-300);line-height:1.5">Active recruitment for a technical leader to own the platform architecture, mobile app development, and data infrastructure. Seed funding unlocks this crucial hire.</p>
      </div>
    </div>
    
    <div class="anim-4" style="margin-top:2rem;width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:1.5rem;border-radius:16px">
      <div style="font-family:var(--f-head);font-size:.7rem;font-weight:700;letter-spacing:2px;color:var(--slate-400);text-transform:uppercase;margin-bottom:.5rem">Advisory Board Formation</div>
      <p style="font-size:.9rem;color:var(--slate-300);line-height:1.5;margin:0">Actively building an advisory board with expertise in <strong>B2G Enterprise Sales</strong> (NHS procurement) and <strong>Marketplace Scaling</strong>. We are seeking investors who can provide more than capital.</p>
    </div>
  </div>
</div>\n\n`;

html = html.replace('<!-- ═══════════════════════════════════════════════\r\n     SLIDE 16 — THE ASK', newSlide + '<!-- ═══════════════════════════════════════════════\r\n     SLIDE 17 — THE ASK');
html = html.replace('<!-- ═══════════════════════════════════════════════\n     SLIDE 16 — THE ASK', newSlide + '<!-- ═══════════════════════════════════════════════\n     SLIDE 17 — THE ASK');

// Change s16 to s17 for the ask slide
html = html.replace('<div class="slide" id="s16">', '<div class="slide" id="s17">');

html = html.replace('<!-- ═══════════════════════════════════════════════\r\n     SLIDE 17 — CLOSING', '<!-- ═══════════════════════════════════════════════\r\n     SLIDE 18 — CLOSING');
html = html.replace('<!-- ═══════════════════════════════════════════════\n     SLIDE 17 — CLOSING', '<!-- ═══════════════════════════════════════════════\n     SLIDE 18 — CLOSING');

// Change s17 to s18 for the closing slide
html = html.replace('<div class="slide" id="s17">', '<div class="slide" id="s18">');

fs.writeFileSync('investor-deck.html', html, 'utf8');
console.log('done');
