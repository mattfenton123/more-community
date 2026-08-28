const fs = require('fs');
let content = fs.readFileSync('app/dashboard/page.jsx', 'utf8');

// Add Experiences to desktop tabs
content = content.replace(
  "{ id: 'monetisation', icon: DollarSign, label: 'Monetisation' },",
  "{ id: 'monetisation', icon: DollarSign, label: 'Monetisation' },\n              { id: 'experiences', icon: Globe, label: 'Experiences' },"
);

// Add Experiences to mobile tabs
content = content.replace(
  "['overview', 'events', 'monetisation', 'social hub', 'crm', 'members', 'settings'].map(tab => (",
  "['overview', 'events', 'monetisation', 'experiences', 'social hub', 'crm', 'members', 'settings'].map(tab => ("
);

// Fix handleEditEvent to reset eventStep
content = content.replace(
  "const handleEditEvent = (event) => {\n    setEditingEventId(event.id);",
  "const handleEditEvent = (event) => {\n    setEditingEventId(event.id);\n    setEventStep(0);"
);

// Fix monetisation empty state Create Event button
content = content.replace(
  "<button className=\"btn btn-primary\" style={{ padding: '12px 24px', borderRadius: '8px' }}>\n                Create Event",
  "<button className=\"btn btn-primary\" style={{ padding: '12px 24px', borderRadius: '8px' }} onClick={() => openEventWizard()}>\n                Create Event"
);

fs.writeFileSync('app/dashboard/page.jsx', content, 'utf8');
console.log('Dashboard fixed');
