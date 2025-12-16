import React, { useEffect, useRef, useState } from 'react';

// Animated number counter
function AnimatedNumber({ value, formatter }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    if (value === null || value === undefined) return;

    const startValue = prevValue.current;
    const endValue = value;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return formatter(displayValue);
}

// Format numbers with commas
function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  return Math.round(num).toLocaleString();
}

// Format ratio as percentage
function formatRatio(ratio) {
  if (ratio === null || ratio === undefined || isNaN(ratio)) return '—';
  return (ratio * 100).toFixed(2) + '%';
}

// Format as X:1 ratio
function formatSendsPerLead(value) {
  if (value === null || value === undefined || isNaN(value) || value === 0) return '—';
  return `${Math.round(value).toLocaleString()}:1`;
}

export default function MetricCard({ label, value, format = 'number', trend, accentColor, icon }) {
  const formatter = format === 'ratio'
    ? formatRatio
    : format === 'percent'
    ? (v) => (v * 100).toFixed(1) + '%'
    : format === 'etl'
    ? formatSendsPerLead
    : formatNumber;

  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';

  const showAnimated = value !== null && value !== undefined && !isNaN(value);

  return (
    <div className={`metric-card ${accentColor || ''}`}>
      <div className="metric-header">
        {icon && <span className="metric-icon">{icon}</span>}
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value">
        {showAnimated ? (
          <AnimatedNumber value={value} formatter={formatter} />
        ) : (
          '—'
        )}
      </div>
      {trend !== undefined && trend !== null && (
        <div className={`metric-trend ${trendDirection}`}>
          <span className="trend-arrow">
            {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'}
          </span>
          <span className="trend-value">{Math.abs(trend).toFixed(1)}%</span>
          <span className="trend-label">vs last period</span>
        </div>
      )}
    </div>
  );
}
