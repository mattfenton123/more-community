const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.jsx', 'utf8');

// Remove chat logic from AppContext to prevent duplicate heavy fetches
content = content.replace(/const \[messages, setMessages\].*\n/g, '');
content = content.replace(/const \[directMessages, setDirectMessages\].*\n/g, '');
content = content.replace(/const \[chatReadReceipts, setChatReadReceipts\].*\n/g, '');

content = content.replace(/supabase\.from\('messages'\)\.select.*\n/, '');
content = content.replace(/supabase\s*\.from\('direct_messages'\)[\s\S]*?\.order\('created_at', \{ ascending: true \}\),\n/g, '');
content = content.replace(/supabase\s*\.from\('chat_read_receipts'\)[\s\S]*?\.eq\('user_id', authUser\.id\),\n/g, '');

content = content.replace(/if \(msgRes\.data\) \{[\s\S]*?if \(dmRes/g, 'if (dmRes');
content = content.replace(/if \(!dmRes\.error[\s\S]*?if \(!readRes/g, 'if (!readRes');
content = content.replace(/if \(!readRes\.error[\s\S]*?\}\n\s*\}\n/g, '}\n');

content = content.replace(/const subMessages[\s\S]*?\.subscribe\(\);\n/g, '');
content = content.replace(/const subDMs[\s\S]*?\.subscribe\(\);\n/g, '');
content = content.replace(/const subReads[\s\S]*?\.subscribe\(\);\n/g, '');

content = content.replace(/supabase\.removeChannel\(subMessages\);\n/g, '');
content = content.replace(/supabase\.removeChannel\(subDMs\);\n/g, '');
content = content.replace(/supabase\.removeChannel\(subReads\);\n/g, '');

content = content.replace(/const sendMessage[\s\S]*?\}\n  };\n/g, '');
content = content.replace(/const sendDirectMessage[\s\S]*?\}\n  };\n/g, '');
content = content.replace(/const markChatRead[\s\S]*?\}\n  };\n/g, '');

content = content.replace(/messages,\n/g, '');
content = content.replace(/directMessages,\n/g, '');
content = content.replace(/chatReadReceipts,\n/g, '');
content = content.replace(/sendMessage,\n/g, '');
content = content.replace(/sendDirectMessage,\n/g, '');
content = content.replace(/markChatRead,\n/g, '');

// Also remove them from the Promise.all array destructuring
content = content.replace(/msgRes, /g, '');
content = content.replace(/dmRes, /g, '');
content = content.replace(/readRes, /g, '');

fs.writeFileSync('src/context/AppContext.jsx', content, 'utf8');
