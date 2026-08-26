import fs from 'fs';
import path from 'path';

function fixImports(dir, depth) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixImports(fullPath, depth + 1);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Calculate the correct relative path prefix to get back to the root `app` folder, then into `src`
      const upStr = '../'.repeat(depth);
      const prefix = upStr + 'src/';
      
      content = content.replace(/from\s+['"]\.\.\/components([^'"]*)['"]/g, `from '${prefix}components$1'`);
      content = content.replace(/from\s+['"]\.\.\/context([^'"]*)['"]/g, `from '${prefix}context$1'`);
      content = content.replace(/from\s+['"]\.\.\/lib([^'"]*)['"]/g, `from '${prefix}lib$1'`);
      content = content.replace(/from\s+['"]\.\.\/data([^'"]*)['"]/g, `from '${prefix}data$1'`);
      
      // Also fix imports like import Component from './CommunityOnboardingFlow' if they were moved differently,
      // but all views were moved as page.jsx in their own folders. So sibling imports (./) in views might break
      // if one view was importing another view. Let's see if that happens.
      content = content.replace(/from\s+['"]\.\/([^'"]*)['"]/g, (match, p1) => {
        // If it's importing another view, that view is now a page.jsx in another folder. 
        // We probably don't have views importing other views directly, except maybe CommunityOnboardingFlow in MyCommunities.
        if (p1 === 'CommunityOnboardingFlow') {
           return `from '${prefix}views/CommunityOnboardingFlow'`; // leave it in src/views or move it
        }
        return match;
      });

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

fixImports('./app', 1);
