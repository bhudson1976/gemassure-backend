// app.js

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Simple root route to verify the server works
app.get('/', (req, res) => {
  res.send('✅ GemAssure API is live and working!');
});

// Placeholder for future GemGuide API route
app.get('/api/gemguide', (req, res) => {
  res.status(501).json({ message: '🔧 This endpoint will soon connect to the GemGuide API.' });
});

// Start server (listen on all interfaces)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
