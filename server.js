require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Ensure logs directory exists
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, "requests.log");
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, "", "utf8");

function logRequestResponse(entry) {
  fs.appendFile(logFile, JSON.stringify(entry) + "\n", (err) => {
    if (err) console.error("❌ Failed to write log:", err);
  });
}

// Error map
const errorMessages = {
  user_unauthenticated: "Your GemGuide API key is invalid or expired.",
  no_shape_name_provided: "Diamond cut is required.",
  no_color_provided: "Diamond color is required.",
  no_clarity_provided: "Diamond clarity is required.",
  no_weight_provided: "Weight (carats) is required.",
  invalid_gem: "Gem not recognized. Use the full GemGuide name.",
  invalid_weight_nan: "Weight must be a number in carats.",
  server_error: "GemGuide server error. Try again later."
};

// Metal purity config
const metalConfig = {
  "8k Gold": { symbol: "XAU", purity: 0.333 },
  "10k Gold": { symbol: "XAU", purity: 0.417 },
  "14k Gold": { symbol: "XAU", purity: 0.585 },
  "18k Gold": { symbol: "XAU", purity: 0.75 },
  "22k Gold": { symbol: "XAU", purity: 0.916 },
  "24k Gold": { symbol: "XAU", purity: 1.0 },
  "Platinum 900": { symbol: "XPT", purity: 0.9 },
  "Platinum 950": { symbol: "XPT", purity: 0.95 },
  "Silver 925": { symbol: "XAG", purity: 0.925 },
  "Silver 999": { symbol: "XAG", purity: 0.999 },
  "Palladium 900": { symbol: "XPD", purity: 0.9 },
  "Palladium 950": { symbol: "XPD", purity: 0.95 },
};

// Convert units → troy ounces
function convertToOunces(weight, unit) {
  switch (unit) {
    case "grams":
      return weight / 28.3495;
    case "dwt":
      return weight / 20.0;
    case "oz":
      return weight; // already ounces
    default:
      return weight;
  }
}

// Health check
app.get("/", (req, res) => {
  res.send("✅ GemAssure backend is live.");
});

// Estimate endpoint
app.post("/api/estimate", async (req, res) => {
  const { gemType, carat, cut, color, clarity, metalType, metalWeight, metalUnit, isRetail } = req.body;
  console.log("[POST] /api/estimate", req.body);

  try {
    let gemstoneValue = 0;
    let diamondRange = null;
    let gemResp = null;

    // Gemstone lookup
    if (gemType) {
      let url = "";
      if (gemType.toLowerCase() === "diamond") {
        url = `${process.env.GEMGUIDE_BASE_URL}/diamond?name=${encodeURIComponent(
          cut
        )}&weight=${carat}&color=${color}&clarity=${clarity}`;
      } else {
        url = `${process.env.GEMGUIDE_BASE_URL}/gem?name=${encodeURIComponent(
          gemType
        )}&weight=${carat}`;
      }

      gemResp = await axios.get(url, {
        headers: {
          api_key: process.env.GEMGUIDE_API_KEY,
          user: process.env.GEMGUIDE_USERNAME,
        },
      });

      if (gemType.toLowerCase() === "diamond") {
        const table = gemResp.data;
        gemstoneValue = table?.[1]?.[1] || 0;
        const low = table?.[1]?.[2] || null;
        const high = table?.[1]?.[0] !== "-" ? table?.[1]?.[0] : null;
        if (low || high) diamondRange = [low, high].filter((v) => v !== null);
      } else {
        const prices = gemResp.data?.["5"];
        if (Array.isArray(prices)) {
          gemstoneValue =
            prices.length === 2 ? (prices[0] + prices[1]) / 2 : prices[0];
        }
      }
    }

    // Metal value
    let metalValue = 0;
    if (metalType && metalWeight) {
      const config = metalConfig[metalType];
      if (config) {
        const weightInOz = convertToOunces(metalWeight, metalUnit || "grams");
        const url = `${process.env.METALPRICE_BASE_URL}/latest?apikey=${process.env.METALPRICE_API_KEY}&currencies=USD${config.symbol}`;
        const resp = await axios.get(url);
        const rate = resp.data?.rates?.[`USD${config.symbol}`];
        if (rate) {
          metalValue = rate * weightInOz * config.purity;
        }
      }
    }

    // Total
    let totalValue = gemstoneValue + metalValue;
    if (isRetail) {
      totalValue *= 1.4; // +40% retail markup
    }

    const responseData = {
      ok: true,
      input: req.body,
      gemstoneValue,
      metalValue,
      totalValue,
      diamondRange,
      raw: {
        gem: gemResp?.data,
      },
    };

    logRequestResponse({
      timestamp: new Date().toISOString(),
      request: req.body,
      response: responseData,
    });

    res.json(responseData);
  } catch (error) {
    const rawError = error.response?.data || { code: "server_error", message: error.message };
    const friendly = errorMessages[rawError.code] || rawError.message || "Unknown error.";

    const errorData = {
      ok: false,
      error: friendly,
      code: rawError.code || null,
    };

    logRequestResponse({
      timestamp: new Date().toISOString(),
      request: req.body,
      error: errorData,
      rawError,
    });

    res.status(400).json(errorData);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GemAssure backend running on port ${PORT}`);
});
