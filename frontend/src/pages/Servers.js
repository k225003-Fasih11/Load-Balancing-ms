import React, { useState, useEffect } from 'react';
import { serverAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', ipAddress: '', port: 3000, weight: 1, capacity: 100, status: 'active', location: 'default' };

export default function Servers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [servers, setServers]           = useState([]);
  const [modal, setModal]               = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [error, setError]               = useState('');
  const [simResult, setSimResult]       = useState(null);
  const [simAlgo, setSimAlgo]           = useState('round_robin');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy]             = useState('name');
  const [simCount, setSimCount]         = useState(0);

  useEffect(() => { fetchServers(); }, []);

  const fetchServers = async () => {
    try { const res = await serverAPI.getAll(); setServers(res.data); }
    catch (err) { console.error(err); }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setModal(true); };
  const openEdit   = (s) => {
    setEditing(s._id);
    setForm({ name: s.name, ipAddress: s.ipAddress, port: s.port, weight: s.weight, capacity: s.capacity, status: s.status, location: s.location });
    setError(''); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await serverAPI.update(editing, form);
      else await serverAPI.create(form);
      setModal(false); fetchServers();
    } catch (err) { setError(err.response?.data?.message || 'Error saving server'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this server?')) return;
    try { await serverAPI.delete(id); fetchServers(); }
    catch (err) { alert(err.response?.data?.message || 'Error deleting'); }
  };

  const handleSimulate = async () => {
    try {
      const res = await serverAPI.simulate({ algorithm: simAlgo });
      setSimResult(res.data); setSimCount(prev => prev + 1); fetchServers();
    } catch (err) { alert(err.response?.data?.message || 'Simulation error'); }
  };

  const handleBulkSimulate = async () => {
    for (let i = 0; i < 10; i++) {
      try { await serverAPI.simulate({ algorithm: simAlgo }); } catch { break; }
    }
    setSimCount(prev => prev + 10);
    setSimResult({ routed_to: 'multiple', load: 0, algorithm: simAlgo, bulk: true });
    fetchServers();
  };

  const loadColor  = (l) => l > 85 ? '#A32D2D' : l > 65 ? '#BA7517' : '#3B6D11';
  const statusBadge = (s) => ({ active: 'badge-green', inactive: 'badge-gray', maintenance: 'badge-amber' }[s]);

  const filteredServers = servers
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) ||
        s.ipAddress.toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name')        return a.name.localeCompare(b.name);
      if (sortBy === 'load')        return b.currentLoad - a.currentLoad;
      if (sortBy === 'connections') return b.connections - a.connections;
      if (sortBy === 'response')    return b.responseTime - a.responseTime;
      return 0;
    });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Server Management</h1>
          <p className="page-sub">
            {servers.length} total &nbsp;·&nbsp; {servers.filter(s => s.status === 'active').length} active &nbsp;·&nbsp;
            <span style={{ color: servers.filter(s => s.currentLoad > 85).length > 0 ? '#A32D2D' : '#3B6D11' }}>
              {servers.filter(s => s.currentLoad > 85).length} overloaded
            </span>
          </p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ Add Server</button>}
      </div>

      {/* Simulation Panel */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Request Routing Simulation</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 200 }} value={simAlgo} onChange={e => setSimAlgo(e.target.value)}>
            <option value="round_robin">Round Robin</option>
            <option value="least_connections">Least Connections</option>
            <option value="ai_predict">AI Predict</option>
          </select>
          <button className="btn btn-primary" onClick={handleSimulate}>Send 1 Request</button>
          <button className="btn" onClick={handleBulkSimulate}>Send 10 Requests</button>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
            Total sent this session: <strong>{simCount}</strong>
          </div>
        </div>
        {simResult && (
          <div style={{ marginTop: 10, background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: 6, padding: '8px 14px', fontSize: 13 }}>
            {simResult.bulk
              ? <>✓ Bulk routed <strong>10 requests</strong> via <strong>{simResult.algorithm?.replace(/_/g, ' ')}</strong></>
              : <>✓ Routed to <strong style={{ fontFamily: 'monospace' }}>{simResult.routed_to}</strong> — Load: {Math.round(simResult.load)}% via <strong>{simResult.algorithm?.replace(/_/g, ' ')}</strong></>
            }
          </div>
        )}
      </div>

      {/* Search + Filter + Sort Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          className="form-input" style={{ flex: 1, minWidth: 200 }}
          placeholder="🔍  Search by name, IP address, or location..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="form-select" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select className="form-select" style={{ width: 190 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Sort: Name (A-Z)</option>
          <option value="load">Sort: Load (Highest)</option>
          <option value="connections">Sort: Connections</option>
          <option value="response">Sort: Response Time</option>
        </select>
        {search && <button className="btn" onClick={() => setSearch('')} style={{ fontSize: 12 }}>✕ Clear</button>}
      </div>

      {search && (
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          Showing {filteredServers.length} of {servers.length} servers for "{search}"
        </p>
      )}

      {/* Server Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filteredServers.map(s => (
          <div key={s._id} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.ipAddress}:{s.port}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>📍 {s.location || 'default'}</div>
              </div>
              <span className={`badge ${statusBadge(s.status)}`}>{s.status}</span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                <span>Load</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: loadColor(s.currentLoad) }}>
                  {Math.round(s.currentLoad)}%
                </span>
              </div>
              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, s.currentLoad)}%`, background: loadColor(s.currentLoad), borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#6b7280' }}>
              <div>Connections: <strong>{s.connections}</strong></div>
              <div>Response: <strong>{Math.round(s.responseTime)}ms</strong></div>
              <div>Uptime: <strong>{s.uptime}%</strong></div>
              <div>Weight: <strong>{s.weight}</strong></div>
            </div>

            {isAdmin && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn" style={{ flex: 1, fontSize: 12 }} onClick={() => openEdit(s)}>Edit</button>
                <button className="btn btn-danger" style={{ fontSize: 12 }} onClick={() => handleDelete(s._id)}>Delete</button>
              </div>
            )}
          </div>
        ))}

        {filteredServers.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <h3>{search ? `No servers match "${search}"` : 'No servers yet'}</h3>
              <p>{search ? 'Try a different search term or clear the filter' : 'Add your first server to get started'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? 'Edit Server' : 'Add Server'}</h2>
            {error && <div className="alert-box alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Server Name', key: 'name', type: 'text' },
                  { label: 'IP Address', key: 'ipAddress', type: 'text' },
                  { label: 'Port', key: 'port', type: 'number' },
                  { label: 'Weight', key: 'weight', type: 'number' },
                  { label: 'Capacity (%)', key: 'capacity', type: 'number' },
                  { label: 'Location', key: 'location', type: 'text' },
                ].map(f => (
                  <div className="form-group" key={f.key} style={{ margin: 0 }}>
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
                  </div>
                ))}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Server'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
