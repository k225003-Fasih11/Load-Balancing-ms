// reports.js
const router = require('express').Router();
const Server = require('../models/Server');
const Incident = require('../models/Incident');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, async (req, res) => {
  try {
    const servers = await Server.find();
    const incidents = await Incident.find().populate('server', 'name');
    res.json({
      generatedAt: new Date(),
      generatedBy: req.user.name,
      servers: servers.map(s => ({ name: s.name, status: s.status, load: s.currentLoad, uptime: s.uptime })),
      incidents: incidents.slice(0, 20),
      summary: {
        totalServers: servers.length,
        avgLoad: Math.round(servers.reduce((a, s) => a + s.currentLoad, 0) / (servers.length || 1)),
        totalIncidents: incidents.length,
        resolvedIncidents: incidents.filter(i => i.resolved).length
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
