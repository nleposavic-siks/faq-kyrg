// i18n.js - Internationalization setup for AdmiralBet Help Center

const i18n = {
  currentLang: "en",
  translations: {},

  // Initialize i18n
  async init() {
    // Get language from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang");
    const savedLang = localStorage.getItem("preferredLanguage");

    // Allow only EN or RU
    this.currentLang = ["en", "ru"].includes(urlLang)
      ? urlLang
      : ["en", "ru"].includes(savedLang)
        ? savedLang
        : this.detectLanguage();

    // Load translations
    await this.loadTranslations(this.currentLang);

    // Apply translations
    this.applyTranslations();

    // Update language switcher
    this.updateLanguageSwitcher();
  },

  detectLanguage() {
    // Browser language detection
    const browserLang = navigator.language.toLowerCase();

    if (browserLang.startsWith("ru")) return "ru";

    return "en";
  },

  // Load translation files
  async loadTranslations(lang) {
    try {
      // Try to load from locales directory first
      let response = await fetch(`/locales/${lang}.json`);

      // If that fails, try loading from the translation files you provided
      if (!response.ok) {
        response = await fetch(`/translation-${lang}.json`);
      }

      // If still failing, try without language prefix
      if (!response.ok && lang === "en") {
        response = await fetch("/translation.json");
      }

      if (!response.ok) {
        throw new Error(`Failed to load ${lang} translations`);
      }

      this.translations = await response.json();
      console.log(
        `Loaded ${lang} translations successfully`,
        this.translations,
      );
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);

      // Fallback to English if not already trying English
      if (lang !== "en") {
        console.log("Falling back to English...");
        try {
          const response = await fetch("/translation.json");
          if (response.ok) {
            this.translations = await response.json();
            console.log("Loaded fallback English translations");
          }
        } catch (fallbackError) {
          console.error("Failed to load fallback translations:", fallbackError);
        }
      }
    }
  },

  // Get translation by key
  t(key, params = {}) {
    const keys = key.split(".");
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return key if translation not found
      }
    }

    // Replace parameters
    if (typeof value === "string") {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match;
      });
    }

    return value || key;
  },

  // Apply translations to the page
  applyTranslations() {
    console.log("Applying translations...");

    // Translate everything with a data-i18n tag
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.t(key);
      if (translation !== key) element.textContent = translation;
    });

    // Translate HTML content (links)
    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      const key = element.getAttribute("data-i18n-html");
      const translation = this.t(key);
      if (translation !== key) element.innerHTML = translation;
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      const translation = this.t(key);
      if (translation !== key) element.placeholder = translation;
    });

    // Translate titles
    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      const translation = this.t(key);
      if (translation !== key) element.title = translation;
    });

    // Update title
    if (this.translations.meta?.title) document.title = this.t("meta.title");

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLang;

    // RE-INIT POPUP
    this.initMobilePopup();

    console.log(`Applied ${this.currentLang} translations`);
  },

  // Mobile popup initialization
  initMobilePopup() {
    const tabs = document.querySelectorAll(".nav-link");
    const popup = document.getElementById("tab-popup");
    const tabContentWrapper = document.getElementById("tab-content-wrapper");

    if (!popup || !tabContentWrapper) return;

    tabs.forEach((tab) => {
      // Remove existing listeners to prevent multiple popups opening
      const newTab = tab.cloneNode(true);
      tab.parentNode.replaceChild(newTab, tab);

      newTab.addEventListener("click", (event) => {
        if (window.innerWidth <= 768) {
          event.preventDefault();
          const targetId = newTab.getAttribute("href");
          const targetPane = document.querySelector(targetId);
          if (targetPane) {
            tabContentWrapper.innerHTML = targetPane.innerHTML;
            popup.style.display = "block";
          }
        }
      });
    });

    // Close button logic
    const closeBtn = popup.querySelector(".close");
    if (closeBtn) {
      closeBtn.onclick = () => (popup.style.display = "none");
    }

    // Click outside to close
    window.onclick = (event) => {
      if (event.target == popup) popup.style.display = "none";
    };
  },

  // Switch language
  async switchLanguage(lang) {
    if (lang === "bg") lang = "ru"; // safety fallback

    this.currentLang = lang;
    localStorage.setItem("preferredLanguage", lang);

    await this.loadTranslations(lang);
    this.applyTranslations();
    this.updateLanguageSwitcher();

    const url = new URL(window.location);
    url.searchParams.set("lang", lang);
    window.history.pushState({}, "", url);
  },
  // Update language switcher UI
  updateLanguageSwitcher() {
    const currentFlag =
      this.currentLang === "ru"
        ? "https://upload.wikimedia.org/wikipedia/en/f/f3/Flag_of_Russia.svg"
        : "https://upload.wikimedia.org/wikipedia/commons/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg";

    const currentAlt = this.currentLang === "ru" ? "Russian" : "English";

    // Update desktop switcher
    const desktopSwitcher = document.querySelector(
      ".language-switcher.d-none.d-md-block .nav-link img",
    );
    if (desktopSwitcher) {
      desktopSwitcher.src = currentFlag;
      desktopSwitcher.alt = currentAlt;
    }

    // Update mobile switcher
    const mobileSwitcher = document.querySelector(
      ".language-switcher.d-md-none .nav-link img",
    );
    if (mobileSwitcher) {
      mobileSwitcher.src = currentFlag;
      mobileSwitcher.alt = currentAlt;
    }

    console.log(`Language switcher updated to ${this.currentLang}`);
  },

  // Get current language
  getCurrentLanguage() {
    return this.currentLang;
  },
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded, initializing i18n...");
  await i18n.init();

  // Add click handlers to language switcher links with data-lang attribute
  document.querySelectorAll("[data-lang]").forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const lang = link.getAttribute("data-lang");
      await i18n.switchLanguage(lang);
    });
  });
});

// Export for use in other scripts
window.i18n = i18n;
