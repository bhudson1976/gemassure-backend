// app.js

const express = require('express');
const app = express();

// ✅ Always use Railway's injected port without fallback
const PORT = process.env.PORT;

if (!PORT) {
  throw new Error('❌ Missing PORT environment variable — Railway needs this!');
}

// Middleware to parse JSON
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('✅ GemAssure API is live and working!');
});

// Stub route
app.get('/api/gemguide', (req, res) => {
  res.status(501).json({
    message: '🔧 This endpoint will soon connect to the GemGuide API.',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
