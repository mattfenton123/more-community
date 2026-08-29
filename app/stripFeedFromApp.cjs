const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.jsx', 'utf8');

// Remove feed logic from AppContext to prevent duplicate heavy fetches
content = content.replace(/const \[feedPosts, setFeedPosts\].*\n/g, '');

content = content.replace(/supabase\.from\('feed_posts'\)\.select.*\n/, '');

content = content.replace(/if \(feedRes\.data\) \{[\s\S]*?if \(!memRes/g, 'if (!memRes');
// Actually, earlier script might have messed up the `feedRes` block. Let's just find and destroy `setFeedPosts` inside `fetchAllData`.
content = content.replace(/setFeedPosts\(feedRes\.data\.map\([\s\S]*?\}\)\)\);/g, '');

content = content.replace(/const subFeed[\s\S]*?\.subscribe\(\);\n/g, '');
content = content.replace(/supabase\.removeChannel\(subFeed\);\n/g, '');

content = content.replace(/const createFeedPost[\s\S]*?\}\n  };\n/g, '');
content = content.replace(/const likeFeedPost[\s\S]*?\}\n  };\n/g, '');

content = content.replace(/feedPosts,\n/g, '');
content = content.replace(/createFeedPost,\n/g, '');
content = content.replace(/likeFeedPost,\n/g, '');

content = content.replace(/feedRes, /g, '');
content = content.replace(/feedRes /g, '');
content = content.replace(/feedRes\]/g, ']');

fs.writeFileSync('src/context/AppContext.jsx', content, 'utf8');
