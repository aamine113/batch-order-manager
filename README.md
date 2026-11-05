# Batch Order Manager

Order manager for group order batches with a weight limit. NestJS, TypeScript, MongoDB.

## Local setup

Requirements: Node 24 LTS and Docker.

```bash
# MongoDB as a single-node replica set (transactions need one)
docker compose up -d

cd backend
npm install

# Environment: fill in JWT_SECRET (openssl rand -base64 48)
cp .env.example .env

# Create the admin account (prompts for a password unless ADMIN_PASSWORD is set)
npm run build && npm run seed:admin

npm run start:dev
```

## Manual API requests

`backend/http/*.http` holds example requests for each module, for the VS Code REST Client extension. `auth.http` reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`, so set `ADMIN_PASSWORD` there to use it.

## Checks

```bash
cd backend
npm run lint && npm run build && npm test
```
