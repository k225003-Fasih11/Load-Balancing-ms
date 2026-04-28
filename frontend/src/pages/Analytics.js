import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

const COLORS = { round_robin: '#BA7517', least_connections: '#185FA5', ai_predict: '#3B6D11' };

export default function Analytics() {
  const [comparison, setComparison] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => { fetchPrediction(); }, []);

  const fetchPrediction = async () => {
    try { const r = await analyticsAPI.prediction(); setPrediction(r.data); }
    catch (err) { console.error(err); }
  };

  const runComparison = async () => {
    setLoading(true);
    try { const r = await analyticsAPI.comparison(); setComparison(r.data); }
    catch (err) { alert(err.response?.data?.message || 'Need at least 2 active servers'); }
    finally { setLoading(false); }
  };

  const algos = comparison ? Object.keys(comparison) : [];

  const barData = (metric, label) => ({
    labels: algos.map(a => a.replace(/_/g, ' ').toUpperCase()),
    datasets: [{ label, data: algos.map(a => comparison[a][metric]), backgroundColor: algos.map(a => COLORS[a]), borderRadius: 6 }]
  });

  const lineData = {
    labels: comparison ? comparison.round_robin.respHistory.map((_, i) => i + 1) : [],
    datasets: algos.map(a => ({
      label: a.replace(/_/g, ' '), data: comparison[a].respHistory,
      borderColor: COLORS[a], borderWidth: 2, tension: 0.4,
      fill: false, pointRadius: 0
    }))
  };

  const barOpts = (title) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${title}: ${ctx.raw}` } } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } } }
  });

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } },
    scales: {
      x: { display: false },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } }, beginAtZero: true }
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Analytics & Comparison</h1>
          <p className="page-sub">Algorithm performance benchmarking and traffic prediction</p>
        </div>
        <button className="btn btn-primary" onClick={runComparison} disabled={loading}>
          {loading ? 'Running...' : '▶ Run Comparison'}
        </button>
      </div>

      {/* AI Prediction */}
      {prediction && (
        <div className="card" style={{ marginBottom: 20, background: '#fefce8', border: '0.5px solid #fde68a' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>AI Traffic Prediction</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Current Load', val: `${prediction.currentLoad}%` },
              { label: 'Predicted Load', val: `${prediction.predictedLoad}%` },
              { label: 'Trend', val: prediction.trend?.toUpperCase() },
              { label: 'Confidence', val: `${prediction.confidence}%` },
              { label: 'Recommended Algorithm', val: prediction.recommendation?.replace(/_/g, ' ').toUpperCase() },
            ].map(item => (
              <div key={item.label} style={{ minWidth: 120 }}>
                <div style={{ fontSize: 11, color: '#92400e' }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'monospace', color: '#1a1a2e' }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!comparison && !loading && (
        <div className="card">
          <div className="empty-state">
            <h3>No comparison data yet</h3>
            <p>Click "Run Comparison" to benchmark all 3 algorithms against your active servers</p>
          </div>
        </div>
      )}

      {comparison && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {algos.map(a => {
              const r = comparison[a];
              return (
                <div key={a} className="card" style={{ borderTop: `3px solid ${COLORS[a]}` }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, marginBottom: 10, color: COLORS[a] }}>
                    {a.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  {[
                    ['Avg Response', `${r.avgResponseTime}ms`],
                    ['Fairness Index', r.fairnessIndex],
                    ['Overload Events', r.overloadEvents],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '0.5px solid #f3f4f6', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>{label}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Avg Response Time (ms)</h3>
              <div style={{ height: 180 }}><Bar data={barData('avgResponseTime', 'Avg Response (ms)')} options={barOpts('ms')} /></div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Fairness Index (Jain)</h3>
              <div style={{ height: 180 }}><Bar data={barData('fairnessIndex', 'Fairness')} options={{ ...barOpts(''), scales: { x: { grid: { display: false } }, y: { min: 0, max: 1, grid: { color: '#f3f4f6' } } } }} /></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Response Time Over Simulation Ticks</h3>
            <div style={{ height: 200 }}><Line data={lineData} options={lineOpts} /></div>
          </div>
        </>
      )}
    </div>
  );
}
