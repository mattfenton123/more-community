const fs = require('fs');
let content = fs.readFileSync('app/layout.jsx', 'utf8');

// Fix 1: Add loading spinner in MainLayout and fix auth checks
content = content.replace(
  "// Don't render content until auth checks are done\n  if (authLoading || (authUser && !user)) return null;",
  "// Don't render content until auth checks are done\n  if (authLoading || (authUser && !user)) return (\n    <div style={{ minHeight: '100vh', background: 'var(--slate-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>\n      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(20,184,166,0.2)', borderTopColor: 'var(--teal-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />\n      <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem' }}>Loading...</span>\n    </div>\n  );"
);

// Fix 2: Hide tab bar on login and onboarding
content = content.replace(
  "const isDashboard = currentPath?.startsWith('/dashboard') || currentPath?.startsWith('/council-dashboard') || currentPath?.startsWith('/admin');",
  "const isDashboard = currentPath?.startsWith('/dashboard') || currentPath?.startsWith('/council-dashboard') || currentPath?.startsWith('/admin');\n  const hideTabBar = isDashboard || currentPath === '/login' || currentPath === '/onboarding';"
);

// Change `{!isDashboard && <TabBar />}` to `{!hideTabBar && <TabBar />}`
content = content.replace(
  "{!isDashboard && <TabBar />}",
  "{!hideTabBar && <TabBar />}"
);

// Fix 3: Show both tabs
content = content.replace(
  "{!user?.leaderOf && (\n        <Link href=\"/profile\" className={`tab-item ${currentPath?.startsWith('/profile') ? 'active' : ''}`}>\n          <User size={22} />\n          <span className=\"tab-label\">Profile</span>\n        </Link>\n      )}",
  "<Link href=\"/profile\" className={`tab-item ${currentPath?.startsWith('/profile') ? 'active' : ''}`}>\n          <User size={22} />\n          <span className=\"tab-label\">Profile</span>\n        </Link>"
);

fs.writeFileSync('app/layout.jsx', content, 'utf8');
console.log('layout.jsx fixed');
