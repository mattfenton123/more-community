const fs = require('fs');
let content = fs.readFileSync('app/layout.jsx', 'utf8');

if (!content.includes('import { FeedProvider }')) {
  content = content.replace(/import { useChat, ChatProvider } from '\.\.\/src\/context\/ChatContext';/, "import { useChat, ChatProvider } from '../src/context/ChatContext';\nimport { FeedProvider } from '../src/context/FeedContext';");
}

content = content.replace(/<ChatProvider user=\{user\}>([\s\S]*?)<\/ChatProvider>/, 
  `<ChatProvider user={user}>
      <FeedProvider user={user}>
$1      </FeedProvider>
    </ChatProvider>`);

fs.writeFileSync('app/layout.jsx', content, 'utf8');
