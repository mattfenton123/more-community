const fs = require('fs');
let content = fs.readFileSync('app/layout.jsx', 'utf8');
content = content.replace(/import \{ useChat \} from '\.\.\/src\/context\/ChatContext';/, "import { useChat, ChatProvider } from '../src/context/ChatContext';");
fs.writeFileSync('app/layout.jsx', content, 'utf8');
