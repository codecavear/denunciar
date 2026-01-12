# Nuxt FS Template

Full-stack Nuxt application template with Google OAuth, PostgreSQL database, and i18n support. Based on the Nuxt UI Pro SaaS template.

## Tech Stack

### Frontend
- **Nuxt 4** - Vue framework with SSR
- **Nuxt UI 4** - Component library with Tailwind CSS
- **Nuxt Content** - File-based CMS for docs/blog
- **VueUse** - Vue composition utilities
- **TypeScript**

### Backend
- **Nitro Server** - Nuxt's built-in server
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries

### Authentication
- **nuxt-auth-utils** - OAuth and session management
- Google OAuth with secure redirect handling

### Internationalization
- **@nuxtjs/i18n** - Multi-language support
- Configured: English (default), Spanish
- Browser language detection

## Project Structure

```
nuxt-fs-template/
├── app/
│   ├── components/       # Vue components
│   ├── layouts/          # Page layouts (default, auth, docs)
│   ├── middleware/
│   │   └── auth.ts       # Route protection middleware
│   ├── pages/
│   │   ├── login.vue     # Google OAuth login
│   │   ├── index.vue     # Landing page
│   │   ├── pricing.vue   # Pricing page
│   │   ├── blog/         # Blog pages
│   │   ├── docs/         # Documentation pages
│   │   └── changelog/    # Changelog page
│   └── assets/css/
├── server/
│   ├── routes/auth/
│   │   ├── google.get.ts # Google OAuth handler
│   │   └── logout.get.ts # Logout handler
│   ├── database/
│   │   └── schema.ts     # Drizzle schema (users table)
│   ├── utils/
│   │   └── db.ts         # Database connection
│   └── types/
│       └── auth.d.ts     # User session types
├── i18n/
│   └── locales/
│       ├── en.json       # English translations
│       └── es.json       # Spanish translations
├── content/              # Markdown content (docs, blog, changelog)
├── public/               # Static assets and icons
├── nuxt.config.ts        # Nuxt configuration
├── drizzle.config.ts     # Drizzle Kit configuration
└── package.json
```

## Database Schema

### Users
```sql
users
├── id (uuid, PK)
├── google_id (unique, not null)
├── email (unique, not null)
├── name (not null)
├── avatar_url
├── created_at
└── updated_at
```

## Authentication Flow

1. User clicks "Continue with Google" on `/login`
2. Redirected to Google OAuth
3. On success, `server/routes/auth/google.get.ts`:
   - Finds or creates user by Google ID
   - Updates user info (name, email, avatar)
   - Sets session cookie
   - Redirects to original destination (or home)
4. Protected routes use `middleware/auth.ts`
5. Logout via `/auth/logout` clears session

## Commands

```bash
# Development
bun dev

# Build
bun build

# Preview production
bun preview

# Database
bun db:generate   # Generate migrations
bun db:migrate    # Run migrations
bun db:studio     # Open Drizzle Studio

# Linting
bun lint
bun typecheck
```

## Environment Variables

```bash
# Public URL
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Session secret (openssl rand -base64 32)
NUXT_SESSION_PASSWORD=your-32-char-minimum-secret
```

## Icons

Uses Nuxt UI built-in Iconify support:
- Lucide icons: `i-lucide-{name}`
- Simple Icons: `i-simple-icons-{name}`

## Key Files

| File | Purpose |
|------|---------|
| `nuxt.config.ts` | App config, modules, i18n, runtimeConfig |
| `server/routes/auth/google.get.ts` | Google OAuth with redirect handling |
| `server/database/schema.ts` | Drizzle schema definitions |
| `app/middleware/auth.ts` | Route protection |
| `app/pages/login.vue` | Login page with OAuth |

## Adding Protected Routes

```vue
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

## Accessing User Session

```vue
<script setup>
const { loggedIn, user } = useUserSession()
</script>

<template>
  <div v-if="loggedIn">
    Welcome, {{ user.name }}!
  </div>
</template>
```

## API Authentication

```ts
// In server/api/*.ts
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  // Use session.user.id for queries
})
```
