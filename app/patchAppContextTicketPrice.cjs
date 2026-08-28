const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.jsx', 'utf8');

// Fix createEvent ticketPrice
content = content.replace(
  "time: eventData.time,",
  "time: eventData.time,\n      ticket_price: eventData.ticketPrice || 0,"
);

// Fix updateEvent ticketPrice
content = content.replace(
  "if (eventData.time !== undefined) updates.time = eventData.time;",
  "if (eventData.time !== undefined) updates.time = eventData.time;\n    if (eventData.ticketPrice !== undefined) updates.ticket_price = eventData.ticketPrice;"
);

fs.writeFileSync('src/context/AppContext.jsx', content, 'utf8');
console.log('AppContext fixed');
