import React from 'react';

export default function RatioGauge({ ratio, sendsPerLead }) {
  // Scale: 3000:1 = excellent, 5500:1 = good, 8000:1 = poor
  // Lower sends per lead = better performance

  const minSends = 3000;  // excellent
  const maxSends = 8000;  // poor
  const clampedValue = Math.max(minSends, Math.min(maxSends, sendsPerLead || maxSends));

  // Percentage: 100% when at 3000 (excellent), 0% when at 8000 (poor)
  const percentage = ((maxSends - clampedValue) / (maxSends - minSends)) * 100;

  // Format as X:1
  const formattedRatio = sendsPerLead ? `${Math.round(sendsPerLead).toLocaleString()}:1` : '—';

  return (
    <div className="ratio-gauge">
      <div className="gauge-header">
        <span className="gauge-title">ETL Ratio</span>
        <span className="gauge-value">{formattedRatio}</span>
      </div>
      <div className="gauge-track">
        <div
          className="gauge-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="gauge-markers">
        <span>8,000:1</span>
        <span>5,500:1</span>
        <span>3,000:1</span>
      </div>
      <div className="gauge-labels">
        <span className="label-poor">Poor</span>
        <span className="label-good">Good</span>
        <span className="label-excellent">Excellent</span>
      </div>
    </div>
  );
}
