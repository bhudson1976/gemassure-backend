const express = require('express');
const app = express();

// ✅ Use Railway-injected port OR fallback to 3000 explicitly
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('✅ GemAssure API is live and working!');
});

// Stub endpoint
app.get('/api/gemguide', (req, res) => {
  res.status(501).json({
    message: '🔧 This endpoint will soon connect to the GemGuide API.',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
