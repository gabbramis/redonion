import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedOnion - Marketing Agency",
  description: "Agencia Internacional de Marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* COMPLETELY HIDE Google Translate UI - Keep it functional but invisible */

            /* Hide the banner frame completely */
            .goog-te-banner-frame,
            .goog-te-banner-frame.skiptranslate,
            body > .skiptranslate,
            iframe.goog-te-banner-frame,
            .goog-te-banner-frame iframe {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              opacity: 0 !important;
              pointer-events: none !important;
              position: absolute !important;
              left: -9999px !important;
            }

            /* Prevent body from being pushed down */
            body {
              top: 0 !important;
              position: static !important;
            }

            /* Move Google Translate widget off-screen but keep it functional */
            #google_translate_element_desktop,
            #google_translate_element_mobile {
              position: absolute !important;
              left: -9999px !important;
              top: -9999px !important;
              width: 1px !important;
              height: 1px !important;
              overflow: hidden !important;
              visibility: hidden !important;
            }

            /* Hide all Google Translate UI elements */
            .goog-te-gadget,
            .goog-te-combo,
            .skiptranslate {
              display: none !important;
              visibility: hidden !important;
            }

            /* Hide the iframe that contains the floating widget */
            iframe.skiptranslate {
              display: none !important;
              visibility: hidden !important;
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Hidden Google Translate widget - functional but invisible */}
        <div id="google_translate_element_desktop" aria-hidden="true" />

        {children}

        <Script
          id="google-translate-loader"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
        <Script
          id="google-translate-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.googleTranslateElementInit = function() {
                // Initialize Google Translate widget (hidden, but functional)
                new google.translate.TranslateElement({
                  pageLanguage: 'es',
                  includedLanguages: 'es,pt,en',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false
                }, 'google_translate_element_desktop');
              };
            `
          }}
        />
        <Script
          id="title-protection"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var originalTitle = 'RedOnion - Marketing Agency';

                // Set title immediately
                document.title = originalTitle;

                // Watch for title changes
                var observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    var title = document.title;
                    // If title was translated, restore it
                    if (title.includes('Cebola') || title.includes('Roxa')) {
                      document.title = originalTitle;
                    }
                  });
                });

                // Start observing
                var titleElement = document.querySelector('title');
                if (titleElement) {
                  observer.observe(titleElement, {
                    childList: true,
                    characterData: true,
                    subtree: true
                  });
                }

                // Also check periodically
                setInterval(function() {
                  if (document.title.includes('Cebola') || document.title.includes('Roxa')) {
                    document.title = originalTitle;
                  }
                }, 500);
              })();
            `
          }}
        />
      </body>
    </html>
  );
}