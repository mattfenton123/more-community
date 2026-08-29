const fs = require('fs');
let content = fs.readFileSync('app/layout.jsx', 'utf8');

// Fix 1: Show Profile tab for ALL users (remove the !user?.leaderOf guard)
// Replace the conditional Profile tab with an always-visible one
content = content.replace(
  `{!user?.leaderOf && (
        <Link href="/profile" className={\`tab-item \${currentPath?.startsWith('/profile') ? 'active' : ''}\`}>
          <User size={22} />
          <span className="tab-label">Profile</span>
        </Link>
      )}`,
  `<Link href="/profile" className={\`tab-item \${currentPath?.startsWith('/profile') ? 'active' : ''}\`}>
          <User size={22} />
          <span className="tab-label">Profile</span>
        </Link>`
);

// Fix 2: Add loading spinner instead of blank null return
content = content.replace(
  `if (authLoading || (authUser && !user)) return null;`,
  `if (authLoading || (authUser && !user)) return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(20,184,166,0.2)', borderTopColor: 'var(--teal-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem' }}>Loading...</span>
    </div>
  );`
);

fs.writeFileSync('app/layout.jsx', content, 'utf8');
console.log('✅ layout.jsx: Profile tab always visible + loading spinner');
