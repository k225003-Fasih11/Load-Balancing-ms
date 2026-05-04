import React, { useState, useEffect } from 'react';
import { incidentAPI } from '../services/api';

export default function Incidents() {
  const [incidents, setIncidents]       = useState([]);
  const [search, setSearch]             = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    incidentAPI.getAll().then(r => setIncidents(r.data)).catch(console.error);
  }, []);

  const resolve = async (id) => {
    try {
      await incidentAPI.resolve(id);
      setIncidents(prev => prev.map(i => i._id === id ? { ...i, resolved: true } : i));
    } catch { alert('Error resolving incident'); }
  };

  const resolveAll = async () => {
    if (!window.confirm('Resolve all open incidents?')) return;
    const open = incidents.filter(i => !i.resolved);
    for (const inc of open) {
      try { await incidentAPI.resolve(inc._id); } catch { break; }
    }
    setIncidents(prev => prev.map(i => ({ ...i, resolved: true })));
  };

  const sevColor  = (s) => ({ low: 'badge-blue', medium: 'badge-amber', high: 'badge-red', critical: 'badge-red' }[s] || 'badge-gray');
  const typeColor = (t) => ({ overload: 'badge-red', failure: 'badge-red', threshold_breach: 'badge-amber', recovery: 'badge-green' }[t] || 'badge-gray');

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = (i.server?.name || '').toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.type.toLowerCase().includes(q);
    const matchSev    = filterSeverity === 'all' || i.severity === filterSeverity;
    const matchType   = filterType === 'all' || i.type === filterType;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'open' ? !i.resolved : i.resolved);
    return matchSearch && matchSev && matchType && matchStatus;
  });

  const openCount     = incidents.filter(i => !i.resolved).length;
  const resolvedCount = incidents.filter(i => i.resolved).length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Incident Log</h1>
          <p className="page-sub">
            {incidents.length} total &nbsp;·&nbsp;
            <span style={{ color: openCount > 0 ? '#A32D2D' : '#3B6D11' }}>{openCount} open</span>
            &nbsp;·&nbsp; {resolvedCount} resolved &nbsp;·&nbsp;
            <span style={{ color: criticalCount > 0 ? '#A32D2D' : '#6b7280' }}>{criticalCount} high/critical</span>
          </p>
        </div>
        {openCount > 0 && (
          <button className="btn btn-success" onClick={resolveAll}>✓ Resolve All Open</button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card red">
          <div className="stat-label">Open</div>
          <div className="stat-value">{openCount}</div>
          <div className="stat-sub">unresolved</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{resolvedCount}</div>
          <div className="stat-sub">fixed</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">High / Critical</div>
          <div className="stat-value">{criticalCount}</div>
          <div className="stat-sub">need attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{incidents.length}</div>
          <div className="stat-sub">all time</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          className="form-input" style={{ flex: 1, minWidth: 200 }}
          placeholder="🔍  Search by server name, type, or description..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="form-select" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open Only</option>
          <option value="resolved">Resolved Only</option>
        </select>
        <select className="form-select" style={{ width: 150 }} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
          <option value="all">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select className="form-select" style={{ width: 170 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="overload">Overload</option>
          <option value="failure">Failure</option>
          <option value="threshold_breach">Threshold Breach</option>
          <option value="recovery">Recovery</option>
        </select>
        {(search || filterSeverity !== 'all' || filterType !== 'all' || filterStatus !== 'all') && (
          <button className="btn" style={{ fontSize: 12 }} onClick={() => { setSearch(''); setFilterSeverity('all'); setFilterType('all'); setFilterStatus('all'); }}>
            ✕ Clear Filters
          </button>
        )}
      </div>

      {(search || filterSeverity !== 'all' || filterType !== 'all' || filterStatus !== 'all') && (
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          Showing {filtered.length} of {incidents.length} incidents
        </p>
      )}

      {/* Incidents Table */}
      <div className="card">
        {filtered.length === 0
          ? <div className="empty-state"><h3>No incidents found</h3><p>Try adjusting your filters</p></div>
          : <table>
              <thead>
                <tr><th>Type</th><th>Server</th><th>Severity</th><th>Load at Time</th><th>Description</th><th>Status</th><th>Time</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(inc => (
                  <tr key={inc._id}>
                    <td><span className={`badge ${typeColor(inc.type)}`} style={{ fontSize: 11 }}>{inc.type.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: 12 }}>{inc.server?.name}</td>
                    <td><span className={`badge ${sevColor(inc.severity)}`}>{inc.severity}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{inc.loadAtTime ? `${Math.round(inc.loadAtTime)}%` : '—'}</td>
                    <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 200 }}>{inc.description}</td>
                    <td><span className={`badge ${inc.resolved ? 'badge-green' : 'badge-red'}`}>{inc.resolved ? 'resolved' : 'open'}</span></td>
                    <td style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(inc.createdAt).toLocaleString()}</td>
                    <td>
                      {!inc.resolved && (
                        <button className="btn btn-success" style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }} onClick={() => resolve(inc._id)}>
                          ✓ Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}
