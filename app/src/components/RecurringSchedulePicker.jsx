import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Repeat, 
  CalendarDays, 
  Layers, 
  Plus, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Info,
  CalendarRange
} from 'lucide-react';
import { 
  generateEventDates, 
  formatEventDate, 
  getWeekdayOrdinalInfo, 
  getRecurrenceDescription 
} from '../lib/recurrence';

export default function RecurringSchedulePicker({
  initialDate = '',
  initialTime = '',
  isEditing = false,
  onChange = () => {}
}) {
  // Mode: 'single' | 'recurring' | 'custom'
  const [scheduleMode, setScheduleMode] = useState('single');
  
  // Base date and time
  const [startDate, setStartDate] = useState(initialDate || '');
  const [time, setTime] = useState(initialTime || '10:00');

  // Recurring options
  // 'weekly' | 'biweekly' | 'monthly_weekday' | 'monthly_date' | 'weekdays'
  const [frequency, setFrequency] = useState('weekly');
  const [endType, setEndType] = useState('count'); // 'count' | 'until'
  const [count, setCount] = useState(6);
  const [untilDate, setUntilDate] = useState('');
  const [excludedDates, setExcludedDates] = useState([]);

  // Variety of dates (Custom list)
  const [customDates, setCustomDates] = useState([]);
  const [newCustomDate, setNewCustomDate] = useState('');

  // Sync initial date if passed from parent
  useEffect(() => {
    if (initialDate && !startDate) {
      setStartDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialTime && !time) {
      setTime(initialTime);
    }
  }, [initialTime]);

  // Ordinal info for start date (e.g. 1st Saturday)
  const ordinalInfo = useMemo(() => {
    return getWeekdayOrdinalInfo(startDate);
  }, [startDate]);

  // Compute resolved dates
  const resolvedDates = useMemo(() => {
    if (scheduleMode === 'single') {
      return startDate ? [startDate] : [];
    }

    if (scheduleMode === 'recurring') {
      return generateEventDates({
        startDate,
        frequency,
        endType,
        count,
        untilDate,
        excludedDates
      });
    }

    if (scheduleMode === 'custom') {
      return generateEventDates({
        startDate,
        frequency: 'custom',
        customDates,
        excludedDates
      });
    }

    return startDate ? [startDate] : [];
  }, [scheduleMode, startDate, frequency, endType, count, untilDate, excludedDates, customDates]);

  // Recurrence summary text
  const recurrenceSummary = useMemo(() => {
    if (scheduleMode === 'single') return 'Single event';
    return getRecurrenceDescription({
      frequency: scheduleMode === 'custom' ? 'custom' : frequency,
      startDate,
      count,
      endType,
      untilDate,
      totalDates: resolvedDates.length
    });
  }, [scheduleMode, frequency, startDate, count, endType, untilDate, resolvedDates.length]);

  // Notify parent component whenever schedule changes
  useEffect(() => {
    onChange({
      date: resolvedDates[0] || startDate || '',
      time,
      scheduleMode,
      frequency,
      count,
      endType,
      untilDate,
      customDates,
      excludedDates,
      resolvedDates,
      recurrenceSummary
    });
  }, [
    scheduleMode,
    startDate,
    time,
    frequency,
    count,
    endType,
    untilDate,
    customDates,
    excludedDates,
    resolvedDates,
    recurrenceSummary
  ]);

  // Handlers for custom dates
  const handleAddCustomDate = (dateToAdd) => {
    const val = dateToAdd || newCustomDate;
    if (!val) return;
    if (!startDate) {
      setStartDate(val);
      setNewCustomDate('');
      return;
    }
    if (val === startDate || customDates.includes(val)) {
      setNewCustomDate('');
      return;
    }
    setCustomDates(prev => [...prev, val].sort());
    setNewCustomDate('');
  };

  const handleRemoveCustomDate = (dateToRemove) => {
    if (dateToRemove === startDate) {
      if (customDates.length > 0) {
        const [nextStart, ...rest] = customDates;
        setStartDate(nextStart);
        setCustomDates(rest);
      } else {
        setStartDate('');
      }
    } else {
      setCustomDates(prev => prev.filter(d => d !== dateToRemove));
    }
  };

  const handleAddPresetRelativeDate = (daysAhead) => {
    const base = startDate ? new Date(startDate + 'T00:00:00') : new Date();
    base.setDate(base.getDate() + daysAhead);
    const yr = base.getFullYear();
    const mo = String(base.getMonth() + 1).padStart(2, '0');
    const da = String(base.getDate()).padStart(2, '0');
    const dateStr = `${yr}-${mo}-${da}`;
    handleAddCustomDate(dateStr);
  };

  const toggleExcludeDate = (dateStr) => {
    setExcludedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Mode Selector Tabs (Hidden when editing an existing event) */}
      {!isEditing && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          background: 'rgba(255,255,255,0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <button
            type="button"
            onClick={() => setScheduleMode('single')}
            className="interactive-press"
            style={{
              padding: '10px 8px',
              borderRadius: '9px',
              border: 'none',
              background: scheduleMode === 'single' ? 'var(--teal-500)' : 'transparent',
              color: scheduleMode === 'single' ? '#ffffff' : 'var(--slate-400)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Calendar size={14} /> Single Event
          </button>

          <button
            type="button"
            onClick={() => setScheduleMode('recurring')}
            className="interactive-press"
            style={{
              padding: '10px 8px',
              borderRadius: '9px',
              border: 'none',
              background: scheduleMode === 'recurring' ? 'linear-gradient(135deg, var(--teal-600), #3b82f6)' : 'transparent',
              color: scheduleMode === 'recurring' ? '#ffffff' : 'var(--slate-400)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Repeat size={14} /> Recurring
          </button>

          <button
            type="button"
            onClick={() => setScheduleMode('custom')}
            className="interactive-press"
            style={{
              padding: '10px 8px',
              borderRadius: '9px',
              border: 'none',
              background: scheduleMode === 'custom' ? 'linear-gradient(135deg, #8b5cf6, var(--teal-500))' : 'transparent',
              color: scheduleMode === 'custom' ? '#ffffff' : 'var(--slate-400)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <CalendarRange size={14} /> Variety of Dates
          </button>
        </div>
      )}

      {/* Date & Time Row */}
      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="var(--teal-400)" /> 
            {scheduleMode === 'recurring' ? 'First Event Date' : scheduleMode === 'custom' ? 'Initial Date' : 'Date'}
            <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span>
          </label>
          <input 
            type="date" 
            className="form-input" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            style={{ colorScheme: 'dark', padding: '12px 14px', width: '100%', borderRadius: '10px' }} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="var(--teal-400)" /> Time <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span>
          </label>
          <input 
            type="time" 
            className="form-input" 
            value={time} 
            onChange={e => setTime(e.target.value)} 
            style={{ colorScheme: 'dark', padding: '12px 14px', width: '100%', borderRadius: '10px' }} 
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RECURRING MODE SETTINGS
         ───────────────────────────────────────────────────────────── */}
      {scheduleMode === 'recurring' && (
        <div style={{
          background: 'rgba(20,184,166,0.04)',
          border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Repeat size={14} color="var(--teal-400)" /> Repeats Frequency
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className="interactive-press"
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  border: frequency === 'weekly' ? '1px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.08)',
                  background: frequency === 'weekly' ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--white)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Weekly</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                  Every {ordinalInfo ? ordinalInfo.weekdayName : 'week'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('biweekly')}
                className="interactive-press"
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  border: frequency === 'biweekly' ? '1px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.08)',
                  background: frequency === 'biweekly' ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--white)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Bi-Weekly</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                  Every 2 {ordinalInfo ? `${ordinalInfo.weekdayName}s` : 'weeks'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('monthly_weekday')}
                className="interactive-press"
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  border: frequency === 'monthly_weekday' ? '1px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.08)',
                  background: frequency === 'monthly_weekday' ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--white)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Monthly (Day of week)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                  {ordinalInfo ? `${ordinalInfo.ordinalWord} ${ordinalInfo.weekdayName}` : 'Same weekday'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('monthly_date')}
                className="interactive-press"
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  border: frequency === 'monthly_date' ? '1px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.08)',
                  background: frequency === 'monthly_date' ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--white)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Monthly (Date)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                  {ordinalInfo ? `${ordinalInfo.dayOfMonth}th of each month` : 'Same calendar date'}
                </div>
              </button>
            </div>
          </div>

          {/* Repeat Limit (Count or Until Date) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Duration</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEndType('count')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: endType === 'count' ? 'rgba(20,184,166,0.2)' : 'transparent',
                    color: endType === 'count' ? 'var(--teal-300)' : 'var(--slate-400)',
                    cursor: 'pointer'
                  }}
                >
                  By Sessions
                </button>
                <button
                  type="button"
                  onClick={() => setEndType('until')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: endType === 'until' ? 'rgba(20,184,166,0.2)' : 'transparent',
                    color: endType === 'until' ? 'var(--teal-300)' : 'var(--slate-400)',
                    cursor: 'pointer'
                  }}
                >
                  Until Date
                </button>
              </div>
            </div>

            {endType === 'count' ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[3, 4, 6, 8, 12, 16, 24].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className="interactive-press"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: count === num ? '1px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.08)',
                      background: count === num ? 'var(--teal-500)' : 'rgba(255,255,255,0.03)',
                      color: count === num ? '#ffffff' : 'var(--slate-300)',
                      cursor: 'pointer'
                    }}
                  >
                    {num} sessions
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <input
                  type="date"
                  className="form-input"
                  value={untilDate}
                  min={startDate}
                  onChange={e => setUntilDate(e.target.value)}
                  style={{ colorScheme: 'dark', padding: '10px 14px', borderRadius: '8px', width: '100%' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VARIETY OF DATES (CUSTOM MULTI-DATE) MODE
         ───────────────────────────────────────────────────────────── */}
      {scheduleMode === 'custom' && (
        <div style={{
          background: 'rgba(139,92,246,0.05)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Plus size={14} color="#a78bfa" /> Add Additional Dates
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                className="form-input"
                value={newCustomDate}
                onChange={e => setNewCustomDate(e.target.value)}
                style={{ colorScheme: 'dark', padding: '10px 14px', borderRadius: '8px', flex: 1 }}
              />
              <button
                type="button"
                onClick={() => handleAddCustomDate()}
                disabled={!newCustomDate}
                className="btn btn-primary interactive-press"
                style={{
                  padding: '0 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: newCustomDate ? 1 : 0.5
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Quick Relative Adders */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', alignSelf: 'center', marginRight: '4px' }}>Quick add:</span>
            <button
              type="button"
              onClick={() => handleAddPresetRelativeDate(7)}
              style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', fontSize: '0.72rem', cursor: 'pointer' }}
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={() => handleAddPresetRelativeDate(14)}
              style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', fontSize: '0.72rem', cursor: 'pointer' }}
            >
              +2 Weeks
            </button>
            <button
              type="button"
              onClick={() => handleAddPresetRelativeDate(28)}
              style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', fontSize: '0.72rem', cursor: 'pointer' }}
            >
              +4 Weeks
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SCHEDULE PREVIEW (FOR RECURRING & CUSTOM MODES)
         ───────────────────────────────────────────────────────────── */}
      {scheduleMode !== 'single' && resolvedDates.length > 0 && (
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} color="var(--teal-400)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--white)' }}>
                {resolvedDates.length} Events will be published
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--teal-300)', background: 'rgba(20,184,166,0.12)', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
              {recurrenceSummary}
            </span>
          </div>

          <div style={{ fontSize: '0.73rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
            Click <X size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> to exclude any specific holiday or clash from this batch:
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            maxHeight: '160px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {resolvedDates.map((dateStr, idx) => (
              <div
                key={dateStr}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  color: 'var(--slate-200)'
                }}
              >
                <span style={{ color: 'var(--teal-400)', fontWeight: 700, fontSize: '0.7rem' }}>#{idx + 1}</span>
                <span>{formatEventDate(dateStr)}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (scheduleMode === 'custom') {
                      handleRemoveCustomDate(dateStr);
                    } else {
                      toggleExcludeDate(dateStr);
                    }
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--slate-400)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    marginLeft: '2px',
                    borderRadius: '4px'
                  }}
                  title="Remove this date from batch"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {excludedDates.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--amber-400)', background: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: '8px' }}>
              <span>{excludedDates.length} date{excludedDates.length > 1 ? 's' : ''} skipped from series</span>
              <button
                type="button"
                onClick={() => setExcludedDates([])}
                style={{ border: 'none', background: 'transparent', color: 'var(--amber-300)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.72rem' }}
              >
                Restore all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
