// Fix all navigate.back() calls in app/ route files (the live Next.js routes)
// src/views/ are legacy and not served by Vercel
const fs = require('fs');
const path = require('path');

const fixes = {
  // Chat page: fix DM clicks, channel clicks, avatar clicks, back button
  'app/chat/[communityId]/[channelId]/page.jsx': (content) => {
    // Line 150: DM inbox item click -> navigate to DM
    content = content.replace(
      /onClick=\{?\(\) => navigate\.back\(\)\}?\s*\n\s*className="interactive-press"\s*\n\s*style=\{\{\s*display: 'flex'/,
      (match) => match.replace('navigate.back()', "navigate.push(`/chat/dm/${item.userId}`)")
    );
    // Generic: replace all navigate.back() with navigate.push('/chat')
    // But we need context-specific replacements
    // Let's do line-by-line
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('navigate.back()')) {
        // Avatar/author name clicks -> profile
        if (line.includes('authorObj.avatar') || line.includes("fontSize: '0.75rem'")) {
          lines[i] = line.replace('navigate.back()', "navigate.push(`/profile/${msg.authorId || msg.senderId}`)");
        }
        // Back button in header -> /chat
        else if (line.includes('onBack') || line.includes('ChevronLeft')) {
          lines[i] = line.replace('navigate.back()', "navigate.push('/chat')");
        }
        // DM user search result click
        else if (line.includes('userSearchTerm') || (i > 260 && i < 270)) {
          lines[i] = line.replace('navigate.back()', "navigate.push(`/chat/dm/${u.id}`)");
        }
        // Inbox channel items
        else {
          lines[i] = line.replace('navigate.back()', "navigate.push('/chat')");
        }
      }
    });
    return lines.join('\n');
  },

  // Community page: fix back buttons, leader clicks, event clicks, experience clicks
  'app/community/[id]/client-page.jsx': (content) => {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('navigate.back()')) {
        // Logo click -> home
        if (line.includes('logo') || line.includes('more.')) {
          lines[i] = line.replace('navigate.back()', "navigate.push('/')");
        }
        // "Explore more communities" button
        else if (line.includes('Explore') || line.includes('btn btn-outline')) {
          lines[i] = line.replace('navigate.back()', "navigate.push('/discover')");
        }
        // Back button
        else if (line.includes("'40px'") && line.includes('borderRadius') && line.includes("'50%'")) {
          lines[i] = line.replace('navigate.back()', "navigate.push('/')");
        }
        // Leader avatar/name click
        else if (line.includes('leaderUser')) {
          lines[i] = line.replace(/navigate\.back\(\)/, "navigate.push(`/profile/${leaderUser.id}`)");
        }
        // Event card click
        else if (line.includes('event.id')) {
          lines[i] = line.replace('navigate.back()', "navigate.push('/events')");
        }
        // Experience card click
        else if (line.includes('exp.id')) {
          lines[i] = line.replace('navigate.back()', "navigate.push('/experiences')");
        }
        // Settings/share icon buttons
        else {
          lines[i] = line.replace('navigate.back()', "navigate.push('/')");
        }
      }
    });
    return lines.join('\n');
  },

  // Discover page: remaining navigate.back
  'app/discover/page.jsx': (content) => {
    return content.replace(/navigate\.back\(\)/g, "navigate.push('/discover')");
  },

  // Experiences page
  'app/experiences/page.jsx': (content) => {
    return content.replace(/navigate\.back\(\)/g, "navigate.push('/')");
  },

  // Leaderboard page
  'app/leaderboard/page.jsx': (content) => {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('navigate.back()')) {
        if (line.includes('avatar') || line.includes('user.id') || line.includes('entry')) {
          lines[i] = line.replace(/navigate\.back\(\)/g, "navigate.push(`/profile/${entry.userId}`)");
        } else {
          lines[i] = line.replace('navigate.back()', "navigate.push('/')");
        }
      }
    });
    return lines.join('\n');
  },

  // Notifications page
  'app/notifications/page.jsx': (content) => {
    return content.replace(/navigate\.back\(\)/g, "navigate.push('/')");
  },

  // Settings page
  'app/settings/page.jsx': (content) => {
    return content.replace(/navigate\.back\(\)/g, "navigate.push('/profile')");
  },

  // Admin page
  'app/admin/page.jsx': (content) => {
    return content.replace(/navigate\.back\(\)/g, "navigate.push('/')");
  },

  // AppHeader component (used everywhere)
  'src/components/AppHeader.jsx': (content) => {
    // AppHeader's back button should use router.back() which is actually correct for a generic back
    // But let's use the browser's history back since it's a shared component
    return content.replace(/navigate\.back\(\)/g, "navigate.back()");
    // Actually AppHeader is fine with navigate.back() since it's a generic back button
  },

  // MemberDirectory
  'src/components/MemberDirectory.jsx': (content) => {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('navigate.back()')) {
        if (line.includes('Leaderboard') || line.includes('leaderboard')) {
          lines[i] = line.replace('navigate.back()', "navigate.push('/leaderboard')");
        } else {
          // Member row click -> profile
          lines[i] = line.replace('navigate.back()', "navigate.push(`/profile/${member.id}`)");
        }
      }
    });
    return lines.join('\n');
  },

  // MapView
  'src/components/MapView.jsx': (content) => {
    return content.replace(/navigate\.back\(\)/g, "navigate.push(`/community/${c.id}`)");
  },
};

let fixed = 0;
for (const [filePath, fixer] of Object.entries(fixes)) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping ${filePath} (not found)`);
    continue;
  }
  
  const original = fs.readFileSync(fullPath, 'utf8');
  const backCount = (original.match(/navigate\.back\(\)/g) || []).length;
  
  if (backCount === 0) {
    console.log(`✅ ${filePath}: No navigate.back() calls`);
    continue;
  }

  const result = fixer(original);
  const remaining = (result.match(/navigate\.back\(\)/g) || []).length;
  
  fs.writeFileSync(fullPath, result, 'utf8');
  console.log(`✅ ${filePath}: Fixed ${backCount - remaining}/${backCount} navigate.back() calls`);
  fixed += (backCount - remaining);
}

console.log(`\n🎉 Fixed ${fixed} navigate.back() calls total`);
