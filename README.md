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

6. Use the seeded credentials to sign in:
   - Lecturer: `lecturer@example.com` / `LecturerPass123!`
   - Student: `student@example.com` / `StudentPass123!`
   - Optional for invite links in development: set `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Running the Application

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Fully In Docker

Build and start both app + database:
```bash
docker compose up --build
```

Run in background:
```bash
docker compose up --build -d
```

Stop services:
```bash
docker compose down
```

The app will be available at [http://localhost:3000](http://localhost:3000).
On startup, the app container runs `prisma migrate deploy` automatically before `next start`.

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
