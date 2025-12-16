import React, { useState, useRef, useEffect } from 'react';

export default function DatePicker({ startDate, endDate, onChange, maxDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (endDate) return new Date(endDate + 'T00:00:00');
    if (startDate) return new Date(startDate + 'T00:00:00');
    return new Date();
  });
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSelectingEnd(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDateDisabled = (date) => {
    if (!maxDate) return false;
    const max = new Date(maxDate + 'T23:59:59');
    return date > max;
  };

  const isToday = (year, month, day) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const isInRange = (year, month, day) => {
    if (!startDate || !endDate) return false;
    const date = new Date(year, month, day);
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    return date >= start && date <= end;
  };

  const isRangeStart = (year, month, day) => {
    if (!startDate) return false;
    const date = formatDateString(new Date(year, month, day));
    return date === startDate;
  };

  const isRangeEnd = (year, month, day) => {
    if (!endDate) return false;
    const date = formatDateString(new Date(year, month, day));
    return date === endDate;
  };

  const handleDayClick = (day) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (isDateDisabled(date)) return;

    const dateStr = formatDateString(date);

    if (!startDate || (startDate && endDate) || selectingEnd === false) {
      // Start new selection
      onChange(dateStr, null);
      setSelectingEnd(true);
    } else {
      // Complete the range
      if (dateStr < startDate) {
        // User selected earlier date, swap
        onChange(dateStr, startDate);
      } else {
        onChange(startDate, dateStr);
      }
      setSelectingEnd(false);
      setIsOpen(false);
    }
  };

  const navigateMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const navigateYear = (delta) => {
    setViewDate(new Date(viewDate.getFullYear() + delta, viewDate.getMonth(), 1));
  };

  const selectPreset = (preset) => {
    const today = new Date();
    let start, end;

    switch (preset) {
      case 'today':
        start = end = formatDateString(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = formatDateString(yesterday);
        break;
      case 'last7':
        end = formatDateString(today);
        const week = new Date(today);
        week.setDate(week.getDate() - 6);
        start = formatDateString(week);
        break;
      case 'last30':
        end = formatDateString(today);
        const month = new Date(today);
        month.setDate(month.getDate() - 29);
        start = formatDateString(month);
        break;
      case 'thisMonth':
        start = formatDateString(new Date(today.getFullYear(), today.getMonth(), 1));
        end = formatDateString(today);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start = formatDateString(lastMonth);
        end = formatDateString(new Date(today.getFullYear(), today.getMonth(), 0));
        break;
      default:
        return;
    }

    onChange(start, end);
    setIsOpen(false);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange(null, null);
    setSelectingEnd(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const disabled = isDateDisabled(date);
      const today = isToday(year, month, day);
      const inRange = isInRange(year, month, day);
      const rangeStart = isRangeStart(year, month, day);
      const rangeEnd = isRangeEnd(year, month, day);

      days.push(
        <button
          key={day}
          type="button"
          className={`calendar-day
            ${disabled ? 'disabled' : ''}
            ${today ? 'today' : ''}
            ${inRange ? 'in-range' : ''}
            ${rangeStart ? 'range-start' : ''}
            ${rangeEnd ? 'range-end' : ''}`}
          onClick={() => handleDayClick(day)}
          disabled={disabled}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDisplayDate = () => {
    if (!startDate) return 'Select date range';
    const start = new Date(startDate + 'T00:00:00');
    const startStr = `${shortMonths[start.getMonth()]} ${start.getDate()}`;

    if (!endDate || startDate === endDate) {
      return startStr + (selectingEnd ? ' → ...' : '');
    }

    const end = new Date(endDate + 'T00:00:00');
    const endStr = `${shortMonths[end.getMonth()]} ${end.getDate()}`;
    return `${startStr} → ${endStr}`;
  };

  return (
    <div className="custom-date-picker" ref={containerRef}>
      <button
        type="button"
        className={`date-picker-trigger ${startDate ? 'has-value' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="calendar-icon">
          <path d="M5 1v2M11 1v2M2 6h12M3 3h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="date-display">{formatDisplayDate()}</span>
        {startDate && (
          <span className="clear-date" onClick={clearSelection}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="calendar-dropdown range-picker">
          <div className="calendar-main">
            <div className="calendar-header">
              <button type="button" className="nav-btn" onClick={() => navigateYear(-1)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: -6 }}>
                  <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button type="button" className="nav-btn" onClick={() => navigateMonth(-1)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="calendar-title">
                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button type="button" className="nav-btn" onClick={() => navigateMonth(1)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button type="button" className="nav-btn" onClick={() => navigateYear(1)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: -6 }}>
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="calendar-weekdays">
              {daysOfWeek.map((day) => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {renderCalendar()}
            </div>

            {selectingEnd && (
              <div className="calendar-hint">Select end date</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
