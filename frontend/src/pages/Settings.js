import React, { useState } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [name, setName]     = useState(user?.name || '');
  const [notifs, setNotifs] = useState(user?.notifications || { email: true, overload: true, threshold: 80 });
  const [msg, setMsg]       = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    try { await settingsAPI.updateProfile({ name }); setMsg('Profile updated successfully'); setTimeout(() => setMsg(''), 3000); }
    catch { setMsg('Error updating profile'); }
  };

  const saveNotifs = async (e) => {
    e.preventDefault();
    try { await settingsAPI.updateNotifications(notifs); setMsg('Notification preferences saved'); setTimeout(() => setMsg(''), 3000); }
    catch { setMsg('Error saving preferences'); }
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Settings</h1><p className="page-sub">Manage your profile and notification preferences</p></div>
      {msg && <div className={`alert-box ${msg.includes('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Profile</h3>
          <form onSubmit={saveProfile}>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user?.email || ''} disabled style={{ background: '#f9fafb', color: '#9ca3af' }} /></div>
            <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={user?.role || ''} disabled style={{ background: '#f9fafb', color: '#9ca3af' }} /></div>
            <button type="submit" className="btn btn-primary">Save Profile</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Notification Preferences</h3>
          <form onSubmit={saveNotifs}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email' },
                { key: 'overload', label: 'Overload Alerts', desc: 'Notify when server load exceeds threshold' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.desc}</div>
                  </div>
                  <input type="checkbox" checked={notifs[item.key]} onChange={e => setNotifs({ ...notifs, [item.key]: e.target.checked })} style={{ width: 16, height: 16 }} />
                </label>
              ))}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Alert Threshold (%)</label>
                <input className="form-input" type="number" min={0} max={100} value={notifs.threshold} onChange={e => setNotifs({ ...notifs, threshold: +e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Save Preferences</button>
          </form>
        </div>
      </div>
    </div>
  );
}
