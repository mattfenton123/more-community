const fs = require('fs');
const path = require('path');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const appCtxMatch = content.match(/import.*useAppContext.*from '([^']+)\/AppContext';/);
  if (appCtxMatch) {
    const basePath = appCtxMatch[1];
    
    if (content.includes('import { useChat') || content.includes('import { ChatProvider')) {
      content = content.replace(/import.*useChat.*from '[^']+ChatContext';/, `import { useChat } from '${basePath}/ChatContext';`);
      // check for ChatProvider special case in layout
      if (content.includes('ChatProvider') && filePath.includes('layout')) {
        content = content.replace(/import.*useChat.*ChatProvider.*from '[^']+ChatContext';/, `import { useChat, ChatProvider } from '${basePath}/ChatContext';`);
      }
      changed = true;
    }
    
    if (content.includes('import { useFeed') || content.includes('import { FeedProvider')) {
      content = content.replace(/import.*useFeed.*from '[^']+FeedContext';/, `import { useFeed } from '${basePath}/FeedContext';`);
      // check for FeedProvider special case in layout
      if (content.includes('FeedProvider') && filePath.includes('layout')) {
        content = content.replace(/import.*FeedProvider.*from '[^']+FeedContext';/, `import { FeedProvider } from '${basePath}/FeedContext';`);
      }
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed ' + filePath);
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
      fixImports(fullPath);
    }
  }
}

walk('app');
walk('src');
