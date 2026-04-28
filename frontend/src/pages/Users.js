import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => { userAPI.getAll().then(r => setUsers(r.data)).catch(console.error); }, []);

  const toggleRole = async (id, role) => {
    const newRole = role === 'admin' ? 'viewer' : 'admin';
    try { await userAPI.update(id, { role: newRole }); setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u)); }
    catch { alert('Error updating role'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await userAPI.delete(id); setUsers(prev => prev.filter(u => u._id !== id)); }
    catch { alert('Error deleting user'); }
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">User Management</h1><p className="page-sub">Manage system users and roles</p></div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 500 }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EF9F27', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#0f1117', marginRight: 8 }}>{u.name[0]?.toUpperCase()}</div>{u.name}</td>
                <td style={{ color: '#6b7280', fontSize: 13 }}>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>{u.role}</span></td>
                <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'active' : 'inactive'}</span></td>
                <td style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggleRole(u._id, u.role)}>Toggle Role</button>
                  <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleDelete(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
