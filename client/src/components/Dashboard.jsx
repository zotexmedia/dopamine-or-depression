import React from 'react';
import MetricCard from './MetricCard';
import TimeSelector from './TimeSelector';
import RatioGauge from './RatioGauge';
import TrendChart from './TrendChart';
import DatePicker from './DatePicker';
import MoodIndicator from './MoodIndicator';
import IndustryLeaderboard from './IndustryLeaderboard';

export default function Dashboard({
  metrics,
  selectedPeriod,
  onPeriodChange,
  onRefresh,
  isRefreshing,
  startDate,
  endDate,
  onDateRangeChange,
  rangeMetrics
}) {
  // Use rangeMetrics if a date range is selected, otherwise use period metrics
  const currentMetrics = startDate && rangeMetrics
    ? rangeMetrics
    : (metrics?.periods?.[selectedPeriod] || {});
  const trend = metrics?.trend || [];
  const lastSyncedAt = metrics?.lastSyncedAt;

  // Format last synced time
  const formatSyncTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  // Format large numbers compactly
  const formatCompact = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toLocaleString();
  };

  const periodLabels = {
    day: 'Today',
    yesterday: 'Yesterday',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    allTime: 'All Time'
  };

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-brand">
          <img src="/logo.png" alt="dopamine or depression" className="brand-logo-img" />
          <span className="brand-section">dopamine or depression</span>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{formatCompact(currentMetrics.sends)}</span>
            <span className="hero-stat-label">emails sent</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">{currentMetrics.leads || 0}</span>
            <span className="hero-stat-label">leads generated</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat primary">
            <span className="hero-stat-value">
              {currentMetrics.sendsPerLead ? `${currentMetrics.sendsPerLead.toLocaleString()}:1` : '—'}
            </span>
            <span className="hero-stat-label">etl ratio</span>
          </div>
        </div>

        <div className="hero-actions">
          <div className="sync-badge">
            <span className="sync-dot" />
            <span className="sync-text">Synced {formatSyncTime(lastSyncedAt)}</span>
          </div>
          <button
            className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="refresh-icon">
              <path d="M13.65 2.35A8 8 0 1 0 16 8h-2a6 6 0 1 1-1.76-4.24L10 6h6V0l-2.35 2.35z" fill="currentColor"/>
            </svg>
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Period Navigation */}
      <div className="period-nav">
        <div className="period-controls">
          <TimeSelector
            selected={startDate ? null : selectedPeriod}
            onChange={(period) => {
              onDateRangeChange(null, null); // Clear range when selecting a period
              onPeriodChange(period);
            }}
          />
          <DatePicker
            startDate={startDate}
            endDate={endDate}
            onChange={onDateRangeChange}
            maxDate={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="period-context">
          <span className="period-label">
            {startDate
              ? (startDate === endDate
                  ? new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })
                  : `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
              : periodLabels[selectedPeriod]}
          </span>
        </div>
      </div>

      {/* Mood Indicator - shows dopamine or depression based on lead targets */}
      {!startDate && (
        <MoodIndicator
          leads={currentMetrics.leads || 0}
          period={selectedPeriod}
        />
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          label="Total Sends"
          value={currentMetrics.sends}
          format="number"
          accentColor="sends"
          icon="📧"
        />
        <MetricCard
          label="Total Leads"
          value={currentMetrics.leads}
          format="number"
          accentColor="leads"
          icon="👤"
        />
        <MetricCard
          label="ETL Ratio"
          value={currentMetrics.sendsPerLead}
          format="etl"
          accentColor="ratio"
          icon="📊"
        />
        <MetricCard
          label="Conversion Rate"
          value={currentMetrics.etlRatio}
          format="ratio"
          accentColor="inverse"
          icon="🎯"
        />
      </div>

      {/* Charts Section */}
      <div className="dashboard-lower">
        <RatioGauge sendsPerLead={currentMetrics.sendsPerLead} />
        <TrendChart data={trend} dataKey="etlRatio" />
      </div>

      {/* Industry Leaderboard */}
      <IndustryLeaderboard startDate={startDate} endDate={endDate} />
    </div>
  );
}
