# GitHub Copilot Instructions

## Project Overview

This is a dissertation project for **CSC7058: Individual Software Development Project** - "Learning Through Analogies". The application enables lecturers to generate AI-powered analogies to supplement learning, and students to review concepts and take quizzes.

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Frontend**: React 19, Tailwind CSS 4
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI API for analogy generation
- **Build Tools**: ESLint 9, babel-plugin-react-compiler

## Architecture

- **App Structure**: Uses Next.js 16 App Router structure under `/app`
- **User Roles**: Two main user types (Student and Lecturer)
- **Pages**:
  - `/` - Landing page with sign-in
  - `/student` - Student dashboard
  - `/lecturer` - Lecturer dashboard
- **Database**: Prisma with PostgreSQL adapter (`@prisma/adapter-pg`)
- **API Routes**: Located in `/app/api`

## Code Style and Patterns

### Component Guidelines
- Use functional React components with hooks
- File extensions: `.jsx` for React components, `.js` for API routes
- Use modern React patterns (React 19 features)
- Components should use Tailwind CSS for styling

### Styling
- **Framework**: Tailwind CSS 4 with PostCSS
- **Theme**: Dark mode (slate-900 background with slate/indigo accents)
- **Colors**: 
  - Primary: indigo-400/indigo-500
  - Background: slate-900/slate-950
  - Text: slate-100/slate-300
  - Borders: slate-700/slate-800

### Database
- **ORM**: Prisma Client
- **Naming**: Use camelCase for model fields
- **Schema Location**: `/prisma/schema.prisma`
- **Key Models**:
  - `AnalogySet`: Stores generated analogies with status tracking
- Run migrations with: `npx prisma migrate dev`
- Generate client with: `npx prisma generate`

### API Routes
- Use Next.js 16 App Router API routes (named `route.js` in `/app/api/` directories)
- Handle errors gracefully with appropriate HTTP status codes
- Use async/await for database operations

## Development Workflow

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Testing and Validation
- Run linting before committing: `npm run lint`
- Test builds locally: `npm run build`
- Verify database connectivity when working with Prisma

### Environment Variables
- Database connection should be configured via environment variables
- OpenAI API key required for analogy generation features

## Best Practices

1. **Minimal Changes**: Make the smallest possible changes to achieve the goal
2. **Component Reusability**: Extract reusable UI patterns
3. **Error Handling**: Always handle errors in API routes and display user-friendly messages
4. **Type Safety**: While strict mode is off, still aim for predictable types
5. **Database Operations**: Use Prisma's type-safe query API
6. **Performance**: Leverage Next.js features like server components and streaming
7. **Accessibility**: Ensure forms and interactive elements have proper labels

## File Organization

```
/app
  /api           - API route handlers
  /lecturer      - Lecturer-specific pages
  /student       - Student-specific pages
  /lib           - Shared utilities and database client
  layout.jsx     - Root layout
  page.jsx       - Home page
/prisma
  schema.prisma  - Database schema
  /migrations    - Database migrations
```

## Common Tasks

### Adding a New Page
1. Create a new directory under `/app`
2. Add `page.jsx` for the route
3. Use consistent styling (slate/indigo theme)
4. Import from `next/link` for navigation

### Adding a New API Route
1. Create a new directory under `/app/api/[route-name]`
2. Add `route.js` file (this naming is required for Next.js App Router API routes)
3. Export HTTP method handlers (GET, POST, etc.)
4. Use Prisma client for database operations
5. Return proper JSON responses with status codes

### Database Changes
1. Update `/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive-name>`
3. Prisma Client will be regenerated automatically

### Adding New Dependencies
- Verify compatibility with Next.js 16 and React 19
- Update `package.json` and run `npm install`

## Notes for AI Assistance

- This is an academic project (dissertation)
- Focus on learning outcomes and clarity
- The application demonstrates AI-enhanced educational tools
- Maintain the existing dark theme aesthetic
- Keep the user experience simple and intuitive
