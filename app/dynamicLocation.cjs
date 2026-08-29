const fs = require('fs');

let content = fs.readFileSync('src/views/LeaderDashboard.jsx', 'utf8');

if (!content.includes("next/dynamic")) {
  content = content.replace(/import LocationPicker from '\.\.\/components\/LocationPicker';/, 
    "import dynamic from 'next/dynamic';\nconst LocationPicker = dynamic(() => import('../components/LocationPicker'), { ssr: false });");
}

fs.writeFileSync('src/views/LeaderDashboard.jsx', content, 'utf8');
