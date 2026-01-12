# Nuxt FS Template

Full-stack Nuxt application template with Google OAuth, PostgreSQL, and i18n. Based on the [Nuxt UI Pro SaaS template](https://saas-template.nuxt.dev/).

## Features

- **Google OAuth** - Secure authentication with nuxt-auth-utils
- **PostgreSQL + Drizzle ORM** - Type-safe database queries
- **i18n** - Multi-language support (EN/ES)
- **Nuxt UI 4** - 100+ components with Tailwind CSS
- **Nuxt Content** - File-based CMS for docs and blog
- **Dark Mode** - System preference detection
- **SEO** - SSR, meta tags, OG images

## Quick Start

```bash
# Clone
git clone https://github.com/codecavear/nuxt-fs-template.git my-app
cd my-app

# Install
bun install

# Configure
cp .env.example .env
# Edit .env with your credentials

# Database
bun db:generate
bun db:migrate

# Run
bun dev
```

## Environment Variables

```bash
NUXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NUXT_SESSION_PASSWORD=your-32-char-minimum-secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google`

### Generate Session Secret

```bash
openssl rand -base64 32
```

## Commands

```bash
bun dev           # Development server
bun build         # Production build
bun preview       # Preview production

bun db:generate   # Generate migrations
bun db:migrate    # Run migrations
bun db:studio     # Drizzle Studio

bun lint          # ESLint
bun typecheck     # TypeScript check
```

## Project Structure

```
├── app/
│   ├── components/       # Vue components
│   ├── layouts/          # Page layouts
│   ├── middleware/auth.ts
│   └── pages/
│       ├── login.vue     # OAuth login
│       ├── index.vue     # Landing
│       ├── pricing.vue
│       ├── blog/
│       └── docs/
├── server/
│   ├── routes/auth/      # OAuth handlers
│   ├── database/schema.ts
│   └── utils/db.ts
├── i18n/locales/         # Translations
├── content/              # Markdown content
└── public/               # Static assets
```

## Tech Stack

- [Nuxt 4](https://nuxt.com/)
- [Nuxt UI 4](https://ui.nuxt.com/)
- [Nuxt Content](https://content.nuxt.com/)
- [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils)
- [Drizzle ORM](https://orm.drizzle.team/)
- [PostgreSQL](https://www.postgresql.org/)
- [@nuxtjs/i18n](https://i18n.nuxtjs.org/)

## License

MIT
