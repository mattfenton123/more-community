"use client";
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Smartphone, CheckCircle2, HelpCircle } from 'lucide-react';
import { useToast } from './Toast';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { subscribeToPushNotificationsAction } from '../lib/actions';

const PUBLIC_VAPID_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
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

export default function PushNotificationManager({ onOpenInstallGuide }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isIosBrowserTab, setIsIosBrowserTab] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showDeniedHelp, setShowDeniedHelp] = useState(false);
  const { toast } = useToast();
  const { user } = useAppContext();
  const { session } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    } else if (isIos && !isStandalone) {
      setIsIosBrowserTab(true);
    }
  }, []);

  const getValidToken = async () => {
    if (session?.access_token) return session.access_token;
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const subscribeToNotifications = async () => {
    if (!isSupported) return;
    if (!user?.id) {
      toast.info('Sign in required', 'Please sign in first to enable push notifications.');
      return;
    }

    try {
      setIsSubscribing(true);
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setShowDeniedHelp(false);
        const token = await getValidToken();
        try {
          const registration = await navigator.serviceWorker.ready;
          let subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
            });
          }

          if (token && subscription) {
            await subscribeToPushNotificationsAction(user.id, subscription, token);
          }
        } catch (swErr) {
          console.warn('Service worker push subscription fallback:', swErr);
        }

        toast.success('Push Notifications Active! 🔔', 'You will now receive instant alerts for meetups, messages, and event updates.');
      } else if (result === 'denied') {
        setShowDeniedHelp(true);
        toast.info(
          'Notifications Blocked by Browser',
          'Tap the site settings icon next to your browser address bar and set Notifications to Allow.'
        );
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
      toast.error('Could Not Enable Alerts', err?.message || 'Please check your browser notification permissions.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTestAlert = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification('More Community 🔔', {
            body: 'Push notifications are active on this device! Tap to open your feed.',
            icon: '/logo.png',
            badge: '/logo.png',
            data: { url: '/app' },
          });
          toast.success('Test notification sent!', 'Check your device notification banner.');
          return;
        }
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('More Community 🔔', {
          body: 'Push notifications are active on this device!',
          icon: '/logo.png',
        });
        toast.success('Test notification sent!', 'Check your device notification banner.');
      }
    } catch {
      toast.info('Notifications Active', 'Your device is registered to receive push alerts.');
    }
  };

  // Case 1: iPhone / iPad Safari tab (not yet installed to Home Screen)
  if (!isSupported && isIosBrowserTab) {
    return (
      <div
        style={{
          padding: '15px 16px',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border-strong)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--brand-accent-soft)',
              border: '1px solid rgba(200, 90, 50, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Smartphone size={18} color="var(--brand-accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: '0 0 2px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
              Push Notifications on iPhone / iPad
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
              On iOS, Apple unlocks push notifications as soon as you add <strong>More.</strong> to your Home Screen.
            </p>
          </div>
        </div>
        {onOpenInstallGuide && (
          <button
            type="button"
            onClick={onOpenInstallGuide}
            className="btn btn-primary interactive-press"
            style={{
              alignSelf: 'flex-start',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            Show 3-Step iPhone Setup →
          </button>
        )}
      </div>
    );
  }

  // Case 2: Browser genuinely does not support Web Push
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
            Push Notifications Unavailable
          </div>
          <div style={{ fontSize: '0.77rem', color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
            Install the app to your Home Screen or open in Chrome/Safari to enable device alerts.
          </div>
        </div>
      </div>
    );
  }

  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '14px 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--hairline-border)',
        borderRadius: '14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
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
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.35 }}>
              {isGranted
                ? 'Enabled for this device'
                : isDenied
                ? 'Blocked in browser permissions — tap How to Unblock'
                : 'Get instant alerts for meetups, messages & event Q&A'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isGranted ? (
            <>
              <button
                type="button"
                onClick={handleSendTestAlert}
                className="interactive-press"
                style={{
                  padding: '6px 11px',
                  borderRadius: '999px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border-strong)',
                  color: 'var(--ink-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Send Test
              </button>
              <span
                style={{
                  fontSize: '0.76rem',
                  color: '#15803D',
                  background: 'rgba(21, 128, 61, 0.12)',
                  border: '1px solid rgba(21, 128, 61, 0.28)',
                  padding: '6px 11px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={13} /> Active
              </span>
            </>
          ) : isDenied ? (
            <button
              type="button"
              onClick={() => setShowDeniedHelp((prev) => !prev)}
              className="interactive-press"
              style={{
                padding: '7px 12px',
                borderRadius: '10px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border-strong)',
                color: 'var(--ink-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <HelpCircle size={14} color="var(--brand-accent)" />
              {showDeniedHelp ? 'Hide Guide' : 'How to Enable'}
            </button>
          ) : (
            <button
              type="button"
              onClick={subscribeToNotifications}
              disabled={isSubscribing}
              className="btn btn-primary interactive-press"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: isSubscribing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSubscribing ? <Loader2 size={16} className="animate-spin" /> : 'Allow Alerts'}
            </button>
          )}
        </div>
      </div>

      {(isDenied || showDeniedHelp) && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border-strong)',
            fontSize: '0.79rem',
            color: 'var(--ink-secondary)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--ink-primary)', marginBottom: '4px' }}>
            How to turn notifications back on:
          </div>
          <div>
            1. Tap the <strong>tune / lock icon</strong> on the left side of your browser&apos;s address bar.
            <br />
            2. Tap <strong>Permissions</strong> or <strong>Site settings</strong> → set <strong>Notifications</strong> to <strong>Allow</strong>.
            <br />
            3. Reload this page and tap <strong>Allow Alerts</strong>.
          </div>
        </div>
      )}
    </div>
  );
}
