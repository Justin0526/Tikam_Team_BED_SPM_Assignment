/* =========================================================
   settings_translation.js
   – auto‑translates any page on load
   – handles <select id="languageSelect"> + Apply button
   – falls back to translating every visible text node
   – talks to backend /translate on http://localhost:3000
   ========================================================= */
const sel = document.getElementById("languageSelect");
const btn = document.getElementById("applyButton");

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("language") || "en";

  /* ─── settings page behaviour (only if dropdown exists) ─── */
  if (sel && btn) {
    sel.value = savedLang;
    btn.style.display = "none";

    sel.addEventListener("change", () => {
      btn.style.display = sel.value !== savedLang ? "inline-block" : "none";
    });

    btn.addEventListener("click", () => {
      localStorage.setItem("language", sel.value);
      btn.style.display = "none";
      location.reload();        // so every page picks up new lang
    });
  }

  /* ─── translate current page if language ≠ "en" ─── */
  if (savedLang !== "en") translatePage(savedLang);
});

/* =========================================================
   translatePage
   • translates only [data‑i18n] nodes if present
   • otherwise translates every visible text node
   ========================================================= */
async function translatePage(targetLang) {
  let nodes = [...document.querySelectorAll("[data-i18n]")];

  if (nodes.length === 0) {
    // Grab every visible text node
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentNode && ["SCRIPT", "STYLE"].includes(node.parentNode.tagName))
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );
    while (walker.nextNode()) nodes.push(walker.currentNode);
  }

  if (nodes.length === 0) return; // nothing to translate

  const texts = nodes.map(n => n.textContent.trim());
  const q = texts.join("\n@@\n");

  try {
    const res = await fetch("http://localhost:3000/translate", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ q, target: targetLang }),
    });
    if (!res.ok) throw new Error(await res.text());

    const { translatedText } = await res.json();
    const translations = translatedText.split("\n@@\n");

    nodes.forEach((node, i) => {
      node.textContent = translations[i] || node.textContent;
    });
  } catch (err) {
    console.error("Translation error:", err);
  }
}
