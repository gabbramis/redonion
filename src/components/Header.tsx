"use client";

// Removed 'Image' import since we are using standard <img> for flags
import Link from "next/link";
import { useState, useEffect } from "react";

// NOTE: We keep the Next.js Image component for the logo
import NextImage from "next/image"; 

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("es");
  const [googleTranslateReady, setGoogleTranslateReady] = useState(false);

  /**
   * Effect to monitor the DOM until the Google Translate select element is loaded.
   */
  useEffect(() => {
    let mounted = true;
    let checkAttempts = 0;
    const maxAttempts = 60; 

    const waitForGoogleTranslate = () => {
      if (!mounted) return;

      checkAttempts++;
      // *** FRAGILE POINT: Querying the hidden Google Translate select box ***
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;

      if (select) {
        console.log('✅ Google Translate widget found!');
        setGoogleTranslateReady(true);

        const currentValue = select.value;
        if (currentValue === 'pt') {
          setCurrentLang('pt');
        } else {
          setCurrentLang('es');
        }
      } else if (checkAttempts < maxAttempts) {
        setTimeout(waitForGoogleTranslate, 500);
      } else {
        console.error('❌ Google Translate failed to load after the maximum attempts');
      }
    };

    const initialDelay = setTimeout(waitForGoogleTranslate, 1500);

    return () => {
      mounted = false;
      clearTimeout(initialDelay);
    };
  }, []);

  /**
   * Toggles the language.
   */
  const toggleLanguage = () => {
    if (!googleTranslateReady) {
      console.warn('⏳ Google Translate is still loading, please wait...');
      return;
    }

    const targetLang = currentLang === 'es' ? 'pt' : 'es';
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;

    if (select) {
      select.value = targetLang;

      // Dispatch change event to force the translation
      try {
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
      } catch (error) {
         // @ts-ignore: Fallback for older/different environments
         select.fireEvent('onchange'); 
      }

      setCurrentLang(targetLang);
      console.log(`✅ Language toggled to: ${targetLang}`);
    } else {
      console.error('❌ Google Translate widget not found during toggle attempt.');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/login" className="flex items-center gap-3 group">
              <div className="transition-transform duration-300 group-hover:scale-110">
                <NextImage // Used NextImage for the logo
                  src="/onion-logo.png"
                  alt="RedOnion Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-500 notranslate">
                RedOnion
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* ... other links ... */}
            <a href="#servicios" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-colors font-medium">Servicios</a>
            <a href="#proceso" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-colors font-medium">Proceso</a>
            <a href="#precios" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-colors font-medium">Precios</a>
            <a href="#testimonios" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-colors font-medium">Testimonios</a>


            {/* Language Toggle Flag - FIXED: Using standard <img> */}
            <button
              onClick={toggleLanguage}
              className={`hover:scale-110 transition-all duration-200 flex items-center gap-2 ${
                !googleTranslateReady ? 'opacity-50 cursor-wait' : 'opacity-100'
              }`}
              aria-label="Toggle language"
              title={
                !googleTranslateReady
                  ? 'Loading translator...'
                  : currentLang === 'es'
                    ? 'Cambiar a Português'
                    : 'Mudar para Español'
              }
              disabled={!googleTranslateReady}
            >
              <img
                src={currentLang === 'es' ? '/flag-br.svg' : '/flag-es.svg'}
                alt={currentLang === 'es' ? 'Cambiar a Português' : 'Mudar para Español'}
                width={24}
                height={24}
                className="rounded"
              />
            </button>

            <a
              href="#contacto"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Contacto
            </a>
          </div>

          {/* Mobile Menu Button & Language Toggle */}
          <div className="md:hidden flex items-center gap-3">
            {/* Language Toggle Flag (Mobile) - FIXED: Using standard <img> */}
            <button
              onClick={toggleLanguage}
              className={`hover:scale-110 transition-all duration-200 flex items-center gap-2 ${
                !googleTranslateReady ? 'opacity-50 cursor-wait' : 'opacity-100'
              }`}
              aria-label="Toggle language"
              title={
                !googleTranslateReady
                  ? 'Loading translator...'
                  : currentLang === 'es'
                    ? 'Cambiar a Português'
                    : 'Mudar para Español'
              }
              disabled={!googleTranslateReady}
            >
              <img
                src={currentLang === 'es' ? '/flag-br.svg' : '/flag-es.svg'}
                alt={currentLang === 'es' ? 'Cambiar a Português' : 'Mudar para Español'}
                width={24}
                height={24}
                className="rounded"
              />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 focus:outline-none"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            {/* ... mobile links ... */}
            <a href="#servicios" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Servicios</a>
            <a href="#proceso" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Proceso</a>
            <a href="#precios" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Precios</a>
            <a href="#testimonios" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Testimonios</a>
            <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 mx-3 mt-2 text-center bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200">Contacto</a>
          </div>
        </div>
      </nav>
    </header>
  );
}