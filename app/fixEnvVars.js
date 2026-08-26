import fs from 'fs';
import path from 'path';

function fixEnvVars(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixEnvVars(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let changed = false;
      if (content.includes('import.meta.env')) {
        content = content.replace(/import\.meta\.env/g, 'process.env');
        changed = true;
      }
      if (content.includes('VITE_')) {
        content = content.replace(/VITE_/g, 'NEXT_PUBLIC_');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed env vars in ${fullPath}`);
      }
    }
  }
}

fixEnvVars('./app');
fixEnvVars('./src');
