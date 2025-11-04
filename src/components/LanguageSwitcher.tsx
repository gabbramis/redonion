"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<string>("es");

  useEffect(() => {
    // Check for existing language preference
    const checkLanguage = () => {
      const googleCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="));

      if (googleCookie) {
        const lang = googleCookie.split("/")[2];
        setCurrentLang(lang || "es");
      }
    };

    checkLanguage();

    // Listen for language changes
    const interval = setInterval(checkLanguage, 500);
    return () => clearInterval(interval);
  }, []);

  const changeLanguage = (lang: string) => {
    // Set Google Translate cookie
    const domain = window.location.hostname;
    document.cookie = `googtrans=/es/${lang}; path=/; domain=${domain}`;
    document.cookie = `googtrans=/es/${lang}; path=/;`;

    setCurrentLang(lang);

    // Trigger page reload to apply translation
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => changeLanguage("es")}
        className={`relative w-8 h-8 rounded-full overflow-hidden transition-all duration-200 ${
          currentLang === "es"
            ? "ring-2 ring-red-600 scale-110"
            : "opacity-70 hover:opacity-100 hover:scale-105"
        }`}
        aria-label="Español"
        title="Español"
      >
        <Image
          src="/flag-es.svg"
          alt="Español"
          width={32}
          height={32}
          className="object-cover"
        />
      </button>

      <button
        onClick={() => changeLanguage("pt")}
        className={`relative w-8 h-8 rounded-full overflow-hidden transition-all duration-200 ${
          currentLang === "pt"
            ? "ring-2 ring-red-600 scale-110"
            : "opacity-70 hover:opacity-100 hover:scale-105"
        }`}
        aria-label="Português"
        title="Português (Brasil)"
      >
        <Image
          src="/flag-br.svg"
          alt="Português"
          width={32}
          height={32}
          className="object-cover"
        />
      </button>
    </div>
  );
}
