require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Ensure logs directory exists
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'requests.log');
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '', 'utf8');

// Helper: write request/response to log
function logRequestResponse(entry) {
  fs.appendFile(logFile, JSON.stringify(entry) + '\n', (err) => {
    if (err) console.error('❌ Failed to write log:', err);
  });
}

// Map GemGuide error codes → friendly messages
const errorMessages = {
  user_unauthenticated: "Your API key is invalid or expired.",
  user_client_unauthenticated: "User session invalid. Please log in again.",
  user_client_expired: "User session expired. Re-authentication required.",
  no_shape_name_provided: "Diamond shape is required (e.g., Round, Emerald, Princess).",
  no_color_provided: "Diamond color is required (D–M).",
  no_clarity_provided: "Diamond clarity is required (IF/FL, VVS1, VS2, etc.).",
  no_weight_provided: "Weight is required in carats.",
  invalid_shape: "Diamond shape not recognized. Try valid shapes like Emerald, Round, Princess.",
  invalid_gem: "Gem not recognized. Use the full GemGuide name (e.g., Almandine Garnet).",
  invalid_weight_nan: "Weight must be a number in carats.",
  invalid_weight: "Weight is outside the valid range for this gem or diamond.",
  invalid_color: "Diamond color must be a letter from D–M.",
  invalid_clarity: "Diamond clarity must be one of: IF/FL, VVS1, VVS2, VS1, VS2, SI1, SI2, I1, I2, I3.",
  server_error: "GemGuide server error. Please try again later."
};

// Health check
app.get('/', (req, res) => {
  res.send('✅ GemAssure backend is live.');
});

// Main estimate route (GemGuide)
app.post('/api/estimate', async (req, res) => {
  const { gemType, carat, cut, color, clarity } = req.body;
  console.log('[POST] /api/estimate', req.body);

  try {
    let url = '';
    let type = '';

    if (gemType.toLowerCase() === 'diamond') {
      type = 'diamond';
      url = `${process.env.GEMGUIDE_BASE_URL}/diamond?name=${encodeURIComponent(
        cut
      )}&weight=${carat}&color=${color}&clarity=${clarity}`;
    } else {
      type = 'gem';
      url = `${process.env.GEMGUIDE_BASE_URL}/gem?name=${encodeURIComponent(
        gemType
      )}&weight=${carat}`;
    }

    const ggResp = await axios.get(url, {
      headers: {
        api_key: process.env.GEMGUIDE_API_KEY,
        user: process.env.GEMGUIDE_USERNAME,
      },
    });

    let estimatedValue = null;
    let range = null;

    if (type === 'diamond') {
      const table = ggResp.data;
      estimatedValue = table?.[1]?.[1] || null;
      const low = table?.[1]?.[2] || null;
      const high = table?.[1]?.[0] !== '-' ? table?.[1]?.[0] : null;
      if (low || high) range = [low, high].filter((v) => v !== null);
    } else {
      const prices = ggResp.data?.['5'];
      if (Array.isArray(prices)) {
        if (prices.length === 2) {
          estimatedValue = (prices[0] + prices[1]) / 2;
          range = prices;
        } else {
          estimatedValue = prices[0] || null;
        }
      }
    }

    const responseData = {
      ok: true,
      type,
      input: req.body,
      estimatedValue,
      range,
      raw: ggResp.data,
    };

    logRequestResponse({
      timestamp: new Date().toISOString(),
      request: req.body,
      response: responseData,
    });

    res.json(responseData);
  } catch (error) {
    const rawError = error.response?.data || { code: 'server_error', message: error.message };
    const friendly = errorMessages[rawError.code] || rawError.message || "Unknown error.";

    const errorData = {
      ok: false,
      error: friendly,
      code: rawError.code || null
    };

    logRequestResponse({
      timestamp: new Date().toISOString(),
      request: req.body,
      error: errorData,
      rawError
    });

    res.status(400).json(errorData);
  }
});

// Metals API test route
app.get('/api/metal-price', async (req, res) => {
  try {
    const response = await axios.get('https://api.metalpriceapi.com/v1/latest', {
      params: {
        api_key: process.env.METALPRICE_API_KEY,
        base: 'USD',
        currencies: 'XAU,XAG' // Gold, Silver
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ Metals API test failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch metals price' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GemAssure backend is running on port ${PORT}`);
});
