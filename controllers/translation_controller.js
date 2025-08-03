//Hia Wei Dai S10269256H
const fetch = require("node-fetch");

//Controller to handle text translation requests.
//Uses Google Translate API via a server-side proxy to securely call the translation service.
const translateText = async (req, res) => {
  const { q, source, target, format } = req.body;
  // Retrieve Google API key from environment variables
  const apiKey = process.env.GOOGLE_API_KEY;

  // Validate required fields (text to translate `q` and target language `target`)
  if (!q || !target) {
    return res.status(400).json({ error: "Missing required translation parameters" });
  }
  
  // Ensure API key is configured properly in the environment variables
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    // Make a POST request to the Google Translate API endpoint
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
    
    // If the API call fails, log the error and return a 500 response
    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Translate API error:", response.status, errText);
      return res.status(500).json({ error: "Translation service failed" });
    }
    
    // Parse JSON response from Google Translate API
    const data = await response.json();
    const translations = data.data.translations.map(t => t.translatedText);
    const translatedText = translations.length > 1 ? translations.join("\n@@\n") : translations[0];
    
    // Send the translated text back to the client
    res.json({ translatedText });
  } catch (error) {
    // Handle unexpected network or runtime errors
    console.error("Translation proxy error:", error);
    res.status(500).json({ error: "Translation service failed" });
  }
};

module.exports = { translateText };