"use client";
import React, { useState } from 'react';
import { Zap, MessageCircle, Clock, Star, Bell, Check, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';

export default function AutomatedTriggers({ community }) {
  const { updateCommunity } = useAppContext();
  const { toast } = useToast();

  const [toggles, setToggles] = useState({
    autoWelcomeEnabled: community?.autoWelcomeEnabled ?? true,
    autoRemindersEnabled: community?.autoRemindersEnabled ?? true,
    autoFeedbackEnabled: community?.autoFeedbackEnabled ?? true,
  });

  const handleToggle = (key) => {
    const newValue = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: newValue }));
    
    // Persist to AppContext
    updateCommunity(community.id, { [key]: newValue });
    
    if (newValue) {
      toast.success('Automation Enabled', 'This autopilot trigger is now active.');
    } else {
      toast.info('Automation Disabled', 'This autopilot trigger is turned off.');
    }
  };

  const automations = [
    {
      key: 'autoWelcomeEnabled',
      title: 'Welcome Message',
      trigger: 'Member joins community',
      triggerIcon: Users,
      action: 'Send Welcome WhatsApp',
      actionIcon: MessageCircle,
      color: '#3b82f6',
    },
    {
      key: 'autoRemindersEnabled',
      title: 'Event Reminder',
      trigger: '24 hours before event',
      triggerIcon: Clock,
      action: 'Send reminder with meeting point details',
      actionIcon: Bell,
      color: '#22c55e',
    },
    {
      key: 'autoFeedbackEnabled',
      title: 'Post-Event Feedback',
      trigger: '2 hours after event ends',
      triggerIcon: Clock,
      action: "Send 'Thanks for coming!' and request a 5-star review",
      actionIcon: Star,
      color: '#f59e0b',
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
          <Zap size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--white)', margin: 0, fontFamily: 'var(--font-heading)' }}>Autopilot Triggers</h2>
          <p style={{ color: 'var(--slate-400)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Set-and-Forget automations to engage your members on autopilot.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {automations.map((auto) => {
          const isEnabled = toggles[auto.key];
          const TriggerIcon = auto.triggerIcon;
          const ActionIcon = auto.actionIcon;
          
          return (
            <div key={auto.key} style={{ 
              background: isEnabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', 
              border: `1px solid ${isEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}`, 
              borderRadius: '16px', 
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '20px',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isEnabled ? auto.color : 'var(--slate-600)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: isEnabled ? 'var(--white)' : 'var(--slate-400)' }}>{auto.title}</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                      <TriggerIcon size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', display: 'block', marginBottom: '2px' }}>Trigger</span>
                      <strong style={{ color: isEnabled ? 'var(--slate-300)' : 'var(--slate-500)', fontWeight: 500 }}>{auto.trigger}</strong>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', background: isEnabled ? `${auto.color}15` : 'rgba(255,255,255,0.05)', color: isEnabled ? auto.color : 'var(--slate-400)' }}>
                      <ActionIcon size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', display: 'block', marginBottom: '2px' }}>Action</span>
                      <strong style={{ color: isEnabled ? 'var(--white)' : 'var(--slate-500)', fontWeight: 500 }}>{auto.action}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button 
                onClick={() => handleToggle(auto.key)}
                style={{
                  width: '52px',
                  height: '28px',
                  borderRadius: '14px',
                  background: isEnabled ? auto.color : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: isEnabled ? '26px' : '2px',
                  transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isEnabled && <Check size={14} color={auto.color} />}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
