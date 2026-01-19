# dissertation_code

This is the main app for my project - an educational analogy generation system for lecturers.

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose

### Database Setup

1. Start the PostgreSQL database:
   ```bash
   docker compose up -d
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

5. Seed the database with sample data:
   ```bash
   npm run db:seed
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Management

- **Prisma Studio**: Visual database editor
  ```bash
  npm run db:studio
  ```

- **Health Check**: Test database connection
  ```bash
  curl http://localhost:3000/api/health/db
  ```

For detailed database setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## Project Structure

- `/app` - Next.js application routes and pages
- `/prisma` - Database schema, migrations, and seed data
- `/app/lib` - Database client and utilities
- `/app/api` - API routes for analogies and health checks
