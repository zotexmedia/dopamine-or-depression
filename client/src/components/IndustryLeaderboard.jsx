import React, { useState, useEffect } from 'react';
import api from '../api';

export default function IndustryLeaderboard({ startDate, endDate }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const source = sourceFilter === 'all' ? null : sourceFilter;
        const data = await api.getIndustryLeaderboard(startDate, endDate, source, 10);
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [startDate, endDate, sourceFilter]);

  return (
    <div className="industry-leaderboard">
      <div className="leaderboard-header">
        <h3>Top Industries by ETL</h3>
        <div className="leaderboard-filter">
          <button
            className={`filter-btn ${sourceFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSourceFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${sourceFilter === 'apollo' ? 'active' : ''}`}
            onClick={() => setSourceFilter('apollo')}
          >
            Apollo
          </button>
          <button
            className={`filter-btn ${sourceFilter === 'gmaps' ? 'active' : ''}`}
            onClick={() => setSourceFilter('gmaps')}
          >
            GMaps
          </button>
          <button
            className={`filter-btn ${sourceFilter === 'industry_specific' ? 'active' : ''}`}
            onClick={() => setSourceFilter('industry_specific')}
          >
            Industry Specific
          </button>
        </div>
      </div>

      {loading ? (
        <div className="leaderboard-empty">Loading...</div>
      ) : leaderboard.length === 0 ? (
        <div className="leaderboard-empty">
          No industry data yet. Add leads with industry tags to see the leaderboard.
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((industry, index) => (
            <div key={industry.id} className="leaderboard-item">
              <span className="leaderboard-rank">#{index + 1}</span>
              <span className="leaderboard-industry" title={industry.name}>
                {industry.name}
              </span>
              <span className="leaderboard-leads">{industry.leads} leads</span>
              <span className="leaderboard-etl">{industry.etlRatio.toLocaleString()}:1</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
