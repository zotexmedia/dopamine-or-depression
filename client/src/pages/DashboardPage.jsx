import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from '../components/Dashboard';
import api from '../api';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [rangeMetrics, setRangeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await api.getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch metrics for date range when selected
  const fetchRangeMetrics = useCallback(async (start, end) => {
    if (!start) {
      setRangeMetrics(null);
      return;
    }

    try {
      const data = await api.getMetricsForRange(start, end || start);
      setRangeMetrics(data);
    } catch (err) {
      console.error('Failed to fetch range metrics:', err);
      setRangeMetrics(null);
    }
  }, []);

  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    fetchRangeMetrics(start, end);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.refreshMetrics();
      await fetchMetrics();
      if (startDate) {
        await fetchRangeMetrics(startDate, endDate);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="page-error">
        <h2>Failed to load dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchMetrics}>Retry</button>
      </div>
    );
  }

  return (
    <main className="dashboard-page">
      <Dashboard
        metrics={metrics}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        rangeMetrics={rangeMetrics}
      />
    </main>
  );
}
