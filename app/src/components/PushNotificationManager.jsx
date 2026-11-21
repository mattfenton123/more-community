"use client";
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { useAppContext } from '../context/AppContext';
import { subscribeToPushNotificationsAction } from '../lib/actions';

const PUBLIC_VAPID_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

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
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
          });
        }

        await subscribeToPushNotificationsAction(
          user.id,
          subscription,
          localStorage.getItem('supabase.auth.token')
        );
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 16px',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border)',
          borderRadius: '14px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BellOff size={18} color="var(--ink-muted)" />
        </div>
        <span style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
          Push notifications are not supported in this browser.
        </span>
      </div>
    );
  }

  const isGranted = permission === 'granted';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--hairline-border)',
        borderRadius: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: isGranted ? 'rgba(21, 128, 61, 0.12)' : 'var(--surface-elevated)',
            border: isGranted
              ? '1px solid rgba(21, 128, 61, 0.28)'
              : '1px solid var(--hairline-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bell size={18} color={isGranted ? '#15803D' : 'var(--brand-accent)'} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h4 style={{ margin: '0 0 2px', fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
            Push Notifications
          </h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
            {isGranted ? 'Enabled for this device' : 'Get notified about new meetups and replies'}
          </p>
        </div>
      </div>

      {!isGranted ? (
        <button
          onClick={subscribeToNotifications}
          disabled={isSubscribing || !user?.id}
          className="btn btn-primary interactive-press"
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {isSubscribing ? (
            <>
              <Loader2 size={14} className="spin" /> Enabling
            </>
          ) : (
            'Enable'
          )}
        </button>
      ) : (
        <button
          onClick={() =>
            toast.info(
              'Manage Notifications',
              'Click the site settings icon in your browser address bar to change notification permissions.'
            )
          }
          className="interactive-press"
          style={{
            padding: '8px 14px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border-strong)',
            color: 'var(--ink-primary)',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Manage
        </button>
      )}
    </div>
  );
}
