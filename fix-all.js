const fs = require('fs');

// --- business-plan.html ---
let bp = fs.readFileSync('business-plan.html', 'utf8');
bp = bp.replace(
  'color: var(--teal-400); font-family: var(--font-heading); font-weight: 700; }',
  'color: var(--white); font-family: var(--font-heading); font-weight: 700; }'
);
bp = bp.replace(
  '<div style="font-family:var(--font-display);font-style:italic;font-size:2.5rem;color:var(--white);margin-bottom:1rem;">morecommunity.co.uk</div>',
  '<div style="font-family:var(--font-display);font-style:italic;font-size:2.5rem;color:var(--white);margin-bottom:1rem;">alex@morecommunity.co.uk</div>'
);
bp = bp.replace(
  '<h3 class="doc-h3" style="margin-top: 2rem;">Product Roadmap &amp; Mobile Strategy</h3>',
  '<h3 class="doc-h3" style="margin-top: 2rem; page-break-before: always;">Product Roadmap &amp; Mobile Strategy</h3>'
);
fs.writeFileSync('business-plan.html', bp);


// --- commercials.html ---
let comm = fs.readFileSync('commercials.html', 'utf8');
// The `th` block has `color: var(--slate-500);`
comm = comm.replace(
  'letter-spacing: 1px;\n    color: var(--slate-500);',
  'letter-spacing: 1px;\n    color: var(--white);'
);
fs.writeFileSync('commercials.html', comm);


// --- investor-deck.html ---
let deck = fs.readFileSync('investor-deck.html', 'utf8');
// It has inline styles `<th style="...color:var(--slate-500)..."`
deck = deck.replace(/<th([^>]*?)color:var\(--slate-500\)([^>]*?)>/g, '<th$1color:var(--white)$2>');
deck = deck.replace(/<th([^>]*?)color:var\(--teal-400\)([^>]*?)>/g, '<th$1color:var(--white)$2>');
// Also, slide 13 table has some inline styles on th: `<th style="padding:1rem;color:var(--slate-500);text-transform:uppercase;letter-spacing:1px;font-size:0.65rem">Metric</th>`
// The regex above will catch it.
fs.writeFileSync('investor-deck.html', deck);

console.log('Fixed all files successfully!');
