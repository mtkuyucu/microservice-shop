const app = require('./app');

const PORT = process.env.PORT || 3000;

// Only start the server when executed directly (not when required by tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Product service running on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

module.exports = app;
