const fs = require('fs');

async function run() {
  let html = fs.readFileSync('investor-deck.html', 'utf8');
  
  // Find where slide 14 starts
  const marker = '<div class="slide" id="s14">';
  const insertionPoint = html.indexOf(marker);
  
  if (insertionPoint === -1) {
    console.error('Could not find id="s14"');
    return;
  }
  
  // Split html into before and after
  // The comment before slide 14 usually starts with <!-- ════
  // Let's find that comment.
  const commentStart = html.lastIndexOf('<!--', insertionPoint);
  
  let before = html.substring(0, commentStart);
  let after = html.substring(commentStart);
  
  // In the 'after' section, we need to renumber s16->17, s15->16, s14->15
  after = after.replace('SLIDE 16', 'SLIDE 17');
  after = after.replace('id="s16"', 'id="s17"');
  after = after.replace('SLIDE 15', 'SLIDE 16');
  after = after.replace('id="s15"', 'id="s16"');
  after = after.replace('SLIDE 14', 'SLIDE 15');
  after = after.replace('id="s14"', 'id="s15"');
  
  const slide14HTML = `<!-- ═══════════════════════════════════════════════
     SLIDE 14 — FINANCIAL PROJECTIONS
═══════════════════════════════════════════════ -->
<div class="slide" id="s14">
  <div style="display:flex;height:100%;width:100%">
    <div style="flex:0 0 35%;background:var(--slate-900);padding:3.5rem 3rem;display:flex;flex-direction:column;justify-content:center">
      <div class="eyebrow anim-1">Financials</div>
      <h2 class="disp anim-2" style="font-size:clamp(2.2rem,4vw,3.5rem)">Venture<br><span class="grad">Scale.</span></h2>
      <p class="body-txt anim-3" style="margin-top:.75rem">Built on hyper-local density and national enterprise expansion.</p>
    </div>
    <div style="flex:1;padding:4rem;display:flex;flex-direction:column;justify-content:center;background:var(--slate-950)">
      <table class="rev-table anim-4" style="width:100%;text-align:left;border-collapse:collapse;margin-top:1rem;font-size:0.85rem">
        <thead>
          <tr style="border-bottom:2px solid rgba(255,255,255,0.1)">
            <th style="padding:1rem;color:var(--slate-500);text-transform:uppercase;letter-spacing:1px;font-size:0.65rem">Metric</th>
            <th style="padding:1rem;color:var(--teal-300)">Year 1</th>
            <th style="padding:1rem;color:var(--teal-300)">Year 2</th>
            <th style="padding:1rem;color:var(--teal-300)">Year 3</th>
            <th style="padding:1rem;color:var(--teal-300)">Year 4</th>
            <th style="padding:1rem;color:var(--teal-300)">Year 5</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
            <td style="padding:1rem;color:var(--slate-400)">Live Towns</td>
            <td style="padding:1rem">3</td>
            <td style="padding:1rem">15</td>
            <td style="padding:1rem">80</td>
            <td style="padding:1rem">200</td>
            <td style="padding:1rem;font-weight:700">500</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
            <td style="padding:1rem;color:var(--slate-400)">NHS / Gov Contracts</td>
            <td style="padding:1rem">0</td>
            <td style="padding:1rem">1</td>
            <td style="padding:1rem">3</td>
            <td style="padding:1rem">10</td>
            <td style="padding:1rem;font-weight:700">25</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
            <td style="padding:1rem;color:var(--white);font-weight:600">Total Revenue</td>
            <td style="padding:1rem;color:var(--white)">£10k</td>
            <td style="padding:1rem;color:var(--white)">£195k</td>
            <td style="padding:1rem;color:var(--white)">£745k</td>
            <td style="padding:1rem;color:var(--white)">£2.75M</td>
            <td style="padding:1rem;color:var(--amber-400);font-weight:700;font-size:1rem">£6.75M</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
            <td style="padding:1rem;color:var(--slate-400)">Total Costs</td>
            <td style="padding:1rem;color:var(--slate-400)">£181k</td>
            <td style="padding:1rem;color:var(--slate-400)">£517k</td>
            <td style="padding:1rem;color:var(--slate-400)">£1.13M</td>
            <td style="padding:1rem;color:var(--slate-400)">£2.92M</td>
            <td style="padding:1rem;color:var(--slate-400)">£6.50M</td>
          </tr>
          <tr>
            <td style="padding:1rem;color:var(--white);font-weight:600">EBITDA</td>
            <td style="padding:1rem;color:var(--white)">-£171k</td>
            <td style="padding:1rem;color:var(--white)">-£322k</td>
            <td style="padding:1rem;color:var(--white)">-£392k</td>
            <td style="padding:1rem;color:var(--white)">-£175k</td>
            <td style="padding:1rem;color:var(--teal-400);font-weight:700">+£245k</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>\n\n`;

  let newHtml = before + slide14HTML + after;
  
  // Update slide counter total
  newHtml = newHtml.replace('1 / 16', '1 / 17');
  newHtml = newHtml.replace('16</div><div class="stat-lbl" style="text-align:center">Slide Deck', '17</div><div class="stat-lbl" style="text-align:center">Slide Deck');
  
  fs.writeFileSync('investor-deck.html', newHtml, 'utf8');
  console.log('Successfully inserted Financials slide.');
  
  let exporter = fs.readFileSync('export-deck-pdf.js', 'utf8');
  exporter = exporter.replace('const TOTAL_SLIDES = 14;', 'const TOTAL_SLIDES = 17;');
  fs.writeFileSync('export-deck-pdf.js', exporter, 'utf8');
  console.log('Successfully updated export-deck-pdf.js TOTAL_SLIDES to 17.');
}
run();
