console.log("settings_translation.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready");

  const sel = document.getElementById("languageSelect");
  const btn = document.getElementById("applyButton");
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

  setupGlobalObserver();
});

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

  container.querySelectorAll("[placeholder], [alt], [value]").forEach(el => {
    if (el.dataset.translated === "true") return; // ✅ Skip already translated
    if (el.placeholder) placeholders.push({ el, attr: "placeholder", value: el.placeholder });
    if (el.alt) placeholders.push({ el, attr: "alt", value: el.alt });
    if (el.value && el.tagName === "INPUT") placeholders.push({ el, attr: "value", value: el.value });
  });

  const visibleText = nodes.map(n => n.textContent.trim());
  const attrText = placeholders.map(p => p.value.trim());
  const allTexts = [...visibleText, ...attrText];
  const q = allTexts.join("\n@@\n");

  if (allTexts.length === 0) return;

  try {
    const res = await fetch("http://localhost:3000/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, target: targetLang }),
    });

    const { translatedText } = await res.json();
    const translations = translatedText.split("\n@@\n");

    nodes.forEach((node, i) => {
      node.textContent = translations[i] || node.textContent;
      node.parentNode.dataset.translated = "true"; // ✅ Mark as translated
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

// ✅ FINAL triggerTranslate function – global + scoped
window.triggerTranslate = function () {
  const lang = localStorage.getItem("language") || "en";
  if (lang !== "en" && typeof translatePage === "function") {
    setTimeout(() => {
      translatePage(lang);
      if (typeof translateElements === "function") {
        translateElements(".post-body", lang);
        translateElements(".new-comment", lang);
        translateElements(".submit-comment", lang);
        translateElements(".comment-toggle", lang);
      }
    }, 150);
  }
};
