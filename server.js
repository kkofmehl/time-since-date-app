const express = require('express');
const path = require('path');
const createTimersRouter = require('./routes/timers');

const app = express();
app.use(express.json());
app.use('/api/timers', createTimersRouter());
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Listening on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
