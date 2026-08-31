const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
        processDir(fullPath);
      }
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      // Replace hardcoded white colors
      content = content.replace(/color:\s*['"]white['"]/g, "color: 'var(--white)'");
      content = content.replace(/color:\s*['"]#fff(fff)?['"]/gi, "color: 'var(--white)'");
      
      // Replace logo to add theme-invert
      content = content.replace(/src="\/logo\.png"/g, 'src="/logo.png" className="theme-invert"');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'app'));
