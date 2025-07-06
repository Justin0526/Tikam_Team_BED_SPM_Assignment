const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const fetch = require("node-fetch");

dotenv.config();

const weatherController = require("./controllers/weather_controller");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins (you can tighten this later)
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, "public")));

// Weather route
app.get("/weather", weatherController.getWeather);

// Translation proxy route using API key
app.post("/translate", async (req, res) => {
  const { q, source, target, format } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;y

  if (!q || !target) {
    return res.status(400).json({ error: "Missing required translation parameters" });
  }
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q,
          source,
          target,
          format: format || "text",
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Translate API error:", response.status, errText);
      return res.status(500).json({ error: "Translation service failed" });
    }

    const data = await response.json();

    // Google returns translations in data.data.translations[0].translatedText
    const translations = data.data.translations.map(t => t.translatedText);
    const translatedText = translations.length > 1 ? translations.join("\n@@\n") : translations[0];

    res.json({ translatedText });
  } catch (error) {
    console.error("Translation proxy error:", error);
    res.status(500).json({ error: "Translation service failed" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("language") || "en";
  if (savedLang !== "en") {
    translatePage(savedLang);
  }
});
async function translatePage(targetLang) {
  const nodes = [...document.querySelectorAll("[data-i18n]")];
  const texts = nodes.map(node => node.textContent.trim());
  const q = texts.join("\n@@\n");

  try {
    const res = await fetch("http://localhost:3000/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, target: targetLang }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const translations = data.translatedText.split("\n@@\n");

    nodes.forEach((node, i) => {
      node.textContent = translations[i] || node.textContent;
    });
  } catch (err) {
    console.error("Translation error:", err);
  }
}
