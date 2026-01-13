// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'nuxt-auth-utils',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  },

  routeRules: {},

  compatibilityDate: '2024-07-11',

  i18n: {
    locales: [
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'es',
    langDir: 'translations',
    strategy: 'no_prefix',
    bundle: {
      fullInstall: true
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'es'
    }
  },

  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD,
    openaiApiKey: process.env.OPENAI_API_KEY,
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectURL: process.env.NUXT_OAUTH_GOOGLE_REDIRECT_URL
      }
    },
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      googleMapsMapId: process.env.NUXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ''
    }
  },

  nitro: {
    serverAssets: [
      {
        baseName: 'migrations',
        dir: 'drizzle/migrations'
      }
    ],
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  experimental: {
    typedPages: false
  }
})
