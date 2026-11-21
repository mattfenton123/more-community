"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  Mic,
  MicOff,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Car,
  UserPlus,
  Shield,
  MessageCircle,
  Bell,
  Star,
  HelpCircle,
  Banknote,
  Repeat,
  Eye,
  Copy,
  AlertTriangle,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import RecurringSchedulePicker from './RecurringSchedulePicker';
import { cleanLocationName } from '../lib/location';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false });

function formatDateLocal(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

function getQuickDatePresets() {
  const now = new Date();
  const todayDay = now.getDay(); // 0=Sun..6=Sat

  const makeFuture = (days) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    return formatDateLocal(d);
  };

  const daysToSat = (6 - todayDay + 7) % 7 || 7;
  const daysToSun = (7 - todayDay) % 7 || 7;

  return [
    { label: 'Tomorrow', date: makeFuture(1) },
    { label: 'This Sat', date: makeFuture(daysToSat) },
    { label: 'This Sun', date: makeFuture(daysToSun) },
    { label: 'Next Sat', date: makeFuture(daysToSat + 7) },
    { label: 'Next Sun', date: makeFuture(daysToSun + 7) },
  ];
}

function parseTimeAndDuration(rawTime) {
  const str = String(rawTime || '').trim();
  if (!str) return { baseTime: '10:00', durationLabel: '' };
  const approxMatch = str.match(/^(\d{1,2}:\d{2})\s*\(([^)]+)\)$/);
  if (approxMatch) {
    return { baseTime: approxMatch[1].padStart(5, '0'), durationLabel: approxMatch[2].trim() };
  }
  const rangeMatch = str.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
  if (rangeMatch) {
    return { baseTime: rangeMatch[1].padStart(5, '0'), durationLabel: '' };
  }
  const simpleMatch = str.match(/^(\d{1,2}:\d{2})/);
  return {
    baseTime: simpleMatch ? simpleMatch[1].padStart(5, '0') : '10:00',
    durationLabel: '',
  };
}

function formatPrettyDate(dateStr) {
  if (!dateStr) return 'Pick a date';
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export default function EventStudioModal({
  isOpen,
  isEditing = false,
  editingEventId = null,
  community,
  communities = [],
  eventForm,
  setEventForm,
  imageFile,
  setImageFile,
  isUploading = false,
  stripeConnected = false,
  onOpenPayoutModal,
  onSubmit,
  onClose,
  onDuplicate,
  onCancelEvent,
  // AI helpers passed from dashboard
  aiPrompt = '',
  setAiPrompt,
  isGenerating = false,
  onAIGenerateEvent,
  aiIdeaChips = [],
  isExpandingDescription = false,
  onExpandDescription,
  speechSupported = false,
  isListening = false,
  onToggleSpeech,
  isDictatingDescription = false,
  onToggleDictateDescription,
}) {
  const [mounted, setMounted] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showIdeaChips, setShowIdeaChips] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [confirmCancelStep, setConfirmCancelStep] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Price & Capacity segmented modes
  const [isPaidMode, setIsPaidMode] = useState(false);
  const [isCappedMode, setIsCappedMode] = useState(false);

  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const whenSectionRef = useRef(null);
  const whereSectionRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll & Escape-to-close while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset local UI states cleanly whenever opening a new/different event
  useEffect(() => {
    if (!isOpen) return;
    const hasPrice = parseFloat(eventForm?.ticketPrice) > 0;
    const hasCap = Boolean(eventForm?.maxCapacity && Number(eventForm.maxCapacity) > 0);
    setIsPaidMode(hasPrice);
    setIsCappedMode(hasCap);
    setShowRecurring(!isEditing && (eventForm?.scheduleMode === 'recurring' || eventForm?.scheduleMode === 'custom' || (eventForm?.resolvedDates?.length || 0) > 1));
    setConfirmCancelStep(false);
    setShowMobilePreview(false);
    setShowIdeaChips(false);

    // Auto-open More Options when editing if the event already has advanced options configured
    const hasAdvanced = Boolean(
      eventForm?.requireApproval ||
        eventForm?.rsvpQuestion?.trim() ||
        eventForm?.whatsappGroup?.trim() ||
        (eventForm?.collabCommunityIds && eventForm.collabCommunityIds.length > 0)
    );
    setShowMoreOptions(Boolean(isEditing && hasAdvanced));
  }, [isOpen, isEditing, editingEventId]);

  // Keep paid/capped modes synced if AI fills price or capacity
  useEffect(() => {
    if (parseFloat(eventForm?.ticketPrice) > 0) setIsPaidMode(true);
  }, [eventForm?.ticketPrice]);

  useEffect(() => {
    if (eventForm?.maxCapacity && Number(eventForm.maxCapacity) > 0) setIsCappedMode(true);
  }, [eventForm?.maxCapacity]);

  // Safe local preview URL for newly uploaded cover photo
  const [localFilePreviewUrl, setLocalFilePreviewUrl] = useState(null);
  useEffect(() => {
    if (!imageFile) {
      setLocalFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setLocalFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const quickDates = useMemo(() => getQuickDatePresets(), []);
  const { baseTime, durationLabel } = useMemo(
    () => parseTimeAndDuration(eventForm?.time),
    [eventForm?.time]
  );

  const clubTown = cleanLocationName(community?.location_name) || 'your area';
  const resolvedDatesCount =
    eventForm?.resolvedDates && eventForm.resolvedDates.length > 0
      ? eventForm.resolvedDates.length
      : eventForm?.date
      ? 1
      : 0;

  const coverPreviewUrl =
    localFilePreviewUrl ||
    eventForm?.image ||
    community?.cover_image ||
    community?.image ||
    null;

  const isUsingDefaultClubCover = !localFilePreviewUrl && !eventForm?.image && Boolean(community?.cover_image || community?.image);

  // Readiness check & clickable missing field jump
  const missingItem = useMemo(() => {
    if (!eventForm?.title?.trim()) {
      return {
        label: 'Event Title',
        jump: () => {
          titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => titleInputRef.current?.focus(), 200);
        },
      };
    }
    if (resolvedDatesCount === 0 || !eventForm?.date) {
      return {
        label: 'Date',
        jump: () => whenSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      };
    }
    if (!eventForm?.time?.trim()) {
      return {
        label: 'Start Time',
        jump: () => whenSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      };
    }
    if (!eventForm?.location?.trim()) {
      return {
        label: 'Meeting Point',
        jump: () => whereSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      };
    }
    return null;
  }, [eventForm?.title, eventForm?.date, eventForm?.time, eventForm?.location, resolvedDatesCount]);

  const setSingleDate = (newDate) => {
    setEventForm((prev) => ({
      ...prev,
      date: newDate,
      time: prev.time || '10:00',
      scheduleMode: 'single',
      resolvedDates: newDate ? [newDate] : [],
      recurrenceSummary: 'Single event',
    }));
  };

  const setTimeWithDuration = (newBaseTime, newDuration) => {
    const cleanTime = newBaseTime || '10:00';
    const combined = newDuration ? `${cleanTime} (${newDuration})` : cleanTime;
    setEventForm((prev) => ({ ...prev, time: combined }));
  };

  const handleAppendSnippet = (snippet) => {
    setEventForm((prev) => {
      const current = (prev.description || '').trim();
      if (current.includes(snippet.split('\n')[0])) return prev;
      return {
        ...prev,
        description: current ? `${current}\n\n${snippet}` : snippet,
      };
    });
  };

  const partnerClubs = useMemo(
    () => (communities || []).filter((c) => c.id !== community?.id),
    [communities, community?.id]
  );

  const activeMoreOptionsSummary = useMemo(() => {
    const parts = [];
    if (eventForm?.requireApproval) parts.push('Host approval');
    if (eventForm?.rsvpQuestion?.trim()) parts.push('RSVP question');
    if ((eventForm?.collabCommunityIds?.length || 0) > 0) {
      parts.push(`${eventForm.collabCommunityIds.length} co-host${eventForm.collabCommunityIds.length === 1 ? '' : 's'}`);
    }
    if (eventForm?.autoReminders !== false) parts.push('24h reminder');
    return parts.length > 0 ? parts.join(' • ') : 'Reminders, approval & co-hosting';
  }, [eventForm]);

  if (!mounted || !isOpen) return null;

  const fieldStyle = {
    width: '100%',
    padding: '11px 13px',
    borderRadius: '11px',
    background: 'var(--surface-card)',
    border: '1px solid var(--hairline-border-strong)',
    color: 'var(--ink-primary)',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionCardStyle = {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--hairline-border)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '13px',
  };

  const renderLivePreviewCard = () => {
    const priceNum = parseFloat(eventForm?.ticketPrice) || 0;
    const dateObj = eventForm?.date ? new Date(`${eventForm.date}T00:00:00`) : null;
    const validDate = dateObj && !Number.isNaN(dateObj.getTime());
    const dayNum = validDate ? dateObj.getDate() : '—';
    const monthStr = validDate ? dateObj.toLocaleDateString('en-GB', { month: 'short' }) : 'DATE';
    const cleanLoc = cleanLocationName(eventForm?.location) || 'Meeting point TBC';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            borderRadius: '18px',
            overflow: 'hidden',
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline-border-strong)',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.14)',
          }}
        >
          {/* Preview Hero */}
          <div
            style={{
              position: 'relative',
              height: '132px',
              background: coverPreviewUrl
                ? `url("${coverPreviewUrl}") center/cover no-repeat`
                : 'linear-gradient(135deg, rgba(235, 87, 56, 0.25), rgba(139, 92, 246, 0.22))',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
              }}
            />
            {/* Date Badge */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                minWidth: '46px',
                padding: '5px 8px',
                borderRadius: '11px',
                background: 'rgba(15, 23, 42, 0.84)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#F79984', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {monthStr}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1 }}>{dayNum}</div>
            </div>

            {/* Price Pill */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '4px 10px',
                borderRadius: '99px',
                background: priceNum > 0 ? 'rgba(15, 23, 42, 0.84)' : 'rgba(16, 185, 129, 0.92)',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              {priceNum > 0 ? `£${priceNum.toFixed(priceNum % 1 === 0 ? 0 : 2)}` : 'Free'}
            </div>

            {resolvedDatesCount > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  padding: '3px 9px',
                  borderRadius: '99px',
                  background: 'rgba(235, 87, 56, 0.92)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                }}
              >
                🔁 {resolvedDatesCount} Sessions
              </div>
            )}
          </div>

          {/* Preview Body */}
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {community?.name || 'Your Community'}
              {(eventForm?.collabCommunityIds?.length || 0) > 0 && ` + ${eventForm.collabCommunityIds.length} co-host`}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.02rem',
                fontWeight: 800,
                color: eventForm?.title?.trim() ? 'var(--ink-primary)' : 'var(--ink-muted)',
                lineHeight: 1.25,
              }}
            >
              {eventForm?.title?.trim() || 'Your Event Title'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
                <span>
                  {formatPrettyDate(eventForm?.date)}
                  {eventForm?.time ? ` • ${eventForm.time}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="#3b82f6" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cleanLoc}
                </span>
              </div>
            </div>

            {/* Active Feature Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', paddingTop: '4px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '99px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--ink-secondary)',
                }}
              >
                {isCappedMode && eventForm?.maxCapacity ? `👥 ${eventForm.maxCapacity} spots` : '∞ Open spots'}
              </span>
              {eventForm?.allowCarpool !== false && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '99px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                  }}
                >
                  🚗 Carpool
                </span>
              )}
              {eventForm?.allowGuests !== false && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '99px',
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                  }}
                >
                  +1 Guests
                </span>
              )}
              {eventForm?.requireApproval && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '99px',
                    background: 'rgba(245, 158, 11, 0.14)',
                    color: '#d97706',
                  }}
                >
                  🛡️ Approval
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Readiness Checklist */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '7px',
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Publish Checklist
          </div>
          {[
            { label: 'Event title', done: Boolean(eventForm?.title?.trim()) },
            { label: 'Date & start time', done: Boolean(resolvedDatesCount > 0 && eventForm?.time?.trim()) },
            { label: 'Meeting point', done: Boolean(eventForm?.location?.trim()) },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 600, color: item.done ? 'var(--ink-primary)' : 'var(--ink-muted)' }}>
              <CheckCircle2 size={14} color={item.done ? '#10b981' : 'var(--hairline-border-strong)'} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const modalContent = (
    <div
      className="event-studio-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147482000,
        background: 'rgba(10, 12, 18, 0.76)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes eventStudioPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.45; transform: scale(0.85); }
            }
            .event-studio-shell {
              width: 100%;
              height: 100dvh;
              max-width: 100%;
              border-radius: 0;
              border: none;
            }
            .event-studio-header {
              padding: max(12px, env(safe-area-inset-top)) 14px 12px 14px;
            }
            .event-studio-body {
              display: grid;
              grid-template-columns: minmax(0, 1fr);
              flex: 1;
              min-height: 0;
              overflow: hidden;
            }
            .event-studio-preview-col {
              display: none;
            }
            .event-studio-mobile-preview-btn {
              display: inline-flex;
            }
            .event-studio-footer {
              padding: 12px 14px max(14px, env(safe-area-inset-bottom)) 14px;
            }
            .event-studio-two-col {
              display: grid;
              grid-template-columns: minmax(0, 1fr);
              gap: 10px;
            }
            @media (min-width: 520px) {
              .event-studio-two-col {
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
              }
            }
            @media (min-width: 920px) {
              .event-studio-backdrop {
                padding: 20px;
              }
              .event-studio-shell {
                max-width: 1080px !important;
                height: min(92dvh, 860px) !important;
                border-radius: 24px !important;
                border: 1px solid var(--hairline-border-strong) !important;
              }
              .event-studio-header {
                padding: 15px 22px !important;
              }
              .event-studio-body {
                grid-template-columns: minmax(0, 1.45fr) minmax(290px, 0.78fr);
              }
              .event-studio-preview-col {
                display: flex !important;
                flex-direction: column;
                border-left: 1px solid var(--hairline-border);
                background: var(--surface-canvas);
                padding: 18px;
                overflow-y: auto;
              }
              .event-studio-mobile-preview-btn {
                display: none !important;
              }
              .event-studio-footer {
                padding: 14px 22px !important;
              }
            }
          `,
        }}
      />

      <div
        className="event-studio-shell"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* TOP HEADER */}
        <div
          className="event-studio-header"
          style={{
            borderBottom: '1px solid var(--hairline-border)',
            background: 'var(--surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: isEditing
                  ? 'rgba(59, 130, 246, 0.14)'
                  : 'linear-gradient(135deg, #EB5738, #c73e21)',
                color: isEditing ? '#3b82f6' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Calendar size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.08rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    color: 'var(--ink-primary)',
                  }}
                >
                  {isEditing
                    ? 'Edit Event'
                    : resolvedDatesCount > 1
                    ? `New Schedule (${resolvedDatesCount} Events)`
                    : 'New Event'}
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border)',
                    color: 'var(--ink-muted)',
                    maxWidth: '170px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {community?.name || 'Community'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '1px' }}>
                {isEditing
                  ? 'Edit any detail below and tap Save Changes anytime'
                  : 'Fill the essentials below — publish in seconds'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowMobilePreview((v) => !v)}
              className="event-studio-mobile-preview-btn interactive-press"
              style={{
                alignItems: 'center',
                gap: '5px',
                padding: '6px 11px',
                borderRadius: '99px',
                background: showMobilePreview ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                border: showMobilePreview
                  ? '1px solid var(--brand-accent)'
                  : '1px solid var(--hairline-border-strong)',
                color: showMobilePreview ? 'var(--brand-accent)' : 'var(--ink-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Eye size={14} /> Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Event Studio"
              className="interactive-press"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border-strong)',
                color: 'var(--ink-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* BODY: MAIN SCROLL CANVAS + LIVE PREVIEW SIDEBAR */}
        <div className="event-studio-body">
          {/* LEFT / MAIN FORM COLUMN */}
          <div
            style={{
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Mobile Collapsible Live Preview */}
            {showMobilePreview && (
              <div style={{ paddingBottom: '4px' }}>
                {renderLivePreviewCard()}
              </div>
            )}

            {/* 1. COMPACT AI QUICK-FILL BAR (CREATE MODE ONLY) */}
            {!isEditing && typeof onAIGenerateEvent === 'function' && (
              <div
                style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.28)',
                  borderRadius: '15px',
                  padding: '11px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#8b5cf6" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    value={aiPrompt}
                    onFocus={() => setShowIdeaChips(true)}
                    onChange={(e) => setAiPrompt?.(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && aiPrompt.trim() && !isGenerating) {
                        e.preventDefault();
                        onAIGenerateEvent();
                      }
                    }}
                    placeholder={
                      isListening
                        ? 'Listening... speak your event idea...'
                        : 'Optional: speak or describe your idea & AI fills the form...'
                    }
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: 'var(--surface-card)',
                      border: isListening
                        ? '1.5px solid #ef4444'
                        : '1px solid var(--hairline-border-strong)',
                      borderRadius: '10px',
                      padding: '8px 11px',
                      color: 'var(--ink-primary)',
                      fontSize: '0.84rem',
                      outline: 'none',
                    }}
                  />
                  {speechSupported && typeof onToggleSpeech === 'function' && (
                    <button
                      type="button"
                      onClick={onToggleSpeech}
                      title={isListening ? 'Stop voice input' : 'Speak your event idea'}
                      className="interactive-press"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        border: isListening
                          ? '1.5px solid #ef4444'
                          : '1px solid rgba(139, 92, 246, 0.35)',
                        background: isListening ? 'rgba(239, 68, 68, 0.16)' : 'var(--surface-card)',
                        color: isListening ? '#ef4444' : '#8b5cf6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        animation: isListening ? 'eventStudioPulse 1.2s infinite' : 'none',
                      }}
                    >
                      {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isGenerating || !aiPrompt.trim()}
                    onClick={() => onAIGenerateEvent()}
                    className="interactive-press"
                    style={{
                      padding: '8px 13px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: isGenerating || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                      opacity: isGenerating || !aiPrompt.trim() ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {isGenerating ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                    Fill
                  </button>
                </div>

                {/* Compact collapsible Idea Starters */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowIdeaChips((v) => !v)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      color: '#8b5cf6',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <Lightbulb size={12} />
                    {showIdeaChips ? 'Hide quick ideas' : 'Need inspiration? 1-tap ideas'}
                    {showIdeaChips ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {isListening && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>
                      🎙️ Listening — tap Mic when done
                    </span>
                  )}
                </div>

                {showIdeaChips && Array.isArray(aiIdeaChips) && aiIdeaChips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {aiIdeaChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => onAIGenerateEvent(chip.prompt)}
                        className="interactive-press"
                        style={{
                          padding: '5px 10px',
                          borderRadius: '99px',
                          background: 'var(--surface-card)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: 'var(--ink-primary)',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{chip.emoji}</span>
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. COVER PHOTO BANNER */}
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              style={{
                position: 'relative',
                height: '138px',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid var(--hairline-border-strong)',
                background: coverPreviewUrl
                  ? `url("${coverPreviewUrl}") center/cover no-repeat`
                  : 'linear-gradient(135deg, rgba(235, 87, 56, 0.16), rgba(59, 130, 246, 0.14))',
                flexShrink: 0,
              }}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setImageFile(f);
                }}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: coverPreviewUrl
                    ? 'linear-gradient(180deg, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.62) 100%)'
                    : 'none',
                  display: 'flex',
                  alignItems: coverPreviewUrl ? 'flex-end' : 'center',
                  justifyContent: coverPreviewUrl ? 'space-between' : 'center',
                  padding: '12px 14px',
                  gap: '10px',
                }}
              >
                {coverPreviewUrl ? (
                  <>
                    <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                      {imageFile
                        ? `New cover: ${imageFile.name}`
                        : isUsingDefaultClubCover
                        ? 'Using club cover photo'
                        : 'Current event cover'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {imageFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '99px',
                            background: 'rgba(15, 23, 42, 0.78)',
                            border: '1px solid rgba(255,255,255,0.22)',
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Reset
                        </button>
                      )}
                      <span
                        style={{
                          padding: '5px 11px',
                          borderRadius: '99px',
                          background: 'rgba(15, 23, 42, 0.82)',
                          border: '1px solid rgba(255,255,255,0.24)',
                          color: '#ffffff',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <ImageIcon size={13} /> Change Cover
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--ink-secondary)' }}>
                    <ImageIcon size={24} style={{ marginBottom: '4px', opacity: 0.8 }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                      Add Event Cover Photo (Optional)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                      Tap to upload a crisp photo from your device
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. CORE ESSENTIALS: TITLE, WHEN, WHERE, DESCRIPTION */}
            <div style={sectionCardStyle}>
              {/* Event Title */}
              <div>
                <label
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--ink-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Event Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={eventForm?.title || ''}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Saturday Morning Park Walk & Coffee"
                  style={{
                    ...fieldStyle,
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    padding: '13px 14px',
                  }}
                />
              </div>

              {/* When: Date, Time & Optional Repeat */}
              <div ref={whenSectionRef} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--ink-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Clock size={13} color="var(--brand-accent)" /> When <span style={{ color: '#ef4444' }}>*</span>
                  </label>

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = !showRecurring;
                        setShowRecurring(next);
                        if (!next) {
                          setEventForm((prev) => ({
                            ...prev,
                            scheduleMode: 'single',
                            resolvedDates: prev.date ? [prev.date] : [],
                            recurrenceSummary: 'Single event',
                          }));
                        }
                      }}
                      className="interactive-press"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '99px',
                        border: showRecurring
                          ? '1.5px solid var(--brand-accent)'
                          : '1px solid var(--hairline-border-strong)',
                        background: showRecurring ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                        color: showRecurring ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      <Repeat size={12} />
                      {showRecurring ? 'Using Repeat / Multi-Date' : 'Repeat / Multiple Dates'}
                    </button>
                  )}
                </div>

                {showRecurring && !isEditing ? (
                  <div
                    style={{
                      background: 'var(--surface-card)',
                      borderRadius: '12px',
                      padding: '12px',
                      border: '1px solid var(--hairline-border-strong)',
                    }}
                  >
                    <RecurringSchedulePicker
                      key={`rec-${eventForm?.date || 'init'}`}
                      initialDate={eventForm?.date}
                      initialTime={eventForm?.time}
                      isEditing={false}
                      onChange={(scheduleData) => {
                        setEventForm((prev) => ({
                          ...prev,
                          date: scheduleData.date,
                          time: scheduleData.time,
                          scheduleMode: scheduleData.scheduleMode,
                          resolvedDates: scheduleData.resolvedDates,
                          recurrenceSummary: scheduleData.recurrenceSummary,
                        }));
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="event-studio-two-col">
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '4px' }}>
                          Date
                        </label>
                        <input
                          type="date"
                          value={eventForm?.date || ''}
                          onChange={(e) => setSingleDate(e.target.value)}
                          style={fieldStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '4px' }}>
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={baseTime}
                          onChange={(e) => setTimeWithDuration(e.target.value, durationLabel)}
                          style={fieldStyle}
                        />
                      </div>
                    </div>

                    {/* Quick Date Pills + Optional Duration Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      {quickDates.map((preset) => {
                        const active = eventForm?.date === preset.date;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setSingleDate(preset.date)}
                            className="interactive-press"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '99px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: active ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                              border: active
                                ? '1px solid var(--brand-accent)'
                                : '1px solid var(--hairline-border)',
                              color: active ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                      <span style={{ color: 'var(--hairline-border-strong)', margin: '0 2px' }}>|</span>
                      {['~1 hr', '~1.5 hrs', '~2 hrs'].map((dur) => {
                        const active = durationLabel === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setTimeWithDuration(baseTime, active ? '' : dur)}
                            className="interactive-press"
                            style={{
                              padding: '5px 9px',
                              borderRadius: '99px',
                              fontSize: '0.71rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: active ? 'rgba(59, 130, 246, 0.14)' : 'var(--surface-card)',
                              border: active ? '1px solid #3b82f6' : '1px solid var(--hairline-border)',
                              color: active ? '#3b82f6' : 'var(--ink-muted)',
                            }}
                          >
                            {dur}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Where: Meeting Point */}
              <div ref={whereSectionRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--ink-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <MapPin size={13} color="#3b82f6" /> Meeting Point <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {community?.location_name && !eventForm?.location?.trim() && (
                    <button
                      type="button"
                      onClick={() =>
                        setEventForm((prev) => ({
                          ...prev,
                          location: community.location_name,
                          coords:
                            community?.lat != null && community?.lng != null
                              ? [Number(community.lat), Number(community.lng)]
                              : prev.coords,
                        }))
                      }
                      style={{
                        padding: '3px 9px',
                        borderRadius: '99px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#3b82f6',
                        fontSize: '0.71rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Use Club Hub ({clubTown})
                    </button>
                  )}
                </div>
                <LocationPicker
                  key={editingEventId || 'studio-create-loc'}
                  locationName={eventForm?.location || ''}
                  setLocationName={(loc) => setEventForm((prev) => ({ ...prev, location: loc }))}
                  coords={eventForm?.coords || null}
                  onCoordsChange={(coords) => setEventForm((prev) => ({ ...prev, coords }))}
                />
              </div>

              {/* Description / What to Expect */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--ink-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Description &amp; What to Expect
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {speechSupported && typeof onToggleDictateDescription === 'function' && (
                      <button
                        type="button"
                        onClick={onToggleDictateDescription}
                        className="interactive-press"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '99px',
                          border: isDictatingDescription
                            ? '1px solid #ef4444'
                            : '1px solid var(--hairline-border-strong)',
                          background: isDictatingDescription ? 'rgba(239, 68, 68, 0.16)' : 'var(--surface-card)',
                          color: isDictatingDescription ? '#ef4444' : 'var(--ink-primary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        {isDictatingDescription ? <MicOff size={12} /> : <Mic size={12} />}
                        {isDictatingDescription ? 'Stop' : 'Dictate'}
                      </button>
                    )}
                    {typeof onExpandDescription === 'function' && (
                      <button
                        type="button"
                        disabled={isExpandingDescription || !(eventForm?.description || '').trim()}
                        onClick={onExpandDescription}
                        className="interactive-press"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '99px',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          background: 'rgba(139, 92, 246, 0.14)',
                          color: '#8b5cf6',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: isExpandingDescription || !(eventForm?.description || '').trim() ? 'not-allowed' : 'pointer',
                          opacity: !(eventForm?.description || '').trim() && !isExpandingDescription ? 0.5 : 1,
                        }}
                      >
                        {isExpandingDescription ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
                        {isExpandingDescription ? 'Polishing...' : 'Polish with AI'}
                      </button>
                    )}
                  </div>
                </div>

                {isDictatingDescription && (
                  <div
                    style={{
                      padding: '7px 11px',
                      borderRadius: '9px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>🎙️ Recording notes... speak freely (tap Stop when finished)</span>
                  </div>
                )}

                <textarea
                  rows={4}
                  value={eventForm?.description || ''}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Share the meeting point, pace/vibe, what to bring, and any post-event coffee stop..."
                  style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5, minHeight: '96px' }}
                />

                {/* 1-Tap Copy Helpers */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    {
                      label: '☕ Coffee Stop',
                      text: '☕ Post-Event Coffee:\nWe will wrap up at a local café for warm drinks and relaxed conversation — everyone welcome!',
                    },
                    {
                      label: '🐾 Dog Friendly',
                      text: '🐾 Dog Friendly:\nFriendly dogs on leads are very welcome! Please bring waste bags and water.',
                    },
                    {
                      label: '🎒 What to Bring',
                      text: '🎒 What to Bring:\n• Comfortable clothes & shoes\n• Water bottle\n• Weather-appropriate layer',
                    },
                    {
                      label: '♿ Step-Free / Gentle',
                      text: '🥾 Accessibility & Pace:\nRelaxed, beginner-friendly pace on mostly flat paths — zero pressure to rush.',
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleAppendSnippet(item.text)}
                      className="interactive-press"
                      style={{
                        padding: '4px 9px',
                        borderRadius: '99px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border)',
                        color: 'var(--ink-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. PRICING, SPOTS & COMMUNITY PERKS (ALWAYS VISIBLE FOR FREE & PAID) */}
            <div style={sectionCardStyle}>
              <div className="event-studio-two-col">
                {/* Ticket Price */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Ticket Price
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaidMode(false);
                        setEventForm((prev) => ({ ...prev, ticketPrice: '', allowCash: false }));
                      }}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: !isPaidMode ? '1.5px solid #10b981' : '1px solid var(--hairline-border-strong)',
                        background: !isPaidMode ? 'rgba(16, 185, 129, 0.14)' : 'var(--surface-card)',
                        color: !isPaidMode ? '#10b981' : 'var(--ink-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      🎟️ Free
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaidMode(true);
                        if (!eventForm?.ticketPrice || parseFloat(eventForm.ticketPrice) <= 0) {
                          setEventForm((prev) => ({ ...prev, ticketPrice: '5' }));
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: isPaidMode ? '1.5px solid var(--brand-accent)' : '1px solid var(--hairline-border-strong)',
                        background: isPaidMode ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                        color: isPaidMode ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      💷 Paid
                    </button>
                  </div>
                  {isPaidMode && (
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--ink-muted)' }}>
                        £
                      </span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={eventForm?.ticketPrice || ''}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, ticketPrice: e.target.value }))}
                        placeholder="5.00"
                        style={{ ...fieldStyle, paddingLeft: '26px', fontWeight: 700 }}
                      />
                    </div>
                  )}
                </div>

                {/* Capacity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Max Capacity
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCappedMode(false);
                        setEventForm((prev) => ({ ...prev, maxCapacity: '' }));
                      }}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: !isCappedMode ? '1.5px solid #3b82f6' : '1px solid var(--hairline-border-strong)',
                        background: !isCappedMode ? 'rgba(59, 130, 246, 0.14)' : 'var(--surface-card)',
                        color: !isCappedMode ? '#3b82f6' : 'var(--ink-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      ∞ Unlimited
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCappedMode(true);
                        if (!eventForm?.maxCapacity) {
                          setEventForm((prev) => ({ ...prev, maxCapacity: '20' }));
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: isCappedMode ? '1.5px solid #3b82f6' : '1px solid var(--hairline-border-strong)',
                        background: isCappedMode ? 'rgba(59, 130, 246, 0.14)' : 'var(--surface-card)',
                        color: isCappedMode ? '#3b82f6' : 'var(--ink-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      👥 Limit Spots
                    </button>
                  </div>
                  {isCappedMode && (
                    <input
                      type="number"
                      min="1"
                      value={eventForm?.maxCapacity || ''}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, maxCapacity: e.target.value }))}
                      placeholder="e.g. 20"
                      style={{ ...fieldStyle, fontWeight: 700 }}
                    />
                  )}
                </div>
              </div>

              {/* Paid-event Cash & Payout Controls */}
              {isPaidMode && parseFloat(eventForm?.ticketPrice) > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '2px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '11px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(eventForm?.allowCash)}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, allowCash: e.target.checked }))}
                      style={{ width: '17px', height: '17px', accentColor: 'var(--brand-accent)' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Banknote size={15} color="#f59e0b" /> Allow Pay in Cash at Venue (£{eventForm.ticketPrice})
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
                        Members reserve their spot online and pay cash in person.
                      </div>
                    </div>
                  </label>

                  <div
                    style={{
                      padding: '11px 13px',
                      borderRadius: '11px',
                      background: stripeConnected
                        ? 'rgba(16, 185, 129, 0.1)'
                        : eventForm?.allowCash
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                      border: stripeConnected
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : eventForm?.allowCash
                        ? '1px solid rgba(245, 158, 11, 0.3)'
                        : '1px solid rgba(239, 68, 68, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-primary)', lineHeight: 1.4, flex: 1, minWidth: '180px' }}>
                      {stripeConnected ? (
                        <>
                          <strong>✓ Payout Account Active:</strong> Online ticket revenue transfers directly to your UK bank.
                        </>
                      ) : eventForm?.allowCash ? (
                        <>
                          <strong>Cash on Arrival Ready:</strong> You can also connect a payout bank to accept cards online.
                        </>
                      ) : (
                        <>
                          <strong>Payout Account or Cash Required:</strong> Connect your UK bank or enable Cash on Arrival to publish paid tickets.
                        </>
                      )}
                    </div>
                    {!stripeConnected && typeof onOpenPayoutModal === 'function' && (
                      <button
                        type="button"
                        onClick={onOpenPayoutModal}
                        className="btn btn-primary interactive-press"
                        style={{ padding: '7px 12px', borderRadius: '9px', fontSize: '0.75rem', fontWeight: 800 }}
                      >
                        <CreditCard size={13} /> Connect Bank
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Community Perks: ALWAYS visible for both Free & Paid events */}
              <div className="event-studio-two-col" style={{ paddingTop: '2px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    background: 'var(--surface-card)',
                    border:
                      eventForm?.allowCarpool !== false
                        ? '1px solid rgba(16, 185, 129, 0.38)'
                        : '1px solid var(--hairline-border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <Car size={17} color={eventForm?.allowCarpool !== false ? '#10b981' : 'var(--ink-muted)'} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                        Carpool Hub
                      </div>
                      <div style={{ fontSize: '0.71rem', color: 'var(--ink-muted)' }}>
                        Members share lifts
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventForm?.allowCarpool !== false}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, allowCarpool: e.target.checked }))}
                    style={{ width: '17px', height: '17px', accentColor: '#10b981' }}
                  />
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    background: 'var(--surface-card)',
                    border:
                      eventForm?.allowGuests !== false
                        ? '1px solid rgba(59, 130, 246, 0.38)'
                        : '1px solid var(--hairline-border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <UserPlus size={17} color={eventForm?.allowGuests !== false ? '#3b82f6' : 'var(--ink-muted)'} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                        Allow +1 Guests
                      </div>
                      <div style={{ fontSize: '0.71rem', color: 'var(--ink-muted)' }}>
                        Bring a friend
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventForm?.allowGuests !== false}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, allowGuests: e.target.checked }))}
                    style={{ width: '17px', height: '17px', accentColor: '#3b82f6' }}
                  />
                </label>
              </div>
            </div>

            {/* 5. COLLAPSIBLE MORE OPTIONS DRAWER */}
            <div
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setShowMoreOptions((v) => !v)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--ink-primary)' }}>
                    More Options
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--ink-muted)', marginTop: '1px' }}>
                    {activeMoreOptionsSummary}
                  </div>
                </div>
                <div style={{ color: 'var(--ink-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {showMoreOptions ? 'Hide' : 'Customise'}
                  {showMoreOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {showMoreOptions && (
                <div
                  style={{
                    padding: '14px 16px 16px',
                    borderTop: '1px solid var(--hairline-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Host Approval */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 13px',
                      borderRadius: '12px',
                      background: 'var(--surface-card)',
                      border: eventForm?.requireApproval
                        ? '1px solid rgba(245, 158, 11, 0.45)'
                        : '1px solid var(--hairline-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Shield size={18} color={eventForm?.requireApproval ? '#f59e0b' : 'var(--ink-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                          Require Host Approval
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
                          Approve each RSVP before sharing the exact meeting pin &amp; coordinates
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(eventForm?.requireApproval)}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, requireApproval: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
                    />
                  </label>

                  {/* Custom RSVP Question */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <HelpCircle size={14} color="var(--brand-accent)" /> Custom RSVP Question (Optional)
                    </label>
                    <input
                      type="text"
                      value={eventForm?.rsvpQuestion || ''}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, rsvpQuestion: e.target.value }))}
                      placeholder="e.g. Bringing a dog? Any dietary requirements?"
                      style={fieldStyle}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {[
                        'Are you bringing a dog?',
                        'Any dietary requirements?',
                        'First time joining our club?',
                        'Preferred pace or distance?',
                      ].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setEventForm((prev) => ({ ...prev, rsvpQuestion: q }))}
                          style={{
                            padding: '4px 9px',
                            borderRadius: '99px',
                            background: 'var(--surface-card)',
                            border: '1px solid var(--hairline-border)',
                            color: 'var(--ink-secondary)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          + {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Co-Host with Partner Communities */}
                  {partnerClubs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={14} color="var(--brand-accent)" /> Co-Host &amp; Cross-Promote with Partner Clubs
                      </label>
                      <div style={{ fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
                        Select nearby clubs in {clubTown} to co-host and share this event with their members.
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                        {partnerClubs.map((partner) => {
                          const selected = (eventForm?.collabCommunityIds || []).includes(partner.id);
                          return (
                            <button
                              key={partner.id}
                              type="button"
                              onClick={() => {
                                const current = eventForm?.collabCommunityIds || [];
                                const updated = selected
                                  ? current.filter((id) => id !== partner.id)
                                  : [...current, partner.id];
                                setEventForm((prev) => ({ ...prev, collabCommunityIds: updated }));
                              }}
                              className="interactive-press"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 11px',
                                borderRadius: '99px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: selected ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                                border: selected
                                  ? '1px solid var(--brand-accent)'
                                  : '1px solid var(--hairline-border-strong)',
                                color: selected ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                              }}
                            >
                              <span>{partner.name}</span>
                              {selected && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Event-Specific WhatsApp Link */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MessageCircle size={14} color="#25D366" /> Event WhatsApp Chat Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={eventForm?.whatsappGroup || ''}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, whatsappGroup: e.target.value }))}
                      placeholder="https://chat.whatsapp.com/..."
                      style={fieldStyle}
                    />
                    {community?.whatsapp_group && !eventForm?.whatsappGroup && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                        Defaults to your club WhatsApp group automatically.
                      </div>
                    )}
                  </div>

                  {/* Automated Reminders & Feedback */}
                  <div className="event-studio-two-col">
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '11px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={15} color="#3b82f6" />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                            24h Reminder
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                            Nudge attendees 1 day before
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={eventForm?.autoReminders !== false}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, autoReminders: e.target.checked }))}
                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                      />
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '11px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={15} color="#f59e0b" />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                            Feedback Prompt
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                            Ask for a quick review after
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={eventForm?.autoFeedback !== false}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, autoFeedback: e.target.checked }))}
                        style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY LIVE MEMBER PREVIEW (DESKTOP >= 920px) */}
          <div className="event-studio-preview-col">
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--ink-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Eye size={13} color="var(--brand-accent)" /> Live Member Preview
            </div>
            {renderLivePreviewCard()}
          </div>
        </div>

        {/* STICKY FOOTER BAR (ALWAYS 1-TAP PUBLISH / SAVE) */}
        <div
          className="event-studio-footer"
          style={{
            borderTop: '1px solid var(--hairline-border)',
            background: 'var(--surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {/* Left Status / Edit Utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {missingItem ? (
              <button
                type="button"
                onClick={missingItem.jump}
                style={{
                  padding: '6px 11px',
                  borderRadius: '99px',
                  background: 'rgba(245, 158, 11, 0.14)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#d97706',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Add {missingItem.label} →
              </button>
            ) : isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {typeof onDuplicate === 'function' && (
                  <button
                    type="button"
                    onClick={onDuplicate}
                    className="btn btn-outline interactive-press"
                    style={{
                      padding: '8px 11px',
                      borderRadius: '10px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Copy size={13} /> Duplicate
                  </button>
                )}
                {typeof onCancelEvent === 'function' && (
                  confirmCancelStep ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={async () => {
                          setIsCancelling(true);
                          try {
                            await onCancelEvent();
                          } finally {
                            setIsCancelling(false);
                          }
                        }}
                        style={{
                          padding: '8px 11px',
                          borderRadius: '10px',
                          background: '#ef4444',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <AlertTriangle size={13} /> {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancelStep(false)}
                        style={{
                          padding: '8px 9px',
                          borderRadius: '10px',
                          background: 'var(--surface-card)',
                          border: '1px solid var(--hairline-border)',
                          color: 'var(--ink-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelStep(true)}
                      style={{
                        padding: '8px 11px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel Event
                    </button>
                  )
                )}
              </div>
            ) : (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#10b981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <CheckCircle2 size={15} />
                {resolvedDatesCount > 1 ? `${resolvedDatesCount} sessions ready` : 'Ready to publish'}
              </span>
            )}
          </div>

          {/* Primary Publish / Save CTA */}
          <button
            type="button"
            disabled={isUploading || Boolean(missingItem)}
            onClick={onSubmit}
            className="btn btn-primary interactive-press"
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              opacity: isUploading || Boolean(missingItem) ? 0.48 : 1,
              cursor: isUploading || Boolean(missingItem) ? 'not-allowed' : 'pointer',
              minWidth: '170px',
            }}
          >
            {isUploading ? <Loader2 size={16} className="spin" /> : <Check size={17} />}
            {isUploading
              ? isEditing
                ? 'Saving...'
                : 'Publishing...'
              : isEditing
              ? 'Save Changes'
              : resolvedDatesCount > 1
              ? `Publish ${resolvedDatesCount} Events`
              : 'Publish Event'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
