// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Flatten component names so nested files are referenced by filename only
  // (e.g. <ChartTab/>, <PatientHeader/> — not <PatientChartTab/>).
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@nuxtjs/supabase',
  ],

  // Smooth page transition (CSS lives in main.css under .page-*)
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0d7d76' },
      ],
      link: [{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    },
  },

  // ---- Internationalisation (English + Arabic with RTL) ----
  i18n: {
    strategy: 'no_prefix',        // keep clean URLs; switch language in-place
    defaultLocale: 'en',
    lazy: true,
    langDir: 'locales',
    locales: [
      { code: 'en', name: 'English', language: 'en-US', dir: 'ltr', file: 'en.ts' },
      { code: 'ar', name: 'العربية', language: 'ar-EG', dir: 'rtl', file: 'ar.ts' },
    ],
    detectBrowserLanguage: false,
  },

  // ---- Progressive Web App ----
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Mareedy — Critical Care Ward',
      short_name: 'Mareedy',
      description: 'Bed & patient management for critical care.',
      theme_color: '#0d7d76',
      background_color: '#eaf0f1',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
    },
    client: { installPrompt: true },
    // Service worker OFF in dev (avoids stale-cache confusion).
    // Test the PWA with: npm run build && npm run preview
    devOptions: { enabled: false },
  },

  // ---- Supabase (enabled in README §5) ----
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login'],
    },
  },
})
