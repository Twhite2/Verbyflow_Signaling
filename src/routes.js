const logger = require('./logger');

/**
 * Sets up Express API routes
 * @param {Object} app - Express app instance
 */
function setupRoutes(app) {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API version
  app.get('/api/version', (req, res) => {
    res.json({
      version: '1.0.0',
      name: 'Verbyflow Signaling Server'
    });
  });

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      error: 'Not found'
    });
  });
}

module.exports = { setupRoutes };
