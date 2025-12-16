import React from 'react';

const periods = [
  { key: 'day', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'allTime', label: 'All' }
];

export default function TimeSelector({ selected, onChange }) {
  return (
    <div className="time-selector">
      {periods.map(({ key, label }) => (
        <button
          key={key}
          className={`time-btn ${selected === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
