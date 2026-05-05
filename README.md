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
   - Lecturer: `l@example.com` / `LP123!`
   - Student: `s@example.com` / `SP123!`
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
Docker Compose also starts Redis for distributed rate limiting and a Python slide extractor microservice.

### Slide Text Extraction Microservice

Lecture slide uploads now run through a Python FastAPI microservice (`services/slide-extractor`) that extracts text from PDF and PPTX files.

- Internal service URL: `SLIDE_EXTRACTOR_URL` (default: `http://slide-extractor:8000` in Docker)
- Health endpoint: `GET /health`
- Extraction endpoint: `POST /extract` (multipart file upload)
- Supported input formats (v1): PDF and PPTX only
- If extraction fails or returns no text, topic generation is blocked with a clear error.

### Media Storage

The app now uses a storage-first media pipeline for lecturer-uploaded images/videos.

- Default local mode (development): set `MEDIA_PROVIDER=local`
- In Docker local mode, uploads are written to `/app/public/uploads`, which is mounted to the named Docker volume `app_uploads`; uploaded images/videos survive container recreation and rebuilds as long as the volume is not removed.
- S3 mode: set `MEDIA_PROVIDER=s3` and configure:
  - `AWS_REGION`
  - `AWS_S3_BUCKET`
  - `AWS_S3_PREFIX` (optional)
  - `AWS_S3_PUBLIC_BASE_URL` (optional CloudFront/custom domain base URL)
- To intentionally delete Docker-hosted uploaded media, remove the `app_uploads` volume, for example with `docker compose down -v`.

AI media generation is disabled by default. To re-enable the placeholder endpoint:

- `ENABLE_AI_MEDIA_GENERATION=true`
- and configure Gemini variables if you plan to use that route.

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
- `/services/slide-extractor` - Python microservice for synchronous slide text extraction
