const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet());
app.use(cors());
app.use(morgan('combined')); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

let requestCount = 0;

app.get('/', (req, res) => {
  requestCount++;
  res.json({
    status: 'ok',
    message: 'Sample Node.js Application is running!',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    requestCount: requestCount,
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    pid: process.pid
  });
});

app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    application: 'Sample Node.js App',
    version: '1.0.0',
    environment: NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/echo', (req, res) => {
  res.json({
    message: 'Echo endpoint trigger',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// biasanya pake prometheus di port selain port utama, tp karene test, its okay
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
nodejs_app_requests_total ${requestCount}

nodejs_app_uptime_seconds ${process.uptime()}

nodejs_app_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
nodejs_app_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
nodejs_app_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
nodejs_app_memory_usage_bytes{type="external"} ${process.memoryUsage().external}
  `.trim());
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Node version: ${process.version}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/ready`);
  console.log(`  GET  http://localhost:${PORT}/api/info`);
  console.log(`  POST http://localhost:${PORT}/api/echo`);
  console.log(`  GET  http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
