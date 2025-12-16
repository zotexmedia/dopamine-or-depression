import React, { useState, useEffect, useCallback } from 'react';
import api, { setToken } from '../api';

// Login form component
function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(password);
      setToken(result.token);
      onLogin();
    } catch (err) {
      setError(err.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Access</h2>
        <p className="login-subtitle">Enter password to access lead input</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading || !password}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Lead input form component
function LeadInputForm({ onLogout }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('apollo');
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [industrySearch, setIndustrySearch] = useState('');
  const [leadCount, setLeadCount] = useState('');
  const [notes, setNotes] = useState('');
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchIndustries = useCallback(async () => {
    try {
      const data = await api.getIndustries();
      setIndustries(data);
    } catch (err) {
      console.error('Failed to fetch industries:', err);
    }
  }, []);

  const fetchRecentEntries = useCallback(async () => {
    try {
      const entries = await api.getRecentEntries(7);
      setRecentEntries(entries);
    } catch (err) {
      console.error('Failed to fetch recent entries:', err);
    }
  }, []);

  useEffect(() => {
    fetchIndustries();
    fetchRecentEntries();
  }, [fetchIndustries, fetchRecentEntries]);

  const filteredIndustries = industries.filter(ind =>
    ind.name.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const selectedIndustryName = industries.find(i => i.id === parseInt(selectedIndustry))?.name || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (selectedIndustry) {
        // Submit industry-specific leads
        await api.submitIndustryLeads(
          parseInt(selectedIndustry),
          date,
          parseInt(leadCount, 10),
          source,
          notes || undefined
        );
        setSuccess(`Added ${leadCount} leads for ${selectedIndustryName} (${source}) on ${date}`);
      } else {
        // Legacy: submit total leads (no industry)
        const result = await api.submitLeads(parseInt(leadCount, 10), date, notes || undefined);
        setSuccess(`Updated ${result.date}: ${result.previousLeadCount} → ${result.newLeadCount} leads`);
      }

      setLeadCount('');
      setNotes('');
      setSelectedIndustry('');
      setIndustrySearch('');
      fetchRecentEntries();
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('expired')) {
        setToken(null);
        window.location.reload();
      } else {
        setError(err.message || 'Failed to submit');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    onLogout();
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Lead Input</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-content">
        <div className="input-card">
          <h3>Submit Industry Leads</h3>

          <form onSubmit={handleSubmit}>
            {/* Source Toggle */}
            <div className="form-group">
              <label>Source</label>
              <div className="source-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${source === 'apollo' ? 'active' : ''}`}
                  onClick={() => setSource('apollo')}
                >
                  Apollo
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${source === 'gmaps' ? 'active' : ''}`}
                  onClick={() => setSource('gmaps')}
                >
                  GMaps
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${source === 'industry_specific' ? 'active' : ''}`}
                  onClick={() => setSource('industry_specific')}
                >
                  Industry Specific
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="leadCount">Lead Count</label>
                <input
                  type="number"
                  id="leadCount"
                  value={leadCount}
                  onChange={(e) => setLeadCount(e.target.value)}
                  placeholder="e.g. 5"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Industry Selector */}
            <div className="form-group industry-selector">
              <label htmlFor="industry">Industry</label>
              <div className="industry-input-wrapper">
                <input
                  type="text"
                  id="industry"
                  value={selectedIndustry ? selectedIndustryName : industrySearch}
                  onChange={(e) => {
                    setIndustrySearch(e.target.value);
                    setSelectedIndustry('');
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search industries..."
                  autoComplete="off"
                />
                {selectedIndustry && (
                  <button
                    type="button"
                    className="clear-industry"
                    onClick={() => {
                      setSelectedIndustry('');
                      setIndustrySearch('');
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {showDropdown && !selectedIndustry && (
                <div className="industry-dropdown">
                  {filteredIndustries.slice(0, 15).map(ind => (
                    <div
                      key={ind.id}
                      className="industry-option"
                      onClick={() => {
                        setSelectedIndustry(ind.id.toString());
                        setIndustrySearch('');
                        setShowDropdown(false);
                      }}
                    >
                      <span className="industry-name">{ind.name}</span>
                      <span className="industry-pct">{parseFloat(ind.send_percentage || 0).toFixed(2)}%</span>
                    </div>
                  ))}
                  {filteredIndustries.length === 0 && (
                    <div className="industry-option disabled">No industries found</div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. High quality leads from trade show"
                rows="2"
              />
            </div>

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <button type="submit" className="submit-btn" disabled={loading || !leadCount}>
              {loading ? 'Submitting...' : 'Submit Leads'}
            </button>
          </form>
        </div>

        <div className="recent-card">
          <h3>Recent Entries (Last 7 Days)</h3>

          {recentEntries.length === 0 ? (
            <p className="no-entries">No entries yet</p>
          ) : (
            <table className="entries-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sends</th>
                  <th>Leads</th>
                  <th>ETL Ratio</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.date}>
                    <td>{entry.date}</td>
                    <td>{entry.sends.toLocaleString()}</td>
                    <td>{entry.leads.toLocaleString()}</td>
                    <td>{entry.sendsPerLead ? `${entry.sendsPerLead.toLocaleString()}:1` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Admin Page
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if we have a valid token
    const checkAuth = async () => {
      try {
        const result = await api.verifyToken();
        setIsAuthenticated(result.authenticated);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <main className="admin-page">
      {isAuthenticated ? (
        <LeadInputForm onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      )}
    </main>
  );
}
