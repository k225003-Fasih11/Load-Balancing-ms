import React, { useState, useEffect } from 'react';
import { analyticsAPI, serverAPI, incidentAPI } from '../services/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function Dashboard() {
  const [overview, setOverview]   = useState(null);
  const [health, setHealth]       = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [respHistory, setRespHistory] = useState([]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [ov, h, inc, pred] = await Promise.all([
        analyticsAPI.overview(), serverAPI.getHealth(),
        incidentAPI.getAll(), analyticsAPI.prediction()
      ]);
      setOverview(ov.data); setHealth(h.data);
      setIncidents(inc.data.slice(0, 5)); setPrediction(pred.data);
      setRespHistory(prev => {
        const next = [...prev, ov.data.avgResponseTime || 0].slice(-20);
        return next;
      });
    } catch (err) { console.error(err); }
  };

  const chartData = {
    labels: respHistory.map((_, i) => i + 1),
    datasets: [{
      label: 'Avg Response (ms)', data: respHistory,
      borderColor: '#EF9F27', borderWidth: 2, fill: true,
      backgroundColor: 'rgba(239,159,39,0.08)', tension: 0.4, pointRadius: 0
    }]
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } }, beginAtZero: true }
    }
  };

  const statusColor = (s) => s === 'healthy' ? 'badge-green' : s === 'warning' ? 'badge-amber' : 'badge-red';
  const severityColor = (s) => ({ low:'badge-blue', medium:'badge-amber', high:'badge-red', critical:'badge-red' }[s] || 'badge-gray');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">System overview — auto-refreshes every 5 seconds</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Servers</div>
          <div className="stat-value">{overview?.totalServers ?? '—'}</div>
          <div className="stat-sub">{overview?.activeServers} active</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Avg Load</div>
          <div className="stat-value">{overview?.avgLoad ?? '—'}%</div>
          <div className="stat-sub">across all servers</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Avg Response</div>
          <div className="stat-value">{overview?.avgResponseTime ?? '—'}</div>
          <div className="stat-sub">milliseconds</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Open Incidents</div>
          <div className="stat-value">{overview?.openIncidents ?? '—'}</div>
          <div className="stat-sub">unresolved</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Connections</div>
          <div className="stat-value">{overview?.totalConnections ?? '—'}</div>
          <div className="stat-sub">total active</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Response Time Trend</h3>
          <div style={{ height: 140 }}>
            <Line data={chartData} options={chartOpts} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>AI Traffic Prediction</h3>
          {prediction ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Current Load', val: `${prediction.currentLoad}%` },
                { label: 'Predicted Load', val: `${prediction.predictedLoad}%` },
                { label: 'Trend', val: prediction.trend?.toUpperCase() },
                { label: 'Confidence', val: `${prediction.confidence}%` },
              ].map(item => (
                <div key={item.label} style={{ background: '#f9fafb', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'monospace', color: '#1a1a2e' }}>{item.val}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1/-1', background: '#fef9f0', borderRadius: 8, padding: 10, fontSize: 12, color: '#92400e' }}>
                Recommended: <strong>{prediction.recommendation?.replace('_', ' ').toUpperCase()}</strong>
              </div>
            </div>
          ) : <p style={{ color: '#9ca3af', fontSize: 13 }}>No servers active</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Server Health</h3>
          {health.length === 0
            ? <div className="empty-state"><h3>No active servers</h3><p>Add servers to monitor health</p></div>
            : <table>
                <thead><tr><th>Server</th><th>Status</th><th>Load</th><th>Response</th></tr></thead>
                <tbody>
                  {health.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{s.name}</td>
                      <td><span className={`badge ${statusColor(s.status)}`}>{s.status}</span></td>
                      <td>{Math.round(s.load)}%</td>
                      <td>{Math.round(s.responseTime)}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Incidents</h3>
          {incidents.length === 0
            ? <div className="empty-state"><h3>No incidents</h3><p>System is healthy</p></div>
            : <table>
                <thead><tr><th>Type</th><th>Severity</th><th>Server</th><th>Time</th></tr></thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr key={inc._id}>
                      <td>{inc.type}</td>
                      <td><span className={`badge ${severityColor(inc.severity)}`}>{inc.severity}</span></td>
                      <td style={{ fontFamily: 'monospace' }}>{inc.server?.name}</td>
                      <td style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(inc.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>
    </div>
  );
}
