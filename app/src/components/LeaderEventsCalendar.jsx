"use client";
import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Edit3,
  UserCheck,
  ExternalLink,
  Copy,
  Check,
  Download,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Share2,
} from 'lucide-react';
import { parseEventDateTime } from '../lib/calendar';
import { cleanLocationName } from '../lib/location';
import { getEventPath, SITE_ORIGIN } from '../lib/eventLinks';

const CATEGORY_META = {
  event: {
    label: 'Community Event',
    shortLabel: 'Events',
    color: '#EB5738',
    bg: 'rgba(235, 87, 56, 0.14)',
    border: 'rgba(235, 87, 56, 0.38)',
  },
  cohost: {
    label: 'Co-Host / Partner',
    shortLabel: 'Co-Host',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.38)',
  },
  experience: {
    label: 'Experience',
    shortLabel: 'Experiences',
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.14)',
    border: 'rgba(99, 102, 241, 0.38)',
  },
  proposed: {
    label: 'Proposed',
    shortLabel: 'Proposed',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.14)',
    border: 'rgba(217, 119, 6, 0.38)',
  },
  cancelled: {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.30)',
  },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(dateObj) {
  if (!dateObj || Number.isNaN(dateObj.getTime())) return null;
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resolveItemDateKey(item) {
  if (!item?.date) return null;
  const raw = String(item.date).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  const parsed = parseEventDateTime(item.date, item.time);
  return parsed ? toDateKey(parsed) : null;
}

export default function LeaderEventsCalendar({
  community,
  events = [],
  allEvents = [],
  experiences = [],
  eventRsvps = {},
  onCreateOnDate,
  onEditEvent,
  onCheckInEvent,
  onDuplicateEvent,
  onOpenEvent,
  onOpenExperience,
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    event: true,
    cohost: true,
    experience: true,
    proposed: true,
    cancelled: false,
  });
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  // Build unified colour-coded calendar items from community events, co-hosted events, and curated experiences
  const calendarItems = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Community events & proposals
    (events || []).forEach((ev) => {
      if (!ev?.id || seenIds.has(`ev-${ev.id}`)) return;
      seenIds.add(`ev-${ev.id}`);
      const dateKey = resolveItemDateKey(ev);
      if (!dateKey) return;

      const isCohost =
        Array.isArray(ev.cohostCommunityIds) && ev.cohostCommunityIds.length > 0
          ? true
          : Boolean(ev.communityId && community?.id && ev.communityId !== community.id);

      let kind = 'event';
      if (ev.status === 'cancelled') kind = 'cancelled';
      else if (ev.status === 'proposed') kind = 'proposed';
      else if (isCohost) kind = 'cohost';

      const rsvpCount = (eventRsvps?.[ev.id] || []).filter(
        (r) => r.status === 'going' || r.status === 'checked_in' || r.checkedIn
      ).length;

      list.push({
        uid: `ev-${ev.id}`,
        id: ev.id,
        kind,
        isExperience: false,
        dateKey,
        title: ev.title || 'Untitled Event',
        time: ev.time || '',
        location: cleanLocationName(ev.location || ev.location_name || ''),
        rsvpCount,
        raw: ev,
      });
    });

    // 2. Co-hosted events from other communities where this community is a co-host
    (allEvents || []).forEach((ev) => {
      if (!ev?.id || seenIds.has(`ev-${ev.id}`)) return;
      const cohosts = Array.isArray(ev.cohostCommunityIds)
        ? ev.cohostCommunityIds
        : Array.isArray(ev.cohost_community_ids)
          ? ev.cohost_community_ids
          : [];
      if (!community?.id || !cohosts.includes(community.id)) return;
      seenIds.add(`ev-${ev.id}`);
      const dateKey = resolveItemDateKey(ev);
      if (!dateKey) return;

      const rsvpCount = (eventRsvps?.[ev.id] || []).filter(
        (r) => r.status === 'going' || r.status === 'checked_in' || r.checkedIn
      ).length;

      list.push({
        uid: `ev-${ev.id}`,
        id: ev.id,
        kind: ev.status === 'cancelled' ? 'cancelled' : 'cohost',
        isExperience: false,
        dateKey,
        title: ev.title || 'Co-Hosted Event',
        time: ev.time || '',
        location: cleanLocationName(ev.location || ev.location_name || ''),
        rsvpCount,
        raw: ev,
      });
    });

    // 3. Curated Experiences linked to this community that have a scheduled date
    (experiences || []).forEach((exp) => {
      if (!exp?.id) return;
      if (community?.id && exp.communityId && exp.communityId !== community.id) return;
      const dateKey = resolveItemDateKey(exp);
      if (!dateKey) return;

      list.push({
        uid: `exp-${exp.id}`,
        id: exp.id,
        kind: 'experience',
        isExperience: true,
        dateKey,
        title: exp.title || 'Experience',
        time: exp.time || '',
        location: cleanLocationName(exp.location || ''),
        rsvpCount: 0,
        raw: exp,
      });
    });

    return list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [events, allEvents, experiences, eventRsvps, community?.id]);

  // Filter items by active category toggles
  const filteredByDate = useMemo(() => {
    const map = {};
    calendarItems.forEach((item) => {
      if (!activeFilters[item.kind]) return;
      if (!map[item.dateKey]) map[item.dateKey] = [];
      map[item.dateKey].push(item);
    });
    return map;
  }, [calendarItems, activeFilters]);

  // Build month grid cells (Monday-first, 5 or 6 weeks)
  const monthCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0 .. Sun=6
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(viewYear, viewMonth, 1 - startOffset + i);
      cells.push({
        date: cellDate,
        dateKey: toDateKey(cellDate),
        dayNumber: cellDate.getDate(),
        inMonth: cellDate.getMonth() === viewMonth,
        isToday: toDateKey(cellDate) === todayKey,
      });
    }
    return cells;
  }, [viewYear, viewMonth, todayKey]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const toggleFilter = (kind) => {
    setActiveFilters((prev) => ({ ...prev, [kind]: !prev[kind] }));
  };

  // External Calendar Feed URLs (Google / Apple / Outlook / Android)
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : SITE_ORIGIN || 'https://www.morecommunity.app';
  const httpsFeedUrl = community?.id ? `${origin}/api/calendar/${encodeURIComponent(community.id)}` : '';
  const webcalFeedUrl = httpsFeedUrl.replace(/^https?:\/\//i, 'webcal://');
  const googleSubscribeUrl = webcalFeedUrl
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalFeedUrl)}`
    : '#';
  const outlookSubscribeUrl = httpsFeedUrl
    ? `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(httpsFeedUrl)}&name=${encodeURIComponent(community?.name || 'More Community')}`
    : '#';

  const handleCopyFeed = async () => {
    if (!httpsFeedUrl) return;
    try {
      await navigator.clipboard.writeText(httpsFeedUrl);
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2200);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Calendar Header & External Sync Bar */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border)',
          borderRadius: '18px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Top Row: Month Controls + Sync Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="interactive-press"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--ink-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--ink-primary)',
                minWidth: '155px',
                textAlign: 'center',
              }}
            >
              {monthLabel}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="interactive-press"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--ink-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="interactive-press"
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--ink-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Today
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSyncPanel((v) => !v)}
            className="interactive-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: showSyncPanel ? 'var(--brand-accent)' : 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              color: showSyncPanel ? '#FFFFFF' : 'var(--ink-primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} /> Sync to Google / Apple / Outlook
          </button>
        </div>

        {/* Collapsible External Calendar Sync Panel */}
        {showSyncPanel && community?.id && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-primary)', fontWeight: 700 }}>
              Live Calendar Subscription Feed (auto-updates every 3 hours)
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
              Subscribe once in Google Calendar, Apple Calendar (iPhone/Mac), Outlook, or Android —
              every new or updated event in <strong>{community.name}</strong> syncs automatically.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <a
                href={googleSubscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="interactive-press"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  borderRadius: '9px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  color: 'var(--ink-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <CalendarIcon size={13} color="#EB5738" /> Google Calendar
              </a>
              <a
                href={webcalFeedUrl}
                className="interactive-press"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  borderRadius: '9px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  color: 'var(--ink-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <CalendarIcon size={13} color="#10B981" /> Apple / iOS / Android
              </a>
              <a
                href={outlookSubscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="interactive-press"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  borderRadius: '9px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  color: 'var(--ink-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <CalendarIcon size={13} color="#2563EB" /> Microsoft Outlook
              </a>
              <button
                type="button"
                onClick={handleCopyFeed}
                className="interactive-press"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  borderRadius: '9px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  color: copiedFeed ? '#16a34a' : 'var(--ink-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {copiedFeed ? <Check size={13} /> : <Copy size={13} />}
                {copiedFeed ? 'Feed URL Copied!' : 'Copy .ics Feed URL'}
              </button>
              <a
                href={httpsFeedUrl}
                download={`${community.id}-events.ics`}
                className="interactive-press"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  borderRadius: '9px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  color: 'var(--ink-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Download size={13} /> Download .ics
              </a>
            </div>
          </div>
        )}

        {/* Colour-Coded Legend & Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const active = activeFilters[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleFilter(key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? meta.bg : 'transparent',
                  border: `1px solid ${active ? meta.border : 'var(--hairline-border)'}`,
                  color: active ? meta.color : 'var(--ink-muted)',
                  opacity: active ? 1 : 0.6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: meta.color,
                    flexShrink: 0,
                  }}
                />
                {meta.shortLabel}
              </button>
            );
          })}
          <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginLeft: 'auto' }}>
            Click any date&apos;s + to add an event
          </span>
        </div>
      </div>

      {/* Month Grid */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border)',
          borderRadius: '18px',
          overflow: 'hidden',
        }}
      >
        {/* Weekday Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            background: 'var(--surface-elevated)',
            borderBottom: '1px solid var(--hairline-border)',
          }}
        >
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              style={{
                padding: '9px 6px',
                textAlign: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--ink-muted)',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          }}
        >
          {monthCells.map((cell, idx) => {
            const dayItems = filteredByDate[cell.dateKey] || [];
            const isLastRow = idx >= monthCells.length - 7;
            const isLastCol = (idx + 1) % 7 === 0;

            return (
              <div
                key={cell.dateKey}
                style={{
                  minHeight: '96px',
                  padding: '6px',
                  borderRight: isLastCol ? 'none' : '1px solid var(--hairline-border)',
                  borderBottom: isLastRow ? 'none' : '1px solid var(--hairline-border)',
                  background: cell.isToday
                    ? 'var(--brand-accent-soft)'
                    : cell.inMonth
                      ? 'transparent'
                      : 'var(--surface-elevated)',
                  opacity: cell.inMonth ? 1 : 0.55,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: cell.isToday ? 800 : 600,
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: cell.isToday ? 'var(--brand-accent)' : 'transparent',
                      color: cell.isToday ? '#FFFFFF' : 'var(--ink-secondary)',
                    }}
                  >
                    {cell.dayNumber}
                  </span>
                  {onCreateOnDate && (
                    <button
                      type="button"
                      onClick={() => onCreateOnDate(cell.dateKey)}
                      title={`Create event on ${cell.dateKey}`}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--ink-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>

                {/* Colour-Coded Event Pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                  {dayItems.slice(0, 3).map((item) => {
                    const meta = CATEGORY_META[item.kind] || CATEGORY_META.event;
                    const isSelected = selectedItem?.uid === item.uid;
                    return (
                      <button
                        key={item.uid}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '3px 6px',
                          borderRadius: '6px',
                          background: isSelected ? meta.color : meta.bg,
                          border: `1px solid ${meta.border}`,
                          color: isSelected ? '#FFFFFF' : meta.color,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          lineHeight: 1.25,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textDecoration: item.kind === 'cancelled' ? 'line-through' : 'none',
                        }}
                        title={`${item.time ? item.time + ' · ' : ''}${item.title}`}
                      >
                        {item.time ? `${item.time} ` : ''}
                        {item.title}
                      </button>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <span
                      style={{
                        fontSize: '0.66rem',
                        color: 'var(--ink-muted)',
                        fontWeight: 600,
                        paddingLeft: '4px',
                      }}
                    >
                      +{dayItems.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Event / Experience Quick-Action Inspector */}
      {selectedItem && (
        <div
          style={{
            background: 'var(--surface-card)',
            border: `1.5px solid ${(CATEGORY_META[selectedItem.kind] || CATEGORY_META.event).border}`,
            borderRadius: '16px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: (CATEGORY_META[selectedItem.kind] || CATEGORY_META.event).bg,
                  color: (CATEGORY_META[selectedItem.kind] || CATEGORY_META.event).color,
                }}
              >
                {(CATEGORY_META[selectedItem.kind] || CATEGORY_META.event).label}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
                {selectedItem.dateKey}
                {selectedItem.time ? ` · ${selectedItem.time}` : ''}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: 'var(--ink-primary)',
                marginBottom: '6px',
              }}
            >
              {selectedItem.title}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                fontSize: '0.78rem',
                color: 'var(--ink-secondary)',
              }}
            >
              {selectedItem.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="var(--brand-accent)" /> {selectedItem.location}
                </span>
              )}
              {!selectedItem.isExperience && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} color="var(--brand-accent)" /> {selectedItem.rsvpCount} going
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {selectedItem.isExperience ? (
              <button
                type="button"
                onClick={() => onOpenExperience?.(selectedItem.raw)}
                className="btn btn-primary interactive-press"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} /> View Experience
              </button>
            ) : (
              <>
                {onEditEvent && (
                  <button
                    type="button"
                    onClick={() => onEditEvent(selectedItem.raw)}
                    className="btn btn-primary interactive-press"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
                {onCheckInEvent && (
                  <button
                    type="button"
                    onClick={() => onCheckInEvent(selectedItem.raw)}
                    className="btn btn-outline interactive-press"
                    style={{
                      padding: '8px 13px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      color: '#15803D',
                      borderColor: 'rgba(21,128,61,0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <UserCheck size={13} /> Check-In
                  </button>
                )}
                {onDuplicateEvent && (
                  <button
                    type="button"
                    onClick={() => onDuplicateEvent(selectedItem.raw)}
                    className="btn btn-outline interactive-press"
                    style={{
                      padding: '8px 13px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Copy size={13} /> Duplicate
                  </button>
                )}
                {onOpenEvent && (
                  <button
                    type="button"
                    onClick={() => onOpenEvent(getEventPath(selectedItem.raw, allEvents))}
                    className="btn btn-outline interactive-press"
                    style={{
                      padding: '8px 13px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <ExternalLink size={13} /> Open Page
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
