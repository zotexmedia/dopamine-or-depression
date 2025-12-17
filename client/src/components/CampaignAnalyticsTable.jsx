import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import DatePicker from './DatePicker';

const COLUMNS = [
  { key: 'campaign_name', label: 'Campaign', sortable: true },
  { key: 'emails_sent_count', label: 'Sent', sortable: true },
  { key: 'contacted_count', label: 'Contacted', sortable: true },
  { key: 'reply_count', label: 'Replies', sortable: true },
  { key: 'reply_rate', label: 'Reply Rate', sortable: true, computed: true },
  { key: 'bounced_count', label: 'Bounced', sortable: true },
  { key: 'bounce_rate', label: 'Bounce Rate', sortable: true, computed: true },
];

// Get today's date as YYYY-MM-DD
const getToday = () => new Date().toISOString().split('T')[0];

export default function CampaignAnalyticsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'emails_sent_count', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Date range state - default to today
  const [dateStart, setDateStart] = useState(getToday());
  const [dateEnd, setDateEnd] = useState(getToday());

  const handleDateChange = (start, end) => {
    setDateStart(start || '');
    setDateEnd(end || '');
  };

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getCampaignAnalytics(dateStart || undefined, dateEnd || undefined);
        if (response.success) {
          setData(response.data || []);
        } else {
          setError(response.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateStart, dateEnd]);

  // Add computed rates to data
  const dataWithRates = useMemo(() => {
    return data.map(row => ({
      ...row,
      reply_rate: row.emails_sent_count > 0 ? (row.reply_count / row.emails_sent_count) * 100 : 0,
      bounce_rate: row.emails_sent_count > 0 ? (row.bounced_count / row.emails_sent_count) * 100 : 0,
    }));
  }, [data]);

  // Filter by search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return dataWithRates;
    const term = searchTerm.toLowerCase();
    return dataWithRates.filter(row =>
      row.campaign_name?.toLowerCase().includes(term)
    );
  }, [dataWithRates, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!filteredData.length) return [];

    const sorted = [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle string sorting (campaign name)
      if (sortConfig.key === 'campaign_name') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredData.length) return {};

    const emails_sent_count = filteredData.reduce((sum, row) => sum + (row.emails_sent_count || 0), 0);
    const contacted_count = filteredData.reduce((sum, row) => sum + (row.contacted_count || 0), 0);
    const reply_count = filteredData.reduce((sum, row) => sum + (row.reply_count || 0), 0);
    const bounced_count = filteredData.reduce((sum, row) => sum + (row.bounced_count || 0), 0);

    return {
      emails_sent_count,
      contacted_count,
      reply_count,
      bounced_count,
      reply_rate: emails_sent_count > 0 ? (reply_count / emails_sent_count) * 100 : 0,
      bounce_rate: emails_sent_count > 0 ? (bounced_count / emails_sent_count) * 100 : 0,
    };
  }, [filteredData]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '0.00%';
    return num.toFixed(2) + '%';
  };

  if (loading) {
    return (
      <div className="campaign-analytics-section">
        <div className="analytics-header">
          <h3>Campaign Analytics</h3>
        </div>
        <div className="analytics-loading">
          <div className="loading-spinner" />
          <span>Loading campaigns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campaign-analytics-section">
        <div className="analytics-header">
          <h3>Campaign Analytics</h3>
        </div>
        <div className="analytics-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-analytics-section">
      <div className="analytics-header">
        <h3>Campaign Analytics</h3>
        <div className="analytics-info">
          <span className="analytics-count">{filteredData.length} campaigns</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="analytics-filters">
        {/* Search */}
        <div className="analytics-search">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              &times;
            </button>
          )}
        </div>

        {/* Date Range */}
        <DatePicker
          startDate={dateStart}
          endDate={dateEnd}
          onChange={handleDateChange}
          maxDate={getToday()}
        />
      </div>

      {/* Summary cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <span className="summary-value">{formatNumber(totals.emails_sent_count)}</span>
          <span className="summary-label">Total Sent</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{formatNumber(totals.reply_count)}</span>
          <span className="summary-label">Total Replies</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{formatPercent(totals.reply_rate)}</span>
          <span className="summary-label">Reply Rate</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{formatPercent(totals.bounce_rate)}</span>
          <span className="summary-label">Bounce Rate</span>
        </div>
      </div>

      {/* Data table */}
      <div className="analytics-table-wrapper">
        <table className="analytics-table">
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`${col.sortable ? 'sortable' : ''} ${sortConfig.key === col.key ? 'sorted' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="th-content">
                    {col.label}
                    {col.sortable && (
                      <span className="sort-icon">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'desc' ? '↓' : '↑'
                        ) : '↕'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="no-data">
                  {searchTerm ? 'No campaigns match your search' : 'No campaign data available'}
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr key={row.campaign_id || idx}>
                  <td className="campaign-cell" title={row.campaign_name}>
                    {row.campaign_name || 'Unnamed Campaign'}
                  </td>
                  <td className="number-cell">{formatNumber(row.emails_sent_count)}</td>
                  <td className="number-cell">{formatNumber(row.contacted_count)}</td>
                  <td className="number-cell highlight-replies">{formatNumber(row.reply_count)}</td>
                  <td className="number-cell rate-cell">{formatPercent(row.reply_rate)}</td>
                  <td className="number-cell highlight-bounced">{formatNumber(row.bounced_count)}</td>
                  <td className="number-cell rate-cell bounce">{formatPercent(row.bounce_rate)}</td>
                </tr>
              ))
            )}
          </tbody>
          {sortedData.length > 0 && (
            <tfoot>
              <tr className="totals-row">
                <td className="campaign-cell">Totals ({filteredData.length})</td>
                <td className="number-cell">{formatNumber(totals.emails_sent_count)}</td>
                <td className="number-cell">{formatNumber(totals.contacted_count)}</td>
                <td className="number-cell highlight-replies">{formatNumber(totals.reply_count)}</td>
                <td className="number-cell rate-cell">{formatPercent(totals.reply_rate)}</td>
                <td className="number-cell highlight-bounced">{formatNumber(totals.bounced_count)}</td>
                <td className="number-cell rate-cell bounce">{formatPercent(totals.bounce_rate)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
