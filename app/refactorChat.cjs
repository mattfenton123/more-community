const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('useAppContext') && (content.includes('messages') || content.includes('directMessages') || content.includes('chatReadReceipts') || content.includes('markChatRead') || content.includes('sendMessage'))) {
    if (!content.includes('useChat')) {
      let relativePath = '';
      if (filePath.includes('src/context/')) relativePath = './';
      else if (filePath.includes('src/views/')) relativePath = '../context/';
      else if (filePath.includes('src/components/')) relativePath = '../context/';
      else if (filePath.includes('app/app/')) relativePath = '../../../src/context/';
      else relativePath = '../src/context/';

      content = content.replace(/(import.*useAppContext.*)/, "$1\nimport { useChat } from '" + relativePath + "ChatContext';");
      
      content = content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*useAppContext\(\);/g, (match, group) => {
        const vars = group.split(',').map(v => v.trim());
        const chatVars = vars.filter(v => ['messages', 'directMessages', 'chatReadReceipts', 'markChatRead', 'sendMessage', 'sendDirectMessage'].includes(v));
        const appVars = vars.filter(v => !chatVars.includes(v) && v !== '');
        
        let newDecl = '';
        if (appVars.length > 0) newDecl += `const { ${appVars.join(', ')} } = useAppContext();\n    `;
        if (chatVars.length > 0) newDecl += `const { ${chatVars.join(', ')} } = useChat();`;
        
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
