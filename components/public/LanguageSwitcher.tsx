"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Globe } from "lucide-react";

// Uses the Google Website Translator to translate the whole page on the fly.
// A styled <select> sets the `googtrans` cookie and reloads; the Google widget
// (loaded hidden) reads the cookie and renders the translation.

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "اردو" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "zh-CN", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ru", label: "Русский" },
  { code: "pt", label: "Português" },
];

const INCLUDED = LANGUAGES.map((l) => l.code).join(",");

function readGoogTransLang(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/googtrans=\/[^/]*\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "en";
}

export function LanguageSwitcher() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    setLang(readGoogTransLang());
  }, []);

  function changeLanguage(next: string) {
    const host = window.location.hostname;
    const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Clear existing cookie on all domain scopes.
    for (const scope of [``, `;domain=${host}`, `;domain=.${host}`]) {
      document.cookie = `googtrans=;path=/${scope};${expire}`;
    }
    if (next !== "en") {
      const value = `/en/${next}`;
      for (const scope of [``, `;domain=${host}`, `;domain=.${host}`]) {
        document.cookie = `googtrans=${value};path=/${scope}`;
      }
    }
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-1.5 notranslate" translate="no">
      <Globe className="h-4 w-4 text-gray-500" aria-hidden />
      <select
        aria-label="Choose language"
        value={lang}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent text-xs font-semibold uppercase tracking-wide text-gray-600 hover:text-red-600 focus:outline-none cursor-pointer"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      {/* Hidden Google Translate mount + loader */}
      <div id="google_translate_element" className="hidden" />
      <Script id="gt-init" strategy="afterInteractive">
        {`
          window.googleTranslateElementInit = function () {
            new window.google.translate.TranslateElement(
              { pageLanguage: 'en', includedLanguages: '${INCLUDED}', autoDisplay: false },
              'google_translate_element'
            );
          };
        `}
      </Script>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </div>
  );
}
