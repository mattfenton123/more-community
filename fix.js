const fs = require('fs');
let content = fs.readFileSync('investor-deck.html', 'utf8');

// Fix IDE warning: empty ruleset
content = content.replace('.sig-body{}', '');

// Fix IDE warning: background-clip
content = content.replace(
  '-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800',
  '-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-weight:800'
);

// Fix slide 5 inline-block text render issue
content = content.replace(
  '<span class="grad">hidden',
  '<span class="grad" style="display:inline-block;padding-bottom:0.1em;">hidden'
);

// Replace competitor logos with actual images
content = content.replace(
  '<div style="width:26px;height:26px;border-radius:50%;background:#1877F2;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:.8rem;font-family:var(--f-head)">f</div>',
  '<img src="https://logo.clearbit.com/facebook.com" style="width:26px;height:26px;border-radius:50%;object-fit:cover" onerror="this.style.display=\'none\'">'
);

content = content.replace(
  '<div style="width:26px;height:26px;border-radius:6px;background:#F65858;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:.7rem;font-family:var(--f-head)">M</div>',
  '<img src="https://logo.clearbit.com/meetup.com" style="width:26px;height:26px;border-radius:6px;object-fit:cover" onerror="this.style.display=\'none\'">'
);

content = content.replace(
  '<div style="width:26px;height:26px;border-radius:6px;background:#6515DD;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:.6rem;font-family:var(--f-head)">MN</div>',
  '<img src="https://logo.clearbit.com/mightynetworks.com" style="width:26px;height:26px;border-radius:6px;object-fit:cover" onerror="this.style.display=\'none\'">'
);

content = content.replace(
  '<div style="width:26px;height:26px;border-radius:50%;background:#5865F2;display:flex;align-items:center;justify-content:center;font-size:.85rem">🎮</div>',
  '<img src="https://logo.clearbit.com/discord.com" style="width:26px;height:26px;border-radius:50%;object-fit:cover" onerror="this.style.display=\'none\'">'
);

content = content.replace(
  '<div style="width:26px;height:26px;border-radius:6px;background:#F05537;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:.7rem;font-family:var(--f-head)">E</div>',
  '<img src="https://logo.clearbit.com/eventbrite.com" style="width:26px;height:26px;border-radius:6px;object-fit:cover" onerror="this.style.display=\'none\'">'
);

fs.writeFileSync('investor-deck.html', content);
console.log('Fixed investor-deck.html successfully');
