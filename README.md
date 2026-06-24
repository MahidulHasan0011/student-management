# Student Management System

Express + PostgreSQL API for managing students, teachers, classes, exams, results, ranking (with auto roll/rank generation), attendance, and RBAC.

## Stack

- Node.js >= 18 (ESM, `"type": "module"`)
- Express 5
- PostgreSQL via `pg` (raw SQL in repositories, `withTransaction()` helper)
- Redis 4 (token store + permission cache)
- BullMQ (queues + workers for ranking/roll generation)
- JWT (15 min access + 7 day refresh with rotation), bcryptjs for passwords

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

## Setup

```bash
npm install
```

Create a `.env` file in the repo root with at least:

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://user:password@localhost:5432/student_management

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

BCRYPT_ROUNDS=12
```

## Database setup (run in order)

```bash
npm run db:schema     # create tables + enums
npm run db:migrate    # ranking lock/history tables + exam status enum
npm run db:views      # 4 reporting views (merit list, student profile, ...)
npm run db:seed       # default roles, permissions, super-admin
```

Shortcut for the full bootstrap:

```bash
npm run db:init
```

Reset to a clean state:

```bash
npm run db:fresh      # truncate everything, then re-seed
```

Default super-admin (change the password after first login):

```
email:    admin@school.com
password: Admin@1234
```

## Run

```bash
npm run dev           # nodemon
npm start             # production
```

- Health: `GET http://localhost:4000/health`
- API base: `http://localhost:4000/api/v1`

## Quality

```bash
npm run lint
npm run format:check
```

## Project layout

```
src/
  server.js, app.js          entry + Express config
  api/v1/index.js            route mounting
  config/                    env, db pool + withTransaction, redis client
  modules/<name>/            repository → service → controller → routes
  core/                      pure business engines (ranking, roll, attendance, permission)
  services/                  cache + queue (BullMQ) wrappers
  queues/, jobs/             BullMQ queue defs + worker processors
  middlewares/               auth (JWT), rbac (permission-name based), error
  utils/                     AppError, response, pagination, queryBuilder, order
database/
  schema.sql, seed.sql       canonical DDL + default data
  migrations/                additive ALTERs (run by db:migrate)
  views/                     4 reporting views (run by db:views)
  db-init.js, db-truncate.js script entrypoints
```

See `.speclet/plans/requirements.md` for the full feature spec and business rules.
