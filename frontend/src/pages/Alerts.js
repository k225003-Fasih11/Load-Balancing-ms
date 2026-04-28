import React, { useState, useEffect } from 'react';
import { alertAPI, serverAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', server: '', metric: 'load', operator: 'gt', threshold: 80 };

export default function Alerts() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [alerts, setAlerts]   = useState([]);
  const [servers, setServers] = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [error, setError]     = useState('');

  useEffect(() => {
    alertAPI.getAll().then(r => setAlerts(r.data)).catch(console.error);
    serverAPI.getAll().then(r => setServers(r.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try { await alertAPI.create(form); const r = await alertAPI.getAll(); setAlerts(r.data); setModal(false); setForm(emptyForm); }
    catch (err) { setError(err.response?.data?.message || 'Error creating alert'); }
  };

  const handleDelete = async (id) => {
    try { await alertAPI.delete(id); setAlerts(prev => prev.filter(a => a._id !== id)); }
    catch { alert('Error deleting'); }
  };

  const toggle = async (id, isActive) => {
    try { await alertAPI.update(id, { isActive: !isActive }); setAlerts(prev => prev.map(a => a._id === id ? { ...a, isActive: !isActive } : a)); }
    catch { alert('Error updating'); }
  };

  const opLabel = { gt: '>', lt: '<', gte: '≥', lte: '≤' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Alert Management</h1><p className="page-sub">Configure threshold-based alerts for your servers</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setError(''); setModal(true); }}>+ New Alert</button>}
      </div>
      <div className="card">
        {alerts.length === 0 ? <div className="empty-state"><h3>No alerts configured</h3><p>Create alerts to get notified when thresholds are breached</p></div> :
          <table>
            <thead><tr><th>Name</th><th>Server</th><th>Condition</th><th>Status</th><th>Last Triggered</th>{isAdmin && <th></th>}</tr></thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a._id}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.server?.name || 'All servers'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.metric} {opLabel[a.operator]} {a.threshold}</td>
                  <td><span className={`badge ${a.isActive ? 'badge-green' : 'badge-gray'}`}>{a.isActive ? 'active' : 'disabled'}</span></td>
                  <td style={{ fontSize: 11, color: '#9ca3af' }}>{a.lastTriggered ? new Date(a.lastTriggered).toLocaleString() : 'Never'}</td>
                  {isAdmin && <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggle(a._id, a.isActive)}>{a.isActive ? 'Disable' : 'Enable'}</button>
                    <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleDelete(a._id)}>Delete</button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">New Alert</h2>
            {error && <div className="alert-box alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Alert Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Server (optional)</label>
                <select className="form-select" value={form.server} onChange={e => setForm({ ...form, server: e.target.value })}>
                  <option value="">All servers</option>
                  {servers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group"><label className="form-label">Metric</label>
                  <select className="form-select" value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })}>
                    <option value="load">Load %</option><option value="response_time">Response Time</option>
                    <option value="connections">Connections</option><option value="uptime">Uptime %</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Operator</label>
                  <select className="form-select" value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}>
                    <option value="gt">&gt;</option><option value="gte">≥</option>
                    <option value="lt">&lt;</option><option value="lte">≤</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Threshold</label>
                  <input className="form-input" type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
