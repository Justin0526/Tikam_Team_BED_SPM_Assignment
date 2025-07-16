const apiBaseUrl = "http://localhost:3000";
let currentUser   = null;

console.log("settings_translation.js loaded");

const sel = document.getElementById("languageSelect");
const btn = document.getElementById("applyButton");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready");

  const savedLang = localStorage.getItem("language") || "en";
  console.log("Saved language:", savedLang);

  if (sel && btn) {
    sel.value = savedLang;
    btn.style.display = "none";

    sel.addEventListener("change", () => {
      btn.style.display = sel.value !== savedLang ? "inline-block" : "none";
    });

    btn.addEventListener("click", () => {
      localStorage.setItem("language", sel.value);
      btn.style.display = "none";
      location.reload(); // reload to apply new language
    });
  }

  if (savedLang !== "en") {
    console.log("Translating page to:", savedLang);
    translatePage(savedLang);
  }
});

async function translatePage(targetLang) {
  // Grab every visible text node (ignore data-i18n)
  let nodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && ["SCRIPT", "STYLE"].includes(node.parentNode.tagName))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) nodes.push(walker.currentNode);

  if (nodes.length === 0) {
    console.warn("No text nodes found to translate");
    return;
  }

  const texts = nodes.map(n => n.textContent.trim());
  const q = texts.join("\n@@\n");

  try {
    const res = await fetch("http://localhost:3000/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, target: targetLang }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server error: ${errText}`);
    }

    const { translatedText } = await res.json();
    const translations = translatedText.split("\n@@\n");

    nodes.forEach((node, i) => {
      node.textContent = translations[i] || node.textContent;
    });

    console.log("Page translated successfully");
  } catch (err) {
    console.error("Translation error:", err);
  }
}
window.addEventListener("load", async () => {
  currentUser = await getToken(token);
});
