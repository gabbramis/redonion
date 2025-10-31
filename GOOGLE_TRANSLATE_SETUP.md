# Google Translate Setup

## ✅ Implementation Complete

Your website now has **automatic translation** powered by Google Translate with a clean flag toggle!

### 🎯 What Was Added

1. **Flag Toggle Button** in the header navigation (🇧🇷/🇪🇸)
2. **Automatic translation** for entire site (landing page, login, dashboard, everything)
3. **Brand protection** - "RedOnion" never translates
4. **No Google branding banner** - clean implementation
5. **Mobile-friendly** - flag appears on mobile too

### 🌍 Supported Languages

- **Español (Spanish)** - Default (shows 🇧🇷 flag)
- **Português (Portuguese)** - Shows 🇪🇸 flag

### 📍 Location

The flag toggle button is located in the **header navigation**, between "Testimonios" and "Contacto" buttons on desktop, and next to the mobile menu button on mobile.

### 🎨 Styling

- Large emoji flag button (text-2xl)
- Smooth hover animation (scale-110)
- Clean, modern design
- Hides Google Translate widget completely
- Hides the annoying banner at top of page
- Mobile-friendly - appears on both desktop and mobile

### 🚀 How Users Use It

1. User visits the site (default: Spanish)
2. Sees 🇧🇷 flag button in header
3. Clicks flag to switch to Portuguese
4. **Entire site translates automatically** - no page reload needed!
5. Flag changes to 🇪🇸 to allow switching back
6. Works on all pages: home, login, signup, dashboard, admin panel
7. **"RedOnion" brand name never translates** - protected with `notranslate` class

### 💡 Benefits

- ✅ **Zero maintenance** - translations update automatically
- ✅ **Free forever** - no subscription costs
- ✅ **Clean UI** - no Google branding visible
- ✅ **Brand protection** - "RedOnion" stays in English
- ✅ **Works everywhere** - no need to restructure routes or pages
- ✅ **Mobile-friendly** - flag appears on both desktop and mobile

### 🔧 Technical Details

**Files modified:**
- `src/app/layout.tsx` - Added Google Translate scripts and styling
- `src/components/Header.tsx` - Added flag toggle button with language detection
- `src/app/page.tsx` - Added `notranslate` class to hero section

**How it works:**
1. Google Translate API loads on page load
2. React component monitors Google Translate's internal state
3. User clicks flag → programmatically triggers Google Translate
4. Page content translates in real-time (except elements with `notranslate` class)
5. Flag icon updates to show opposite language
6. Translation persists as user navigates the site

**Key implementation details:**
- Uses `useEffect` hook to monitor language state every second
- Accesses `.goog-te-combo` dropdown programmatically
- Triggers language change via `dispatchEvent(new Event('change'))`
- `notranslate` class prevents "RedOnion" from translating

### 🎭 Customization

To add/remove languages, edit `src/app/layout.tsx`:

```typescript
includedLanguages: 'es,pt,en,fr,de', // Add more language codes
```

Common language codes:
- `es` - Spanish
- `pt` - Portuguese
- `en` - English
- `fr` - French
- `de` - German
- `it` - Italian
- `zh-CN` - Chinese (Simplified)

### ⚠️ Note

Translation quality depends on Google Translate. For mission-critical content or perfect translations, consider professional translation services. However, Google Translate provides excellent quality for general use!

---

**Setup time:** 5 minutes
**Cost:** FREE
**Maintenance:** ZERO
