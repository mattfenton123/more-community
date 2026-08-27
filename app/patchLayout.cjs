const fs = require('fs');
let content = fs.readFileSync('app/layout.jsx', 'utf8');

if (!content.includes('import { ChatProvider }')) {
  content = content.replace(/import { useChat } from '\.\.\/src\/context\/ChatContext';/, "import { useChat, ChatProvider } from '../src/context/ChatContext';");
}

content = content.replace(/<div className="app-content">([\s\S]*?)<\/div>\s*\{!isDashboard && <TabBar \/>\}/, 
  `<ChatProvider user={user}>
      <div className="app-content">
$1      </div>
      {!isDashboard && <TabBar />}
    </ChatProvider>`);

fs.writeFileSync('app/layout.jsx', content, 'utf8');
