const fetch = require("node-fetch");

const translateText = async (req, res) => {
  const { q, source, target, format } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

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
    const translations = data.data.translations.map(t => t.translatedText);
    const translatedText = translations.length > 1 ? translations.join("\n@@\n") : translations[0];

    res.json({ translatedText });
  } catch (error) {
    console.error("Translation proxy error:", error);
    res.status(500).json({ error: "Translation service failed" });
  }
};

module.exports = { translateText };