import React from 'react';

export default function MoodIndicator({ leads, period }) {
  // Thresholds for each period
  const thresholds = {
    day: 20,
    yesterday: 20,
    week: 100,
    month: 440
  };

  const threshold = thresholds[period];

  // If no threshold for this period (year, allTime), don't show
  if (!threshold) return null;

  const isHappy = leads >= threshold;
  const mood = isHappy ? 'happy' : 'sad';
  const imageSrc = isHappy ? '/mood-happy.png' : '/mood-sad.png';

  const periodLabels = {
    day: 'today',
    yesterday: 'yesterday',
    week: 'this week',
    month: 'this month'
  };

  const getMessage = () => {
    if (isHappy) {
      const surplus = leads - threshold;
      return `+${surplus} above target`;
    } else {
      const deficit = threshold - leads;
      if (period === 'day' || period === 'yesterday') {
        return `${deficit} below target`;
      }
      return `${deficit} more to go`;
    }
  };

  return (
    <div className={`mood-indicator ${mood}`}>
      <div className="mood-image-container">
        <img src={imageSrc} alt={isHappy ? 'Dopamine!' : 'Depression...'} className="mood-image" />
      </div>
      <div className="mood-info">
        <span className="mood-status">{isHappy ? 'dopamine' : 'depression'}</span>
        <span className="mood-message">{getMessage()}</span>
        <span className="mood-target">{threshold} leads {periodLabels[period]}</span>
      </div>
    </div>
  );
}
