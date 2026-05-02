import React, { useState } from 'react';
import { reportAPI } from '../services/api';

export default function Reports() {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try { const r = await reportAPI.summary(); setReport(r.data); }
    catch (err) { alert('Error generating report — make sure servers exist'); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!report) return;
    const headers = ['Server Name', 'Status', 'Load (%)', 'Uptime (%)'];
    const rows = report.servers.map(s => [s.name, s.status, Math.round(s.load), s.uptime]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `lbms-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `lbms-report-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Performance Reports</h1>
          <p className="page-sub">Generate and export system summary reports</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {report && (
            <>
              <button className="btn btn-success" onClick={exportCSV}>⬇ Export CSV</button>
              <button className="btn" onClick={exportJSON}>⬇ Export JSON</button>
            </>
          )}
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? 'Generating...' : '⚙ Generate Report'}
          </button>
        </div>
      </div>

      {!report ? (
        <div className="card">
          <div className="empty-state">
            <h3>No report generated yet</h3>
            <p>Click Generate Report to create a full system summary</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total Servers</div><div className="stat-value">{report.summary.totalServers}</div></div>
            <div className="stat-card amber"><div className="stat-label">Avg Load</div><div className="stat-value">{report.summary.avgLoad}%</div></div>
            <div className="stat-card red"><div className="stat-label">Total Incidents</div><div className="stat-value">{report.summary.totalIncidents}</div></div>
            <div className="stat-card green"><div className="stat-label">Resolved</div><div className="stat-value">{report.summary.resolvedIncidents}</div></div>
          </div>

          {/* Server Table */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Server Performance Summary</h3>
              <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{report.servers.length} servers</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Server Name</th><th>Status</th><th>Current Load</th><th>Load Bar</th><th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {report.servers.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{s.name}</td>
                    <td><span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td>
                    <td style={{ fontFamily: 'monospace' }}>{Math.round(s.load)}%</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, s.load)}%`, background: s.load > 85 ? '#A32D2D' : s.load > 65 ? '#BA7517' : '#3B6D11', borderRadius: 3 }} />
                      </div>
                    </td>
                    <td>{s.uptime}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Incidents Summary */}
          {report.incidents?.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Incidents</h3>
              <table>
                <thead><tr><th>Type</th><th>Server</th><th>Severity</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {report.incidents.slice(0, 10).map((inc, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{inc.type}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{inc.server?.name}</td>
                      <td><span className={`badge ${inc.severity === 'high' || inc.severity === 'critical' ? 'badge-red' : 'badge-amber'}`}>{inc.severity}</span></td>
                      <td><span className={`badge ${inc.resolved ? 'badge-green' : 'badge-red'}`}>{inc.resolved ? 'resolved' : 'open'}</span></td>
                      <td style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(inc.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>
            Generated by <strong>{report.generatedBy}</strong> at {new Date(report.generatedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
