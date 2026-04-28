// Incidents.js
import React, { useState, useEffect } from 'react';
import { incidentAPI } from '../services/api';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => { incidentAPI.getAll().then(r => setIncidents(r.data)).catch(console.error); }, []);

  const resolve = async (id) => {
    try { await incidentAPI.resolve(id); setIncidents(prev => prev.map(i => i._id === id ? { ...i, resolved: true } : i)); }
    catch (err) { alert('Error resolving'); }
  };

  const sev = (s) => ({ low:'badge-blue', medium:'badge-amber', high:'badge-red', critical:'badge-red' }[s] || 'badge-gray');

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Incident Log</h1><p className="page-sub">All system incidents and alerts</p></div>
      <div className="card">
        {incidents.length === 0 ? <div className="empty-state"><h3>No incidents</h3><p>System is healthy</p></div> :
          <table>
            <thead><tr><th>Type</th><th>Server</th><th>Severity</th><th>Load</th><th>Description</th><th>Status</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {incidents.map(inc => (
                <tr key={inc._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{inc.type}</td>
                  <td style={{ fontFamily: 'monospace' }}>{inc.server?.name}</td>
                  <td><span className={`badge ${sev(inc.severity)}`}>{inc.severity}</span></td>
                  <td>{inc.loadAtTime ? `${Math.round(inc.loadAtTime)}%` : '—'}</td>
                  <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 200 }}>{inc.description}</td>
                  <td><span className={`badge ${inc.resolved ? 'badge-green' : 'badge-red'}`}>{inc.resolved ? 'resolved' : 'open'}</span></td>
                  <td style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(inc.createdAt).toLocaleString()}</td>
                  <td>{!inc.resolved && <button className="btn btn-success" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => resolve(inc._id)}>Resolve</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}
