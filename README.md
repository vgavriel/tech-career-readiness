Tech Career Readiness is a self-paced learning app for college students. It's built with Next.js, Prisma, and Postgres.

## Getting started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Copy the example env file and set your database connection string.
```bash
cp .env.example .env
```

`DATABASE_URL` is required for Prisma CLI and seeding. Prisma 7 reads datasource config from `prisma.config.ts`.

### 3) Apply migrations and seed data
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 4) Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Notes
- App code lives in `src/app`.
- Prisma schema lives in `prisma/schema.prisma`.
- Seeding uses the Postgres adapter (`@prisma/adapter-pg`) and `pg`.

## References
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
