# FavSetter

Professional web application for organizing and annotating favorite links with automatic metadata extraction, rating system, tagging, and domain-based grouping. Built with Next.js (App Router) and Prisma (SQLite).

## Core Features

- User authentication (login, logout, JWT in httpOnly cookie)
- Favorites management (create, list, rate, delete, assign tags)
- Automatic metadata extraction (title, description, domain) using server-side fetch + Cheerio
- Tagging system (user‑scoped free-form tags, optional color, many-to-many relation)
- Rating system (1–5 stars)
- Client-side search & filtering (title, domain, tags, URL)
- Domain grouping for quick overview
- Responsive UI based on shadcn/ui, Radix UI, Tailwind CSS

## Tech Stack

- Next.js 15 (App Router, React 19)
- TypeScript
- Prisma ORM with SQLite
- Authentication: JSON Web Tokens (jsonwebtoken) + httpOnly cookie
- Styling: Tailwind CSS
- UI Components: shadcn/ui, Radix UI, Lucide Icons
- Metadata parsing: Cheerio

## Requirements

- Node.js >= 24 (see `package.json` engines)
- npm (or a compatible package manager)

## Directory Structure (excerpt)

```
src/
  app/
    api/
      auth/login
      auth/logout
      favorites
      favorites/[id]
      tags
    dashboard
    login
    layout.tsx
  components/
    AddFavoriteDialog.tsx
    EditTagsDialog.tsx
    FavoriteCard.tsx
    TagInput.tsx
    ui/...
  lib/
    auth.ts
    db.ts
    metadata.ts
    utils.ts
  types/
    models.ts
prisma/
  schema.prisma
  seed.ts
Dockerfile
compose.yaml
```

## Data Model (simplified)

Key relations (see full `prisma/schema.prisma`):

```
User (1) ── (n) Favorite
User (1) ── (n) Tag
Favorite (n) ── (n) Tag   (Join: FavoriteTag)
```

Important fields:
- `Favorite`: `url`, `domain`, optional `title`, `description`, optional `rating` (1–5)
- `Tag`: unique `name` per user, optional `color`
- Join table `FavoriteTag` with composite primary key (`favoriteId`, `tagId`)

## Scripts

- `npm run dev` – Development (Turbopack)
- `npm run build` – Production build
- `npm run start` – Start after build
- `npm run lint` – ESLint
- `npm run typecheck` – TypeScript diagnostics
- `npm run db:generate` – Generate Prisma Client
- `npm run db:migrate` – Run dev migration (interactive)
- `npm run db:seed` – Execute seed script
- `npm run db:studio` – Launch Prisma Studio
- `npm run setup` – generate + migrate dev + seed

## Local Development (without Docker)

1. Clone repository
   ```bash
   git clone <repository-url>
   cd favsetter
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create environment file `.env` in project root
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="replace-with-your-secret"
   ```
4. Prepare database (migrate + seed)
   ```bash
   npm run setup
   ```
5. Start development server
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000

### Demo Accounts

- Demo: `demo@example.com` / `password123`
- Admin: `admin@favsetter.com` / `password123`

## Running with Docker (production or test)

### Build Image
```bash
docker build -t favsetter:latest .
```

### Run Container Directly
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="file:/db/favs.db" \
  -e JWT_SECRET="replace-with-your-secret" \
  -v $(pwd)/docker-data/db:/db \
  --name favsetter \
  favsetter:latest
```
On startup migrations are applied via `prisma migrate deploy`.

### Docker Compose
```bash
docker compose up -d --build
```
Configuration: `compose.yaml` (port 3000, volume for persistent SQLite). Environment variables via `.env` or direct export.

### Seeding in Docker
The default entrypoint only runs `migrate deploy`. To seed (e.g. first run):
```bash
docker exec -it favsetter sh -c "npx prisma db seed"
```
(Alternatively seed locally before building the production image.)

## Typical Workflows

Add new Prisma model -> create migration:
```bash
npx prisma migrate dev --name <description>
```
Production build and start:
```bash
npm run build
npm run start
```

## API Endpoints (excerpt)

- `POST /api/auth/login` – Login (JSON: `email`, `password`)
- `POST /api/auth/logout` – Logout
- `GET /api/favorites` – List favorites (auth required)
- `POST /api/favorites` – Create favorite (`url`, optional `rating`, `tags[]`)
- `PATCH /api/favorites/:id` – Update favorite (rating / tags)
- `DELETE /api/favorites/:id` – Delete favorite
- `GET /api/tags?q=<filter>` – List tags
- `POST /api/tags` – Create tag (`name`, optional `color`)

Responses are JSON; 401 for unauthorized requests.

## Security Notes

- Default JWT secret in code is fallback only. In production you MUST set `JWT_SECRET`.
- Cookies: `httpOnly`, `sameSite=lax`, `secure` enabled in production.
- Password hashing via bcrypt (10 rounds). No plaintext logging.
- Prisma prevents SQL injection via parameterized queries.
- Server-side validation of inputs (URLs, tag names). Extend as needed (e.g. whitelists, rate limiting).

## Performance Considerations

- Metadata fetch with 10s timeout and defensive domain fallback; failures do not block creation.
- Prisma Client reused in dev through `globalThis` to avoid connection churn on hot reload.
- Turbopack for fast local iteration.

## Extensibility Ideas

- Background job for asynchronous metadata refresh
- Support for PostgreSQL or other databases (adjust datasource + run migrations)
- Full-text search indexing
- Role-based access control (currently simple user accounts)

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Prisma Client not generated" | Missing `node_modules` or client | Run `npm run db:generate` |
| Login fails | Invalid credentials | Use demo account or re-run seed |
| Migration fails in Docker | Outdated migration files in image | Rebuild image or `docker exec ... npx prisma migrate deploy` |
| Port 3000 in use | Port conflict | Map different port: `-p 4000:3000` |

## License

MIT License (see LICENSE if present).

## Disclaimer

This repository is a reference implementation for a Next.js + Prisma application. Before production usage add logging, monitoring, rate limiting, and secure secret management (e.g. Vault or platform secret store).
