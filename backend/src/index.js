const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/servers',    require('./routes/servers'));
app.use('/api/algorithms', require('./routes/algorithms'));
app.use('/api/incidents',  require('./routes/incidents'));
app.use('/api/analytics',  require('./routes/analytics'));
app.use('/api/alerts',     require('./routes/alerts'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/settings',   require('./routes/settings'));
app.use('/api/activity',   require('./routes/activity'));

app.get('/', (req, res) => res.json({ message: 'LBMS API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
