const express = require('express');
const app = express();
require('dotenv').config();

// ✅ Use Railway's injected port, fallback to 3000 for local dev
const PORT = process.env.PORT || 3000;

if (!process.env.PORT) {
  console.warn('⚠️ No Railway PORT detected — running locally on 3000');
}

// ✅ Middleware to parse JSON bodies
app.use(express.json());

// ✅ Root route
app.get('/', (req, res) => {
  res.send('✅ GemAssure backend is live and reachable.');
});

// ✅ Health check route with console logging
app.get('/healthz', (req, res) => {
  const rawKey = process.env.GEMGUIDE_API_KEY;
  const keyPresent = !!rawKey;

  // 🔍 Log what we see
  console.log('🔎 GEMGUIDE_API_KEY:', rawKey || '[MISSING]');

  res.json({
    status: 'ok',
    hasApiKey: keyPresent
  });
});

// ✅ Stub for GemGuide API connection (future expansion)
app.get('/api/gemguide', (req, res) => {
  res.status(501).json({
    message: '🔧 This endpoint will connect to the GemGuide API soon.',
  });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 GemAssure backend is running on port ${PORT}`);
});
