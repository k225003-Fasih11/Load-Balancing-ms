import React, { useState, useEffect } from 'react';
import { activityAPI } from '../services/api';

export default function ActivityLog() {
  const [logs, setLogs]     = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => { activityAPI.getAll().then(r => setLogs(r.data)).catch(console.error); }, []);

  const actionColor = (a) => ({ LOGIN:'badge-blue', CREATE:'badge-green', UPDATE:'badge-amber', DELETE:'badge-red' }[a] || 'badge-gray');

  const filtered = filter ? logs.filter(l => l.action === filter || l.resource === filter) : logs;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Activity Log</h1><p className="page-sub">Track all user actions in the system</p></div>
        <select className="form-select" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All actions</option>
          <option value="LOGIN">Login</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
      </div>
      <div className="card">
        {filtered.length === 0 ? <div className="empty-state"><h3>No activity logs</h3></div> :
          <table>
            <thead><tr><th>User</th><th>Action</th><th>Resource</th><th>Details</th><th>IP</th><th>Time</th></tr></thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l._id}>
                  <td style={{ fontWeight: 500 }}>{l.user?.name}<div style={{ fontSize: 11, color: '#9ca3af' }}>{l.user?.email}</div></td>
                  <td><span className={`badge ${actionColor(l.action)}`}>{l.action}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.resource}</td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{l.details}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{l.ip}</td>
                  <td style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}
