import React, { useState, useEffect } from 'react';
import { analyticsAPI, serverAPI, incidentAPI } from '../services/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function Dashboard() {
  const [overview, setOverview]       = useState(null);
  const [health, setHealth]           = useState([]);
  const [incidents, setIncidents]     = useState([]);
  const [prediction, setPrediction]   = useState(null);
  const [respHistory, setRespHistory] = useState([]);
  const [loadHistory, setLoadHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [healthScore, setHealthScore] = useState(null);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const calcHealthScore = (ov, healthData, inc) => {
    if (!ov || !healthData.length) return null;
    let score = 100;
    score -= (ov.avgLoad || 0) * 0.4;
    score -= (ov.openIncidents || 0) * 5;
    score -= healthData.filter(s => s.status === 'critical').length * 10;
    score -= healthData.filter(s => s.status === 'warning').length * 5;
    score -= Math.min((ov.avgResponseTime || 0) / 10, 20);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const fetchAll = async () => {
    try {
      const [ov, h, inc, pred] = await Promise.all([
        analyticsAPI.overview(), serverAPI.getHealth(),
        incidentAPI.getAll(), analyticsAPI.prediction()
      ]);
      setOverview(ov.data); setHealth(h.data);
      setIncidents(inc.data.slice(0, 5)); setPrediction(pred.data);
      setLastUpdated(new Date());
      setHealthScore(calcHealthScore(ov.data, h.data, inc.data));
      setRespHistory(prev => [...prev, ov.data.avgResponseTime || 0].slice(-20));
      setLoadHistory(prev => [...prev, ov.data.avgLoad || 0].slice(-20));
    } catch (err) { console.error(err); }
  };

  const makeChart = (data, color, fillColor) => ({
    labels: data.map((_, i) => i + 1),
    datasets: [{ data, borderColor: color, borderWidth: 2, fill: true, backgroundColor: fillColor, tension: 0.4, pointRadius: 0 }]
  });

  const chartOpts = (max) => ({
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } }, beginAtZero: true, ...(max ? { max } : {}) }
    }
  });

  const scoreColor  = (s) => s >= 80 ? '#3B6D11' : s >= 50 ? '#BA7517' : '#A32D2D';
  const scoreLabel  = (s) => s >= 80 ? 'Healthy' : s >= 50 ? 'Degraded' : 'Critical';
  const scoreBadge  = (s) => s >= 80 ? 'badge-green' : s >= 50 ? 'badge-amber' : 'badge-red';
  const statusColor = (s) => s === 'healthy' ? 'badge-green' : s === 'warning' ? 'badge-amber' : 'badge-red';
  const sevColor    = (s) => ({ low: 'badge-blue', medium: 'badge-amber', high: 'badge-red', critical: 'badge-red' }[s] || 'badge-gray');
  const trendIcon   = (t) => t === 'rising' ? '↑' : t === 'falling' ? '↓' : '→';
  const trendColor  = (t) => t === 'rising' ? '#A32D2D' : t === 'falling' ? '#3B6D11' : '#BA7517';

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">System overview — auto-refreshes every 5 seconds</p>
        </div>
        {lastUpdated && (
          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 4 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* System Health Score */}
      {healthScore !== null && (
        <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid ${scoreColor(healthScore)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Health Score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 42, fontWeight: 700, fontFamily: 'monospace', color: scoreColor(healthScore) }}>
                  {healthScore}
                </div>
                <div>
                  <span className={`badge ${scoreBadge(healthScore)}`} style={{ fontSize: 12 }}>{scoreLabel(healthScore)}</span>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>out of 100</div>
                </div>
              </div>
            </div>
            {/* Score Bar */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${healthScore}%`, background: scoreColor(healthScore), borderRadius: 5, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                <span>Critical</span><span>Degraded</span><span>Healthy</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', maxWidth: 220, lineHeight: 1.6 }}>
              Score is calculated from server load, open incidents, critical servers, and average response time.
            </div>
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Servers</div>
          <div className="stat-value">{overview?.totalServers ?? '—'}</div>
          <div className="stat-sub" style={{ color: '#3B6D11' }}>{overview?.activeServers} active</div>
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

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Response Time Trend (ms)</h3>
          <div style={{ height: 130 }}>
            <Line data={makeChart(respHistory, '#EF9F27', 'rgba(239,159,39,0.08)')} options={chartOpts()} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Avg Load Trend (%)</h3>
          <div style={{ height: 130 }}>
            <Line data={makeChart(loadHistory, '#378ADD', 'rgba(55,138,221,0.08)')} options={chartOpts(100)} />
          </div>
        </div>
      </div>

      {/* AI Prediction */}
      {prediction && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid #378ADD' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>AI Traffic Prediction</h3>
            <span className="badge badge-blue">ML MODEL ACTIVE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 10 }}>
            {[
              { label: 'Current Load',    val: `${prediction.currentLoad}%`,   color: '#1a1a2e' },
              { label: 'Predicted Load',  val: `${prediction.predictedLoad}%`, color: '#1a1a2e' },
              { label: 'Trend',           val: `${trendIcon(prediction.trend)} ${prediction.trend?.toUpperCase()}`, color: trendColor(prediction.trend) },
              { label: 'Confidence',      val: `${prediction.confidence}%`,    color: '#1a1a2e' },
            ].map(item => (
              <div key={item.label} style={{ background: '#f9fafb', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'monospace', color: item.color }}>{item.val}</div>
              </div>
            ))}
            <div style={{ background: '#fef9f0', borderRadius: 8, padding: 12, gridColumn: 'span 2' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Recommended Algorithm</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', fontFamily: 'monospace' }}>
                {prediction.recommendation?.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Server Health Monitor</h3>
          {health.length === 0
            ? <div className="empty-state"><h3>No active servers</h3><p>Add servers to monitor health</p></div>
            : <table>
                <thead><tr><th>Server</th><th>Status</th><th>Load</th><th>Response</th></tr></thead>
                <tbody>
                  {health.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{s.name}</td>
                      <td><span className={`badge ${statusColor(s.status)}`}>{s.status}</span></td>
                      <td style={{ fontFamily: 'monospace' }}>{Math.round(s.load)}%</td>
                      <td style={{ fontFamily: 'monospace' }}>{Math.round(s.responseTime)}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Incidents</h3>
          {incidents.length === 0
            ? <div className="empty-state"><h3>No incidents</h3><p>System is running healthy ✓</p></div>
            : <table>
                <thead><tr><th>Type</th><th>Severity</th><th>Server</th><th>Time</th></tr></thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr key={inc._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{inc.type}</td>
                      <td><span className={`badge ${sevColor(inc.severity)}`}>{inc.severity}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{inc.server?.name}</td>
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
