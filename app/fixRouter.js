import fs from 'fs';
import path from 'path';

function fixRouter(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixRouter(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let changed = false;
      // Convert react-router-dom to next/navigation
      content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, (match, imports) => {
        changed = true;
        let nextImports = [];
        if (imports.includes('useNavigate')) nextImports.push('useRouter as useNavigate');
        if (imports.includes('useParams')) nextImports.push('useParams');
        if (imports.includes('Link')) nextImports.push('useRouter'); // Will just import it, might need Link from next/link manually. Let's handle Link specifically.
        
        let output = '';
        if (imports.includes('Link')) {
            output += `import Link from 'next/link';\n`;
        }
        if (nextImports.length > 0) {
            output += `import { ${nextImports.join(', ').replace('useRouter as useNavigate, useRouter', 'useRouter as useNavigate')} } from 'next/navigation';`;
        }
        return output;
      });
      
      // Fix Link to tag issues (to="/" -> href="/")
      if (content.includes('<Link to=')) {
          content = content.replace(/<Link\s+to=/g, '<Link href=');
          changed = true;
      }
      
      if (content.includes('useNavigate') || content.includes('useParams') || content.includes('useState')) {
        if (!content.startsWith('"use client";') && !content.startsWith("'use client';")) {
          content = '"use client";\n' + content;
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

fixRouter('./src');
