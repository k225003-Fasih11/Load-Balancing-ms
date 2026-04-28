import React, { useState, useEffect } from 'react';
import { algoAPI } from '../services/api';

export default function Algorithms() {
  const [data, setData]     = useState({ algorithms: [], active: '' });
  const [success, setSuccess] = useState('');

  useEffect(() => { algoAPI.getAll().then(r => setData(r.data)).catch(console.error); }, []);

  const setActive = async (id) => {
    try {
      await algoAPI.setActive(id);
      setData(prev => ({ ...prev, active: id }));
      setSuccess(`Switched to ${id.replace('_', ' ')}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { console.error(err); }
  };

  const descriptions = {
    round_robin: { pros: ['Simple O(1) selection', 'No state tracking needed', 'Equal distribution guarantee'], cons: ['Ignores server load', 'Poor for variable workloads', 'Can overload slower servers'] },
    least_connections: { pros: ['Load-aware routing', 'Adapts to request duration', 'Better fairness index'], cons: ['Requires O(n) scan', 'Connection tracking overhead', 'May cause hot spots on restart'] },
    ai_predict: { pros: ['Adaptive to traffic patterns', 'Prevents spikes proactively', 'Combines both strategies'], cons: ['Requires training window', 'More complex logic', 'Linear regression is simplistic'] }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Algorithm Configuration</h1>
        <p className="page-sub">Select and configure the active load balancing algorithm</p>
      </div>

      {success && <div className="alert-box alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {data.algorithms.map(algo => {
          const isActive = data.active === algo.id;
          const info = descriptions[algo.id] || { pros: [], cons: [] };
          return (
            <div key={algo.id} className="card" style={{ border: isActive ? '1.5px solid #EF9F27' : '0.5px solid #e5e7eb', position: 'relative' }}>
              {isActive && (
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <span className="badge badge-amber">ACTIVE</span>
                </div>
              )}
              <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>
                {algo.name}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>
                Complexity: {algo.complexity}
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, lineHeight: 1.6 }}>{algo.description}</p>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                <strong style={{ color: '#374151' }}>Best for:</strong> {algo.bestFor}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '14px 0' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#3B6D11', marginBottom: 6 }}>✓ Pros</div>
                  {info.pros.map(p => <div key={p} style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>{p}</div>)}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#A32D2D', marginBottom: 6 }}>✗ Cons</div>
                  {info.cons.map(c => <div key={c} style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>{c}</div>)}
                </div>
              </div>

              <button
                className={`btn ${isActive ? 'btn-primary' : ''}`}
                style={{ width: '100%' }}
                onClick={() => setActive(algo.id)}
                disabled={isActive}
              >
                {isActive ? '✓ Currently Active' : 'Set as Active'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
