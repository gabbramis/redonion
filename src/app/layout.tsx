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
  title: "RedOnion",
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
        <meta name="google" content="notranslate" />
        <meta httpEquiv="content-language" content="es" />
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

            /* Prevent Google Translate from breaking dynamic content */
            input,
            button,
            textarea,
            select {
              font-family: inherit !important;
            }

            /* Prevent translation conflicts with animations */
            .notranslate,
            [translate="no"] {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
            }

            /* Force title to not translate */
            title {
              translate: no;
            }
          `
        }} />
        {/* Prevent title translation */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var originalTitle = 'RedOnion';
              Object.defineProperty(document, 'title', {
                get: function() {
                  return originalTitle;
                },
                set: function(newTitle) {
                  if (newTitle !== 'Cebola Roxa' && !newTitle.includes('Cebola')) {
                    originalTitle = newTitle;
                  }
                }
              });
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased notranslate`}
        translate="no"
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
                  includedLanguages: 'es,pt',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false
                }, 'google_translate_element_desktop');
              };
            `
          }}
        />
      </body>
    </html>
  );
}