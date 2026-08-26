import fs from 'fs';
import path from 'path';

const SRC_DIR = './src/views';
const APP_DIR = './app';

if (!fs.existsSync(APP_DIR)) {
  fs.mkdirSync(APP_DIR, { recursive: true });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Convert react-router-dom to next/navigation
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, (match, imports) => {
    let nextImports = [];
    if (imports.includes('useNavigate')) nextImports.push('useRouter as useNavigate');
    if (imports.includes('useParams')) nextImports.push('useParams');
    if (nextImports.length > 0) {
      return `import { ${nextImports.join(', ')} } from 'next/navigation';`;
    }
    return '';
  });

  // Next.js components that use hooks must be client components
  if (content.includes('useState') || content.includes('useEffect') || content.includes('useContext') || content.includes('useAppContext') || content.includes('useNavigate') || content.includes('useParams') || content.includes('useGamification') || content.includes('useAuth') || content.includes('useToast')) {
    if (!content.startsWith('"use client";') && !content.startsWith("'use client';")) {
      content = '"use client";\n' + content;
    }
  }

  return content;
}

// 1. Create page.jsx for Discover (which is /discover, but we can make it /discover/page.jsx)
// We need to map routes.
const routes = {
  'HomeFeed.jsx': 'page.jsx', // Root
  'Discover.jsx': 'discover/page.jsx',
  'CommunityProfile.jsx': 'community/[id]/page.jsx',
  'UserProfile.jsx': 'profile/[id]/page.jsx',
  'EventDetail.jsx': 'events/page.jsx',
  'Chat.jsx': 'chat/[communityId]/[channelId]/page.jsx',
  'NotificationsFeed.jsx': 'notifications/page.jsx',
  'LeaderDashboard.jsx': 'dashboard/page.jsx',
  'AdminDashboard.jsx': 'admin/page.jsx',
  'SettingsScreen.jsx': 'settings/page.jsx',
  'Leaderboard.jsx': 'leaderboard/page.jsx',
  'ExperiencesMarketplace.jsx': 'experiences/page.jsx',
  'LoginScreen.jsx': 'login/page.jsx',
  'MyCommunities.jsx': 'my-communities/page.jsx'
};

for (const [file, routePath] of Object.entries(routes)) {
  const srcPath = path.join(SRC_DIR, file);
  if (fs.existsSync(srcPath)) {
    const destPath = path.join(APP_DIR, routePath);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const content = processFile(srcPath);
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`Migrated ${file} to ${routePath}`);
  }
}
