import React from 'react';

// Enhanced trend chart with glow effects
export default function TrendChart({ data, dataKey = 'etlRatio', height = 120 }) {
  if (!data || data.length === 0) {
    return (
      <div className="trend-chart empty">
        <p>No trend data available</p>
      </div>
    );
  }

  // Get values and find min/max
  const values = data.map(d => d[dataKey] || 0);
  const max = Math.max(...values, 0.001);
  const min = Math.min(...values, 0);
  const range = max - min || 0.001;

  // Calculate points for SVG path
  const width = 100;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Build smooth path using bezier curves
  const getPoint = (i) => {
    const x = padding + (i / (values.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((values[i] - min) / range) * chartHeight;
    return { x, y };
  };

  const points = values.map((_, i) => getPoint(i));

  // Create smooth path
  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cp1x = prev.x + (curr.x - prev.x) * 0.3;
    const cp2x = prev.x + (curr.x - prev.x) * 0.7;
    pathD += ` C ${cp1x},${prev.y} ${cp2x},${curr.y} ${curr.x},${curr.y}`;
  }

  // Area path
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`;

  // Get first and last values for comparison
  const firstVal = values[0] || 0;
  const lastVal = values[values.length - 1] || 0;
  const change = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const isUp = change >= 0;

  // Colors matching Zotex brand
  const upColor = '#34d399';
  const downColor = '#f87171';
  const lineColor = isUp ? upColor : downColor;

  return (
    <div className="trend-chart">
      <div className="trend-header">
        <span className="trend-title">30-Day Trend</span>
        <span className={`trend-change ${isUp ? 'up' : 'down'}`}>
          {isUp ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="sparkline">
        <defs>
          {/* Gradient for the line */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Gradient for the area fill */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="50%" stopColor={lineColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={padding + chartHeight * pct}
            x2={width - padding}
            y2={padding + chartHeight * pct}
            stroke="rgba(255,255,255,0.03)"
            strokeDasharray="2,4"
          />
        ))}

        {/* Area fill */}
        <path
          d={areaD}
          fill="url(#areaGradient)"
        />

        {/* Glow line (behind main line) */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
          filter="url(#glow)"
        />

        {/* Main line */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points on hover - just show first, middle, and last */}
        {[0, Math.floor(points.length / 2), points.length - 1].map(i => (
          <circle
            key={i}
            cx={points[i].x}
            cy={points[i].y}
            r={i === points.length - 1 ? 4 : 2}
            fill={i === points.length - 1 ? lineColor : 'rgba(255,255,255,0.3)'}
            stroke={i === points.length - 1 ? lineColor : 'transparent'}
            strokeWidth="2"
            opacity={i === points.length - 1 ? 1 : 0.5}
          />
        ))}

        {/* Glow on end point */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="8"
          fill={lineColor}
          opacity="0.2"
          filter="url(#glow)"
        />
      </svg>
      <div className="trend-range">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
