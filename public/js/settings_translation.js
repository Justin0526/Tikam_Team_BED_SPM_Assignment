//Hia Wei Dai S10269256H
console.log("settings_translation.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready");

  //Buttons for settings page
  const sel = document.getElementById("languageSelect");
  const btn = document.getElementById("applyButton");
  //Retrieve saved language or default to English
  const savedLang = localStorage.getItem("language") || "en";
  console.log("Saved language:", savedLang);
  
  // Handle language selection dropdown
  if (sel && btn) {
    sel.value = savedLang;
    btn.style.display = "none";
    
    //Show "Apply" button only if a new language is selected
    sel.addEventListener("change", () => {
      btn.style.display = sel.value !== savedLang ? "inline-block" : "none";
    });
    
    //Save selected language and reload page to apply translation
    btn.addEventListener("click", () => {
      localStorage.setItem("language", sel.value);
      btn.style.display = "none";
      location.reload(); // reload to apply new language
    });
  }

  //If language is not English, translate page immediately on load
  if (savedLang !== "en") {
    console.log("Translating page to:", savedLang);
    translatePage(savedLang);
  }

  setupGlobalObserver();
});

//Translates specific elements within a given scope (used for dynamic content like posts/comments).
function translateElementScope(element = document.body) { 
  const lang = localStorage.getItem("language") || "en";
  if (lang !== "en" && typeof translateText === "function") {
    requestAnimationFrame(() => {
      // Store original text once
      element.querySelectorAll(".post-body, .comment-item .body, [data-translate]").forEach(el => {
        if (!el.dataset.original) {
          el.dataset.original = el.textContent.trim();
        }
      });

      // Translate only from original
      element.querySelectorAll(".post-body, .comment-item .body, [data-translate]").forEach(el => {
        const originalText = el.dataset.original;
        if (originalText) {
          translateText(originalText, lang).then(translated => {
            el.textContent = translated;
          });
        }
      });
    });
  }
}

//Translates the entire page content, including text nodes and placeholders.
async function translatePage(targetLang, container = document.body) {
  const nodes = [];
  const placeholders = [];

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && ["SCRIPT", "STYLE"].includes(node.parentNode.tagName)) return NodeFilter.FILTER_REJECT;
        if (node.parentNode?.dataset?.translated === "true") return NodeFilter.FILTER_REJECT; // ✅ Skip already translated nodes
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) nodes.push(walker.currentNode);
  //Collect placeholder attributes (e.g., input placeholders, alt text)
  container.querySelectorAll("[placeholder], [alt], [value]").forEach(el => {
    if (el.dataset.translated === "true") return; // ✅ Skip already translated
    if (el.placeholder) placeholders.push({ el, attr: "placeholder", value: el.placeholder });
    if (el.alt) placeholders.push({ el, attr: "alt", value: el.alt });
    if (el.value && el.tagName === "INPUT") placeholders.push({ el, attr: "value", value: el.value });
  });
 
  // Combine all visible text and attribute text for translation
  const visibleText = nodes.map(n => n.textContent.trim());
  const attrText = placeholders.map(p => p.value.trim());
  const allTexts = [...visibleText, ...attrText];
  const q = allTexts.join("\n@@\n");

  if (allTexts.length === 0) return;

  try {
    // Send request to backend translation API
    const res = await fetch("http://localhost:3000/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, target: targetLang }),
    });

    const { translatedText } = await res.json();
    const translations = translatedText.split("\n@@\n");
    // Replace text content with translations and mark as translated
    nodes.forEach((node, i) => {
    node.textContent = translations[i] || node.textContent;
    if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
      node.parentNode.dataset.translated = "true"; 
      }
    });

    placeholders.forEach((p, i) => {
      const textIndex = visibleText.length + i;
      p.el.setAttribute(p.attr, translations[textIndex] || p.value);
      p.el.dataset.translated = "true"; // ✅ Mark as translated
    });

    console.log("Page translated successfully");
  } catch (err) {
    console.error("Translation error:", err);
  }
}

//Sends a single text string to be translated (used for targeted translations).
async function translateText(text, lang) {
  const res = await fetch("http://localhost:3000/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target: lang })
  });

  if (!res.ok) throw new Error("Translation failed");
  const { translatedText } = await res.json();
  return translatedText;
}

//Observes the DOM for changes and auto-translates dynamically added content.
function setupGlobalObserver() {
  const lang = localStorage.getItem("language") || "en";
  if (lang === "en") return;

  let timeout;
  const debounceTranslate = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      translatePage(lang);
    }, 300);
  };

  const observer = new MutationObserver(debounceTranslate);
  observer.observe(document.body, { childList: true, subtree: true });

  console.log("Global observer active for auto-translate");
}

// Scoped translation for dynamic elements
window.translateElements = async function translateElements(selector, lang) {
  const elements = Array.from(document.querySelectorAll(selector)).filter(
    el => !el.closest("[data-no-translate]")
  );
  if (!elements.length) return;

  const texts = elements.map(el => el.textContent.trim());
  const q = texts.join("\n@@\n");

  const res = await fetch("http://localhost:3000/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q, target: lang })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Scoped translation error:", err);
    return;
  }

  const { translatedText } = await res.json();
  const translations = translatedText.split("\n@@\n");

  elements.forEach((el, i) => {
    el.textContent = translations[i] || el.textContent;
  });

  console.log("Scoped translation complete");
};

//Initial scoped translation for full page content
translateElementScope(document.body); 