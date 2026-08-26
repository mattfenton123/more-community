import fs from 'fs';

const uniqueImages = [
  '1553532434-615d0eb1ce0b', // tw-parkrun
  '1544367567-0f2fcb009e0b', // tw-yoga
  '1551632811-561732d1e306', // kent-adventures
  '1513364776144-60967b0f800f', // u3a
  '1529156069898-49953eb1b5ce', // social sisters
  '1511895426328-dc8714191300', // mum club
  '1515169067868-5387ec356754', // entwine
  '1566453982463-5461c360dbfa', // forever active
  '1511795409834-ef04bbd61622', // nourish
  '1552674605-db6ffd4facb5', // additional 1
  '1599901860904-17e6ed7083a0', // additional 2
  '1460661419201-fd4cecdf8a8b', // additional 3
  '1525648199074-cee30ba79a4a', // additional 4
  '1528605248644-14dd04022da1', // additional 5
  '1517836357463-d25dfeac3438', // avatars...
  '1506794778202-cad84cf45f1d',
  '1581579438747-104c557989eb',
  '1531123897727-8f129e1bf98c',
  '1560250097-0b93528c311a',
  '1571008887538-b36bb32f4571',
  '1506126613408-eca07ce68773',
  '1556761175-5973dc0f32e7'
];

function deduplicateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let counter = 0;
  
  // Replace all unsplash URLs with a unique one from our pool, sized appropriately
  content = content.replace(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+(\?[^'"]*)?/g, (match) => {
    const id = uniqueImages[counter % uniqueImages.length];
    counter++;
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Deduplicated ${filePath}`);
}

deduplicateFile('seedFullData.js');
deduplicateFile('seedExtendedData.js');
