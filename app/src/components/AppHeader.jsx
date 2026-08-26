"use client";
import { useRouter as useNavigate } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function AppHeader({ title, subtitle, rightElement, showBack = false, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate.back();
  };

  return (
    <div className="app-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--slate-900)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack ? (
          <button 
            onClick={handleBack}
            className="interactive-press"
            style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }}
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <img 
            src={`/images/logo.webp`} 
            alt="more." 
            style={{ height: '24px', cursor: 'pointer' }} 
            onClick={() => navigate.back()} 
          />
        )}
        {title && (
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'white' }}>{title}</h1>
            {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 500 }}>{subtitle}</div>}
          </div>
        )}
      </div>
      {rightElement && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {rightElement}
        </div>
      )}
    </div>
  );
}
