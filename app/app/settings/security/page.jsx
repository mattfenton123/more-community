"use client";
import { useState } from 'react';
import { ArrowLeft, Shield, Eye, MessageCircle, Download, Trash2, Check } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../../../src/context/AppContext';
import { useAuth } from '../../../src/context/AuthContext';
import { useToast } from '../../../src/components/Toast';
import AppHeader from '../../../src/components/AppHeader';

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAppContext();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const [visibility, setVisibility] = useState(user.privacy_visibility || 'public');
  const [dmLimit, setDmLimit] = useState(user.privacy_dms || 'everyone');
  const [isExporting, setIsExporting] = useState(false);

  const handleSavePrivacy = async (key, value) => {
    try {
      if (key === 'visibility') setVisibility(value);
      if (key === 'dmLimit') setDmLimit(value);
      
      await updateUser(user.id, { [`privacy_${key === 'dmLimit' ? 'dms' : key}`]: value });
      toast.success('Privacy updated');
    } catch (e) {
      toast.error('Failed to update privacy');
    }
  };

  const handleExportData = () => {
    setIsExporting(true);
    setTimeout(() => {
      // Create a mock blob and download it
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `more_data_${user.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      setIsExporting(false);
      toast.success('Data exported successfully');
    }, 1500);
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm("Are you sure you want to delete your account? This action is irreversible.");
    if (confirm) {
      toast.info('Account marked for deletion', 'An admin will process this request within 30 days.');
      // In a real app this would trigger a deletion flow
      signOut();
      navigate.push('/login');
    }
  };

  const ToggleOption = ({ selected, title, description, onClick }) => (
    <div onClick={onClick} className="interactive-hover" style={{ 
      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', 
      background: selected ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${selected ? 'var(--teal-500)' : 'rgba(255,255,255,0.05)'}`, 
      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
    }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${selected ? 'var(--teal-500)' : 'var(--slate-600)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', background: selected ? 'var(--teal-500)' : 'transparent' }}>
        {selected && <Check size={14} color="white" />}
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>{description}</div>
      </div>
    </div>
  );

  return (
    <div className="view-settings" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <AppHeader title="Privacy & Security" showBack={true} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Visibility */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Eye size={20} color="#3b82f6" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Profile Visibility</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ToggleOption 
              selected={visibility === 'public'} 
              onClick={() => handleSavePrivacy('visibility', 'public')}
              title="Public" 
              description="Anyone on more. can view your profile and see your interests." 
            />
            <ToggleOption 
              selected={visibility === 'members_only'} 
              onClick={() => handleSavePrivacy('visibility', 'members_only')}
              title="Members Only" 
              description="Only people in communities you have joined can view your full profile." 
            />
          </div>
        </section>

        {/* Direct Messages */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MessageCircle size={20} color="#a78bfa" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Direct Messages</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ToggleOption 
              selected={dmLimit === 'everyone'} 
              onClick={() => handleSavePrivacy('dmLimit', 'everyone')}
              title="Everyone" 
              description="Anyone on the platform can send you a direct message." 
            />
            <ToggleOption 
              selected={dmLimit === 'communities'} 
              onClick={() => handleSavePrivacy('dmLimit', 'communities')}
              title="Shared Communities Only" 
              description="Only people who share a community with you can message you." 
            />
          </div>
        </section>

        {/* Data & Account */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={20} color="#f59e0b" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Data & Account</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="btn btn-outline interactive-press" 
              style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}
            >
              <Download size={18} />
              {isExporting ? 'Preparing Data...' : 'Export My Data'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', margin: '0 0 12px 4px' }}>
              Download a copy of your personal data, including your profile and preferences.
            </p>

            <button 
              onClick={handleDeleteAccount}
              className="interactive-press" 
              style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 500 }}
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        </section>
        
      </div>
    </div>
  );
}
