const fs = require('fs');
let content = fs.readFileSync('app/discover/page.jsx', 'utf8');

content = content.replace(
  "onClick={() => navigate.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>",
  "onClick={() => navigate.push('/profile')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>"
);

content = content.replace(
  "onClick={() => navigate.back()}\n                  className=\"interactive-press\"\n                  style={{\n                    margin: '0 20px 16px', padding: '1.1rem 1.25rem',",
  "onClick={() => navigate.push('/dashboard')}\n                  className=\"interactive-press\"\n                  style={{\n                    margin: '0 20px 16px', padding: '1.1rem 1.25rem',"
);

fs.writeFileSync('app/discover/page.jsx', content, 'utf8');
console.log('discover fixed');
