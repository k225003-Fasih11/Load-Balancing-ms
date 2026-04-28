const Server = require('../models/Server');
const Incident = require('../models/Incident');

exports.getOverview = async (req, res) => {
  try {
    const servers = await Server.find();
    const incidents = await Incident.find({ resolved: false });
    const totalLoad = servers.reduce((a, s) => a + s.currentLoad, 0);
    const avgLoad = servers.length ? totalLoad / servers.length : 0;
    const avgResp = servers.reduce((a, s) => a + s.responseTime, 0) / (servers.length || 1);

    res.json({
      totalServers: servers.length,
      activeServers: servers.filter(s => s.status === 'active').length,
      avgLoad: Math.round(avgLoad),
      avgResponseTime: Math.round(avgResp),
      openIncidents: incidents.length,
      totalConnections: servers.reduce((a, s) => a + s.connections, 0)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAlgorithmComparison = async (req, res) => {
  const simulate = (algo, servers, ticks = 60) => {
    const srvs = servers.map(s => ({ ...s.toObject(), load: 10 + Math.random() * 15, conns: 0, resp: 50 }));
    let rrIdx = 0;
    const respArr = [], fairArr = [], overloads = [];
    const jain = (loads) => { const n = loads.length, s = loads.reduce((a, b) => a + b, 0), sq = loads.reduce((a, b) => a + b * b, 0); return sq ? (s * s) / (n * sq) : 1; };

    for (let t = 0; t < ticks; t++) {
      srvs.forEach(s => { s.load = Math.max(0, s.load - 4 - Math.random() * 3); s.conns = Math.max(0, s.conns - 1); });
      const reqs = Math.floor(5 * (1 + Math.sin(t / 8) * 0.5 + Math.random() * 0.5));
      for (let r = 0; r < reqs; r++) {
        let t_idx;
        if (algo === 'round_robin') { t_idx = rrIdx++ % srvs.length; }
        else if (algo === 'least_connections') { t_idx = srvs.reduce((mi, s, i) => s.conns < srvs[mi].conns ? i : mi, 0); }
        else { const avg = srvs.reduce((a, s) => a + s.load, 0) / srvs.length; t_idx = avg > 60 ? srvs.reduce((mi, s, i) => s.conns < srvs[mi].conns ? i : mi, 0) : rrIdx++ % srvs.length; }
        srvs[t_idx].load = Math.min(100, srvs[t_idx].load + 6 + Math.random() * 4);
        srvs[t_idx].conns++;
        srvs[t_idx].resp = Math.min(500, srvs[t_idx].resp + 8 + Math.random() * 12);
      }
      respArr.push(srvs.reduce((a, s) => a + s.resp, 0) / srvs.length);
      fairArr.push(jain(srvs.map(s => s.load)));
      overloads.push(srvs.filter(s => s.load > 85).length);
    }
    return {
      avgResponseTime: Math.round(respArr.reduce((a, b) => a + b, 0) / ticks),
      fairnessIndex: +(fairArr.reduce((a, b) => a + b, 0) / ticks).toFixed(3),
      overloadEvents: overloads.reduce((a, b) => a + b, 0),
      respHistory: respArr.map(v => Math.round(v))
    };
  };

  try {
    const servers = await Server.find({ status: 'active' });
    if (servers.length < 2) return res.status(400).json({ message: 'Need at least 2 active servers' });
    res.json({
      round_robin:        simulate('round_robin', servers),
      least_connections:  simulate('least_connections', servers),
      ai_predict:         simulate('ai_predict', servers)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTrafficPrediction = async (req, res) => {
  try {
    const servers = await Server.find({ status: 'active' });
    const currentAvgLoad = servers.reduce((a, s) => a + s.currentLoad, 0) / (servers.length || 1);
    const predicted = Math.min(100, currentAvgLoad + (Math.random() * 20 - 5));
    const trend = predicted > currentAvgLoad + 5 ? 'rising' : predicted < currentAvgLoad - 5 ? 'falling' : 'stable';
    res.json({
      currentLoad: Math.round(currentAvgLoad),
      predictedLoad: Math.round(predicted),
      trend,
      recommendation: trend === 'rising' ? 'least_connections' : 'round_robin',
      confidence: Math.round(75 + Math.random() * 20)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
