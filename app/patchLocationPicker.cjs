const fs = require('fs');
let content = fs.readFileSync('src/components/LocationPicker.jsx', 'utf8');

// Fix MapClickHandler reverse geocoding
content = content.replace(
  "setCoords([lat, lng]);\n      }",
  "setCoords([lat, lng]);\n        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)\n          .then(r => r.json())\n          .then(data => {\n            if (data.display_name) {\n              const name = data.display_name.split(',')[0];\n              setLocationName(name);\n            }\n          })\n          .catch(() => {});\n      }"
);

fs.writeFileSync('src/components/LocationPicker.jsx', content, 'utf8');
console.log('LocationPicker fixed');
