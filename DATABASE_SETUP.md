# Database Setup Guide

This guide explains how to set up and connect to the PostgreSQL database for this project.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm installed

## Quick Start

### 1. Start the PostgreSQL Database

Start the PostgreSQL container using Docker Compose:

```bash
docker-compose up -d
```

This will start a PostgreSQL database on `localhost:5432` with:
- Database name: `dissertation_db`
- Username: `postgres`
- Password: `password`

### 2. Configure Environment Variables

Copy the example environment file and update it if needed:

```bash
cp .env.example .env
```

The `.env` file should contain:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/dissertation_db?schema=public"
OPENAI_API_KEY="your-openai-api-key-here"
```

### 3. Run Database Migrations

Apply the database schema migrations:

```bash
npx prisma migrate deploy
```

Or, if you're in development and want to push the schema directly:

```bash
npm run db:push
```

### 4. Generate Prisma Client

Generate the Prisma client for type-safe database access:

```bash
npx prisma generate
```

### 5. Seed the Database

Populate the database with sample data:

```bash
npm run db:seed
```

This will create sample `AnalogySet` records with various statuses (ready, processing, failed) and sample educational analogies.

## Verify Database Connection

You can verify the database connection by:

1. **Using the health check endpoint** (when the app is running):
   ```bash
   curl http://localhost:3000/api/health/db
   ```

2. **Using Prisma Studio** (visual database browser):
   ```bash
   npm run db:studio
   ```
   This will open a web interface at `http://localhost:5555` where you can browse and edit your data.

## Sample Data

The seed script creates 5 sample AnalogySet records:

1. **Microservices Architecture** (ready) - Contains analogy about food trucks
2. **HTTP & REST APIs** (ready) - Contains analogies about postal service and government office windows
3. **Database Indexing** (ready) - Contains analogies about textbook indexes and student IDs
4. **Git Version Control** (processing) - Simulates a record still being processed
5. **Machine Learning Basics** (failed) - Simulates a failed processing attempt

## Useful Scripts

- `npm run db:migrate` - Run migrations in production
- `npm run db:push` - Push schema changes directly (development)
- `npm run db:seed` - Seed the database with sample data
- `npm run db:reset` - Reset database and rerun migrations (⚠️ deletes all data)
- `npm run db:studio` - Open Prisma Studio GUI

## Database Schema

The main model is `AnalogySet`:

```prisma
model AnalogySet {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  status    String   @default("processing") // processing | ready | failed
  
  ownerRole String   @default("lecturer")
  title     String?
  source    String?
  
  sourceText String?
  topicsJson Json?
  
  errorMessage String?
}
```

## Troubleshooting

### Connection Issues

If you can't connect to the database:

1. Check if the Docker container is running:
   ```bash
   docker ps | grep dissertation_postgres
   ```

2. Check the container logs:
   ```bash
   docker logs dissertation_postgres
   ```

3. Verify the DATABASE_URL in your `.env` file matches the docker-compose.yml settings

### Reset Everything

To completely reset the database:

```bash
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
```

## Production Deployment

For production deployments:

1. Use a managed PostgreSQL service (e.g., AWS RDS, Heroku Postgres, Supabase)
2. Update the `DATABASE_URL` in your production environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Do NOT run the seed script in production unless you want sample data
