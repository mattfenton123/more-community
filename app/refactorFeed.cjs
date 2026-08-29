const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('useAppContext') && (content.includes('feedPosts') || content.includes('createFeedPost') || content.includes('likeFeedPost'))) {
    if (!content.includes('useFeed')) {
      let relativePath = '';
      if (filePath.includes('src/context/')) relativePath = './';
      else if (filePath.includes('src/views/')) relativePath = '../context/';
      else if (filePath.includes('src/components/')) relativePath = '../context/';
      else if (filePath.includes('app/app/')) relativePath = '../../../src/context/';
      else relativePath = '../src/context/';

      content = content.replace(/(import.*useAppContext.*)/, "$1\nimport { useFeed } from '" + relativePath + "FeedContext';");
      
      content = content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*useAppContext\(\);/g, (match, group) => {
        const vars = group.split(',').map(v => v.trim());
        const feedVars = vars.filter(v => ['feedPosts', 'createFeedPost', 'likeFeedPost'].includes(v));
        const appVars = vars.filter(v => !feedVars.includes(v) && v !== '');
        
        let newDecl = '';
        if (appVars.length > 0) newDecl += `const { ${appVars.join(', ')} } = useAppContext();\n    `;
        if (feedVars.length > 0) newDecl += `const { ${feedVars.join(', ')} } = useFeed();`;
        
        return newDecl.trim();
      });
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (fullPath.includes('node_modules') || fullPath.includes('.next')) continue;
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath.replace(/\\/g, '/'));
    }
  }
}

walk('app');
walk('src');
console.log("Done");
