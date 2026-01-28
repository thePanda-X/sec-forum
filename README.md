# SEC Forum

A modern forum application for security discussions, built as a full-stack application with React and Bun.

## Features

- **User Authentication** - Secure login/registration with JWT tokens and bcrypt password hashing
- **Posts & Comments** - Create, read, edit, and delete posts with threaded comments
- **Categories & Tags** - Organize discussions by categories and searchable tags
- **User Profiles** - Customizable user profiles with post history
- **Admin Panel** - Administrative tools for content moderation and user management
- **Notifications** - Real-time notifications for mentions and replies
- **Rich Text Editor** - Markdown support with syntax highlighting and LaTeX support

## Tech Stack

### Backend
- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [Elysia](https://elysiajs.com/)
- **Database:** SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** JWT with bcrypt
- **API Documentation:** Swagger/OpenAPI

### Frontend
- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** React 19 with TypeScript
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS with Radix UI components
- **Rich Text:** marked, dompurify, KaTeX for math, highlight.js for code

## Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd sec-forum
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Setup](#environment-setup) below).

4. **Start the development servers:**
   ```bash
   bun run dev
   ```
   
   This will start both the backend and frontend servers simultaneously:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:3001
   - API Docs: http://localhost:3000/api/v1/docs

## Environment Setup

Copy `.env.example` to `.env` and configure the following variables:

```env
# Backend Configuration
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend Configuration
FRONTEND_PORT=3001
BACKEND_URL=http://localhost:3000

# Database (SQLite)
DATABASE_URL=./data.db

# Admin User Seeding
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Logging
LOG_LEVEL=INFO

# Environment
NODE_ENV=development
```

**Security Warning:** Change `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` for production environments!

## Project Structure

```
sec-forum/
├── backend/              # Backend API server
│   ├── src/
│   │   ├── db/         # Database schema, migrations, seeding
│   │   ├── routes/     # API route controllers
│   │   ├── middleware/ # Authentication & middleware
│   │   └── utils/      # Utility functions
│   ├── migrations/     # SQL migration files
│   └── package.json
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities and helpers
│   │   └── index.ts    # Entry point
│   └── package.json
├── .env.example         # Environment template
└── package.json         # Root package with monorepo scripts
```

## Development Workflow

### Running the Full Stack

Start both backend and frontend together:

```bash
bun run dev
```

### Running Individual Services

Run only the backend:

```bash
bun run dev:backend
```

Run only the frontend:

```bash
bun run dev:frontend
```

### Database Commands

From the `backend/` directory:

```bash
bun run db:setup    # Complete first-time setup
bun run db:migrate  # Run database migrations
bun run db:seed     # Seed admin user and categories
bun run db:push     # Push schema changes to database
bun run db:studio   # Open Drizzle Studio (database GUI)
```

**Auto-Seeding:** The backend automatically creates an admin user on first startup if one doesn't exist, using credentials from `.env`.

## Default Admin Credentials

After first run, the default admin account is:

- **Email:** `admin@example.com` (or your `ADMIN_EMAIL`)
- **Password:** `admin123` (or your `ADMIN_PASSWORD`)

**Security Warning:** Change these credentials immediately for production!

## Deployment

### Building for Production

1. **Build the backend:**
   ```bash
   cd backend
   bun run build
   ```

2. **Build the frontend:**
   ```bash
   cd frontend
   bun run build
   ```

### Running Production Servers

1. **Set production environment:**
   ```bash
   export NODE_ENV=production
   ```

2. **Start the backend server:**
   ```bash
   cd backend
   bun run start
   ```

3. **Start the frontend server:**
   ```bash
   cd frontend
   bun start
   ```

### Production Considerations

- **Environment:** Ensure `NODE_ENV=production` is set
- **Database:** Configure `DATABASE_URL` to your production database path
- **JWT Secret:** Use a strong, unique `JWT_SECRET` (32+ characters recommended)
- **Admin Credentials:** Change default admin email and password
- **Frontend URL:** Update `FRONTEND_PORT` and `BACKEND_URL` for your domain
- **Logging:** Set `LOG_LEVEL` appropriately (e.g., ERROR for production)

### Deployment Options

#### Using Bun

The simplest deployment method is to use Bun directly:

```bash
# Install dependencies
bun install

# Build and start
NODE_ENV=production bun run build && NODE_ENV=production bun run start
```

#### Process Manager (PM2)

For production environments, consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start backend/src/index.ts --name "sec-forum-backend"
pm2 start frontend/src/index.ts --name "sec-forum-frontend"
pm2 startup
pm2 save
```

#### Reverse Proxy (Nginx)

Configure Nginx as a reverse proxy to serve both applications:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Documentation

- [Backend README](./backend/README.md) - Detailed backend setup and API documentation
- [Frontend README](./frontend/README.md) - Frontend development guide
- [API Documentation](http://localhost:3000/api/v1/docs) - Interactive Swagger UI (when server is running)

## License

MIT License - see LICENSE file for details.
