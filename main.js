// Main entry point for the WhatsApp AI Bot
// This file serves as the main entry point when run via gunicorn compatibility
const app = require('./index.js');

// For compatibility with gunicorn deployment
module.exports = app;