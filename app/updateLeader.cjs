const fs = require('fs');

let content = fs.readFileSync('src/views/LeaderDashboard.jsx', 'utf8');

if (!content.includes('import LocationPicker')) {
  content = content.replace(/import \{ useAppContext \}/g, "import LocationPicker from '../components/LocationPicker';\nimport { useAppContext }");
}

if (!content.includes('eventCreationMode')) {
  content = content.replace(/const \[eventStep, setEventStep\] = useState\(0\);/, "const [eventStep, setEventStep] = useState(0);\n  const [eventCreationMode, setEventCreationMode] = useState('custom'); // custom or viator\n");
}

content = content.replace(/<div className="form-group">\s*<label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin\s*size=\{14\} color="#3b82f6" \/> Location <span[^>]*>\*<\/span><\/label>\s*<input className="form-input" placeholder="e\.g\. The Common, Tunbridge Wells" value=\{eventForm\.location\} \n*onChange=\{e => setEventForm\(\{\.\.\.eventForm, location: e\.target\.value\}\)\} style=\{\{ padding: '14px 16px' \}\}\s*\/>\s*<\/div>/, 
  `<div className="form-group">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} color="#3b82f6" /> Location <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span></label>
      <LocationPicker locationName={eventForm.location} setLocationName={(loc) => setEventForm({...eventForm, location: loc})} />
    </div>`);

const tabsInject = `
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--slate-800)', padding: '4px', borderRadius: '12px' }}>
        <button 
          onClick={() => setEventCreationMode('custom')} 
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: eventCreationMode === 'custom' ? 'var(--slate-700)' : 'transparent', color: eventCreationMode === 'custom' ? 'white' : 'var(--slate-400)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Custom Event
        </button>
        <button 
          onClick={() => setEventCreationMode('viator')} 
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: eventCreationMode === 'viator' ? 'var(--slate-700)' : 'transparent', color: eventCreationMode === 'viator' ? 'white' : 'var(--slate-400)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Globe size={14} /> Viator Feed
        </button>
      </div>

      {eventCreationMode === 'viator' && eventStep === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '8px' }}>Select an experience to host for your community. It will auto-fill the event details.</div>
          {experiences.map(exp => (
            <div 
              key={exp.id} 
              onClick={() => {
                setEventForm({
                  ...eventForm,
                  title: exp.title,
                  description: exp.description,
                  location: exp.location,
                  image: exp.image,
                  ticketType: 'experience',
                  experienceId: exp.id
                });
                setEventCreationMode('custom'); // switch back to let them pick date/time
                setEventStep(1);
              }}
              style={{ display: 'flex', gap: '12px', background: 'var(--slate-800)', padding: '12px', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--slate-700)' }}
              className="interactive-press"
            >
              <img src={exp.image} alt={exp.title} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'white', marginBottom: '4px' }}>{exp.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {exp.location}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--teal-400)', marginTop: '4px', fontWeight: 600 }}>£{exp.basePrice} (Earn £{exp.leaderMarkup})</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
`;

content = content.replace(/const renderEventForm = \(\) => \(\s*<>/, "const renderEventForm = () => (" + tabsInject);

content = content.replace(/(<div style=\{\{ display: 'flex', gap: '8px', marginTop: '24px' \}\}>[\s\S]*?<\/div>\s*<\/>\s*)\)/, "$1)} )");

fs.writeFileSync('src/views/LeaderDashboard.jsx', content, 'utf8');
