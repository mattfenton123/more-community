import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { useAppContext } from '../context/AppContext';
import { subscribeToPushNotificationsAction } from '../lib/actions';

// Mock/Dev VAPID Public Key - in production, this should come from process.env
const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Base64 to Uint8Array conversion for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();
  const { user } = useAppContext();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const subscribeToNotifications = async () => {
    if (!isSupported || !user?.id) return;
    
    try {
      setIsSubscribing(true);
      
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Create new subscription
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
          });
        }
        
        // Send this subscription to the backend via server action
        await subscribeToPushNotificationsAction(user.id, subscription, localStorage.getItem('supabase.auth.token'));
        console.log('Push Subscription sent to backend.');
        
        toast.success('Notifications Enabled', 'You will now receive updates.');
      } else {
        toast.error('Permission Denied', 'Please enable notifications in your browser settings.');
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
      toast.error('Subscription Failed', 'Could not enable push notifications.');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isSupported) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
        <BellOff size={20} color="var(--slate-500)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Push notifications are not supported in this browser.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', background: permission === 'granted' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          <Bell size={20} color={permission === 'granted' ? '#22c55e' : 'var(--white)'} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: 'var(--white)' }}>Push Notifications</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--slate-400)' }}>
            {permission === 'granted' ? 'Enabled for this device.' : 'Get notified about event updates.'}
          </p>
        </div>
      </div>
      
      {permission !== 'granted' && (
        <button 
          onClick={subscribeToNotifications}
          disabled={isSubscribing}
          className="btn interactive-press"
          style={{ padding: '8px 16px', background: 'var(--white)', color: 'var(--slate-950)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isSubscribing ? <><Loader2 size={16} className="spin" /> Enabling</> : 'Enable'}
        </button>
      )}
    </div>
  );
}
