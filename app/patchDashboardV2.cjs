// Fix dashboard: extract experiences tab, add Star import, add Experiences to tabs, fix monetisation button
const fs = require('fs');
let lines = fs.readFileSync('app/dashboard/page.jsx', 'utf8').split('\n');

// 1. Add Star to imports (line 3, 0-indexed line 2)
lines[2] = lines[2].replace('Shield }', 'Shield, Star }');

// 2. Add experiences to desktop sidebar tabs
const desktopTabLine = lines.findIndex(l => l.includes("{ id: 'monetisation'"));
if (desktopTabLine >= 0) {
  // Insert experiences tab after monetisation
  const indent = '              ';
  lines.splice(desktopTabLine + 1, 0, indent + "{ id: 'experiences', icon: Globe, label: 'Experiences' },");
}

// 3. Add experiences to mobile tabs
const mobileTabLine = lines.findIndex(l => l.includes("'overview', 'events', 'monetisation',"));
if (mobileTabLine >= 0) {
  lines[mobileTabLine] = lines[mobileTabLine].replace(
    "'overview', 'events', 'monetisation',",
    "'overview', 'events', 'monetisation', 'experiences',"
  );
}

// 4. Extract the experiences block from inside monetisation's publishedEvents.map
// Find the start: {/* ===== EXPERIENCES MARKETPLACE TAB ===== */}
const expStartLine = lines.findIndex(l => l.includes('EXPERIENCES MARKETPLACE TAB'));
if (expStartLine < 0) { console.error('Could not find experiences block!'); process.exit(1); }

// Find the end: closing )} for {activeTab === 'experiences' && (
// Count braces from expStartLine + 1 (the {activeTab === 'experiences' && ( line)
let braceCount = 0;
let expEndLine = -1;
for (let i = expStartLine + 1; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '(' || ch === '{') braceCount++;
    if (ch === ')' || ch === '}') braceCount--;
  }
  if (braceCount <= 0) {
    expEndLine = i;
    break;
  }
}

if (expEndLine < 0) { console.error('Could not find end of experiences block!'); process.exit(1); }

console.log(`Experiences block: lines ${expStartLine + 1} to ${expEndLine + 1}`);

// Extract the experiences block
const expBlock = lines.slice(expStartLine, expEndLine + 1);

// Remove it from its current position
lines.splice(expStartLine, expEndLine - expStartLine + 1);

// Now close the monetisation event item that was broken
// At what used to be expStartLine, we need to add closing tags for the event card
// The line before the experiences block was the Paid/Free div, which needs its parent </div> closings
// Look at what's now at expStartLine
console.log('Line at splice point:', lines[expStartLine]?.trim());
console.log('Line before splice:', lines[expStartLine - 1]?.trim());
console.log('Line after splice:', lines[expStartLine]?.trim());

// Add the closing divs for the monetisation event card
const closingLines = [
  '                        </div>',
  '                      </div>',
  '                    );',
  '                  })',
];

// But we need to check if the orphaned closings are already there
// After removing the block, the next lines should be the orphaned closing tags
// Let's look at them
console.log('Next few lines after splice:');
for (let i = expStartLine; i < Math.min(expStartLine + 10, lines.length); i++) {
  console.log(`  ${i}: "${lines[i]?.trim()}"`);
}

// The orphaned lines should be: </div>, </div>, );, }) : (
// We need to check if the event card closing is already there or if we need to add it

// Now find where to insert the experiences block (before Social Hub tab)
const socialHubLine = lines.findIndex(l => l.includes('SOCIAL HUB TAB'));
if (socialHubLine >= 0) {
  // Insert experiences block before social hub
  lines.splice(socialHubLine, 0, '', ...expBlock, '');
  console.log(`Inserted experiences block before Social Hub at line ${socialHubLine}`);
}

// 5. Fix the dead Create Event button in monetisation
const createEventBtnLine = lines.findIndex(l => l.includes('Create Event</button>') && !l.includes('onClick'));
if (createEventBtnLine >= 0) {
  lines[createEventBtnLine] = lines[createEventBtnLine].replace(
    '>Create Event</button>',
    ' onClick={() => openEventWizard()}>Create Event</button>'
  );
  console.log(`Fixed dead Create Event button at line ${createEventBtnLine + 1}`);
}

fs.writeFileSync('app/dashboard/page.jsx', lines.join('\n'), 'utf8');
console.log('✅ Dashboard patched');
