const Server = require('../models/Server');
const Incident = require('../models/Incident');
const Activity = require('../models/Activity');

exports.getServers = async (req, res) => {
  try {
    const servers = await Server.find().populate('createdBy', 'name');
    res.json(servers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createServer = async (req, res) => {
  try {
    const server = await Server.create({ ...req.body, createdBy: req.user._id });
    await Activity.create({ user: req.user._id, action: 'CREATE', resource: 'server', details: `Created server ${server.name}` });
    res.status(201).json(server);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateServer = async (req, res) => {
  try {
    const server = await Server.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!server) return res.status(404).json({ message: 'Server not found' });
    await Activity.create({ user: req.user._id, action: 'UPDATE', resource: 'server', details: `Updated server ${server.name}` });
    res.json(server);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteServer = async (req, res) => {
  try {
    const server = await Server.findByIdAndDelete(req.params.id);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    await Activity.create({ user: req.user._id, action: 'DELETE', resource: 'server', details: `Deleted server ${server.name}` });
    res.json({ message: 'Server deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getServerHealth = async (req, res) => {
  try {
    const servers = await Server.find({ status: 'active' });
    const health = servers.map(s => ({
      id: s._id, name: s.name,
      status: s.currentLoad > 85 ? 'critical' : s.currentLoad > 65 ? 'warning' : 'healthy',
      load: s.currentLoad, connections: s.connections,
      responseTime: s.responseTime, uptime: s.uptime
    }));
    res.json(health);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.simulateLoad = async (req, res) => {
  try {
    const { algorithm } = req.body;
    const servers = await Server.find({ status: 'active' });
    if (!servers.length) return res.status(400).json({ message: 'No active servers' });

    let target;
    if (algorithm === 'round_robin') {
      const idx = Math.floor(Math.random() * servers.length);
      target = servers[idx];
    } else if (algorithm === 'least_connections') {
      target = servers.reduce((a, b) => a.connections < b.connections ? a : b);
    } else {
      const avgLoad = servers.reduce((a, s) => a + s.currentLoad, 0) / servers.length;
      target = avgLoad > 70
        ? servers.reduce((a, b) => a.connections < b.connections ? a : b)
        : servers[Math.floor(Math.random() * servers.length)];
    }

    target.currentLoad = Math.min(100, target.currentLoad + 5 + Math.random() * 5);
    target.connections += 1;
    target.responseTime = 50 + target.currentLoad * 2 + Math.random() * 30;
    await target.save();

    if (target.currentLoad > 85) {
      await Incident.create({
        server: target._id, type: 'overload', severity: 'high',
        description: `Server ${target.name} overloaded at ${Math.round(target.currentLoad)}%`,
        loadAtTime: target.currentLoad
      });
    }
    res.json({ routed_to: target.name, load: Math.round(target.currentLoad), algorithm });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
