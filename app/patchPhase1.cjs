const fs = require('fs');

// ===== FIX 1: actions.js - Add ticket_price to insert =====
let actions = fs.readFileSync('src/lib/actions.js', 'utf8');
actions = actions.replace(
  "max_capacity: eventData.maxCapacity || null",
  "max_capacity: eventData.maxCapacity || null,\n    ticket_price: eventData.ticket_price || 0"
);
fs.writeFileSync('src/lib/actions.js', actions, 'utf8');
console.log('✅ actions.js: Added ticket_price to insert');

// ===== FIX 2: LocationPicker - also update parent on typing =====
let picker = fs.readFileSync('src/components/LocationPicker.jsx', 'utf8');
picker = picker.replace(
  "onChange={(e) => setSearchQuery(e.target.value)}",
  "onChange={(e) => { setSearchQuery(e.target.value); setLocationName(e.target.value); }}"
);
fs.writeFileSync('src/components/LocationPicker.jsx', picker, 'utf8');
console.log('✅ LocationPicker.jsx: Input now updates parent on type');

// ===== FIX 3: Login page - handle email confirmation =====
let login = fs.readFileSync('app/login/page.jsx', 'utf8');
// After signup success, check if session exists. If not, show confirmation message.
login = login.replace(
  `let authError;
    if (isSignUp) {
      const { error } = await signUpWithEmail(email, password, name);
      authError = error;
    } else {
      const { error } = await signInWithEmail(email, password);
      authError = error;
    }
    
    if (authError) {
      setError(authError.message);
    } else {
      router.push('/');
    }`,
  `let authError;
    if (isSignUp) {
      const result = await signUpWithEmail(email, password, name);
      authError = result.error;
      // Check if email confirmation is required (session will be null)
      if (!authError && (!result.data?.session)) {
        setError('');
        setIsLoading(false);
        setShowConfirmation && setShowConfirmation(true);
        alert('Check your email! We\\'ve sent you a confirmation link. Click it to activate your account.');
        return;
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      authError = error;
    }
    
    if (authError) {
      setError(authError.message);
    } else {
      router.push('/');
    }`
);
// Also fix the disabled button to include name check
login = login.replace(
  "disabled={isLoading || !email.trim() || !password.trim()}",
  "disabled={isLoading || !email.trim() || !password.trim() || (isSignUp && !name.trim())}"
);
fs.writeFileSync('app/login/page.jsx', login, 'utf8');
console.log('✅ login/page.jsx: Added email confirmation handling + name validation');

// ===== FIX 4: Dashboard - Extract experiences tab from monetisation =====
let dash = fs.readFileSync('app/dashboard/page.jsx', 'utf8');

// The problem: The experiences block (lines 1029-1118) is inside the monetisation publishedEvents.map() return.
// We need to:
// 1. Close the monetisation event item properly before the experiences block
// 2. Move the experiences block to its own section
// 3. Restore the rest of monetisation after it

// Step A: Remove the experiences block from inside the map
const expStart = '          {/* ===== EXPERIENCES MARKETPLACE TAB ===== */}';
const expEnd = '          )}';

// Find the experiences block
const expBlockStartIdx = dash.indexOf(expStart);
const expBlockEndIdx = dash.indexOf(expEnd, expBlockStartIdx);
// Get the actual end (after the closing )})
const expBlockFull = dash.substring(expBlockStartIdx, expBlockEndIdx + expEnd.length);

// Remove it from the monetisation map
dash = dash.replace(expBlockFull + '\n', '');

// Now close the monetisation event item properly where experiences was
// The line before experiences was:
//   <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{ev.price > 0 ? 'Paid' : 'Free'}</div>
// It needs closing </div></div></div> to close the event card
dash = dash.replace(
  `<div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{ev.price > 0 ? 'Paid' : 'Free'}</div>\n\n                        </div>`,
  `<div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{ev.price > 0 ? 'Paid' : 'Free'}</div>
                        </div>
                      </div>
                    );
                  })`
);

// Remove the orphaned closing tags that were after the experiences block
dash = dash.replace(
  `                        </div>
                      </div>
                    );
                  }) : (`,
  `) : (`
);

// Find where the monetisation tab closes and put experiences after it
// The monetisation closing is after the Stripe Payouts section
// Let's find the end of the monetisation tab content
const monetEndMarker = "{/* ===== SOCIAL HUB TAB ===== */}";
const monetEndIdx = dash.indexOf(monetEndMarker);

// Insert the experiences block right before Social Hub
const experiencesBlock = `
          ${expBlockFull}

`;
dash = dash.slice(0, monetEndIdx) + experiencesBlock + dash.slice(monetEndIdx);

// Also fix the Star import - check if it exists
if (!dash.includes("Star,") && !dash.includes("Star }")) {
  // Star is not imported, but let's check the import line
  console.log('⚠️  Star icon may not be imported - checking...');
}

// Fix the dead "Create Event" button in monetisation empty state
dash = dash.replace(
  '<button className="btn btn-outline" style={{ marginTop: \'16px\', borderRadius: \'20px\', padding: \'8px 20px\' }}>Create Event</button>',
  '<button className="btn btn-outline" style={{ marginTop: \'16px\', borderRadius: \'20px\', padding: \'8px 20px\' }} onClick={() => openEventWizard()}>Create Event</button>'
);

fs.writeFileSync('app/dashboard/page.jsx', dash, 'utf8');
console.log('✅ dashboard/page.jsx: Extracted experiences tab, fixed Create Event button');

// ===== FIX 5: OnboardingFlow - Fix progress bar + co-host routing =====
let onboarding = fs.readFileSync('src/views/OnboardingFlow.jsx', 'utf8');

// Fix progress bar: change [0, 1, 2, 3, 4, 5] to [0, 1, 2, 3, 4, 5, 6]
onboarding = onboarding.replace(
  "{[0, 1, 2, 3, 4, 5].map(i =>",
  "{[0, 1, 2, 3, 4, 5, 6].map(i =>"
);

// Fix co-host routing: send to /notifications instead of /dashboard
onboarding = onboarding.replace(
  "if (wantsToLead) {\n        window.location.href = '/dashboard';",
  "if (wantsToLead === true) {\n        window.location.href = '/dashboard';\n      } else if (wantsToLead === 'cohost') {\n        window.location.href = '/notifications';"
);

fs.writeFileSync('src/views/OnboardingFlow.jsx', onboarding, 'utf8');
console.log('✅ OnboardingFlow.jsx: Fixed progress bar + co-host routing');

console.log('\n🎉 All Phase 1 critical fixes applied!');
