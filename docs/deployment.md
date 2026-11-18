# Production deployment

This guide is for a first public deployment on a Linux server. The application container, PostgreSQL database, and Caddy HTTPS reverse proxy run with Docker Compose.

## Before accepting real users

- Place the application and the PostgreSQL database in a Kazakhstan data center. Article 12 of Kazakhstan's Personal Data Law says databases containing personal data are stored in Kazakhstan. Confirm the provider's actual data-center location and backup location.
- The repository's default Prisma schema is SQLite for local development. The production container explicitly generates its client from `prisma/schema.postgres.prisma`.
- Keep `AI_PROVIDER=mock` for a private pilot. The Gemini and OpenAI providers send conversation text to those external services; review their data-processing terms and the project's consent/privacy language before enabling either.
- Do not run `npm run prisma:seed` in production. It creates shared demo accounts with a known password. The command refuses to run when `NODE_ENV=production`.
- This prototype has not had an independent security, privacy, or clinical-safety review. Complete those reviews and define staffed crisis-response procedures before inviting the public.

## Server and domain

1. Rent a Linux cloud server in Kazakhstan from a provider that confirms the server and backups remain in Kazakhstan.
2. Register a domain and point its DNS `A` record to the server's public IP. Point `AAAA` only if IPv6 is configured.
3. Allow inbound TCP ports 80 and 443 for the web proxy. Restrict SSH to the operator's trusted addresses. PostgreSQL is not published on a public port by this Compose file.
4. Install Docker Engine and the Docker Compose plugin using the host OS vendor's instructions.
5. Place a copy of this repository on the server. Do not copy a local `.env`, database file, or user conversations to the image or source control.

## Configure secrets

Copy `.env.production.example` to `.env` on the server. Set `APP_HOST` and `APP_URL` to the chosen domain. Generate separate random values for `POSTGRES_PASSWORD` and `SESSION_SECRET`; use at least 32 random bytes for the session secret. `DATABASE_URL` must use the same PostgreSQL username/password/database as the `POSTGRES_*` values and the internal hostname `postgres`.

Keep `.env` private and out of Git. Use URL-encoded credentials if you choose a database password containing URL-reserved characters. `SESSION_SECRET` must not be the sample value; the app refuses known placeholders and weak production secrets.

## First deployment

From the project directory on the server:

```sh
docker compose build
docker compose up -d postgres
docker compose run --rm sino-app npm run prisma:push:production
docker compose up -d
```

The schema push is for the initial empty database only. Back up the database before any later schema change; do not use `db push` as an unreviewed production migration process.

Create the first administrator once. Set `ADMIN_BOOTSTRAP_EMAIL` and a unique password of at least 16 characters in the server shell environment, then run:

```sh
docker compose run --rm -e ADMIN_BOOTSTRAP_EMAIL -e ADMIN_BOOTSTRAP_PASSWORD sino-app npm run admin:bootstrap
```

Unset both variables immediately afterward. The bootstrap command refuses to run outside production, refuses to overwrite an existing super administrator, and does not create demo staff accounts. Sign in at `https://<your-domain>/login`, then open `https://<your-domain>/admin`.

Caddy obtains and renews the HTTPS certificate automatically after DNS points at the server and ports 80/443 are reachable. Then verify registration, the admin dashboard, coordinator queue, backup restore, and error monitoring with synthetic data only.

## Operations

- Schedule encrypted PostgreSQL backups and regularly test restoring one. Store backup copies in Kazakhstan as well.
- Keep operating-system, Docker image, and application updates current; monitor disk space, database health, and application errors.
- Set `AI_PROVIDER=gemini` or `openai` only after reviewing where conversation data is processed and updating consent/privacy disclosures accordingly.
- Do not publish the development seed accounts or the local `.env` file.

