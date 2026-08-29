const fs = require('fs');
let content = fs.readFileSync('app/dashboard/page.jsx', 'utf8');

// Replace the plain location input with LocationPicker
const oldInput = `<input className="form-input" placeholder="e.g. The Common, Tunbridge Wells" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} style={{ padding: '14px 16px' }} />`;
const newInput = `<LocationPicker locationName={eventForm.location} setLocationName={(loc) => setEventForm({...eventForm, location: loc})} />`;

if (content.includes(oldInput)) {
  content = content.replace(oldInput, newInput);
  console.log('Replaced location input with LocationPicker');
} else {
  console.log('Could not find exact input string, trying flexible match...');
  content = content.replace(
    /(<input className="form-input" placeholder="e\.g\. The Common, Tunbridge Wells"[^/]*\/>)/,
    newInput
  );
  console.log('Used regex replacement');
}

fs.writeFileSync('app/dashboard/page.jsx', content, 'utf8');
console.log('Done');
