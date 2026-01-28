# SEC Forum Backend

Backend API server for the SEC Forum application, built with Bun, Elysia, and Drizzle ORM.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher
- SQLite (included with most systems)

### Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd sec-forum/backend
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Setup database and seed** (one-time setup):
   ```bash
   bun run db:setup
   ```
   
   This command will:
   - Create `.env` from `.env.example` if it doesn't exist
   - Run database migrations
   - Seed the admin user and default categories
   - Display your admin credentials

4. **Start the development server**:
   ```bash
   bun run dev
   ```

The API will be available at `http://localhost:3000`

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Backend Configuration
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production

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

**Important:** Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` before first run, especially for production!

## Database Commands

| Command | Description |
|---------|-------------|
| `bun run db:setup` | Complete first-time setup (creates .env, migrates, seeds) |
| `bun run db:migrate` | Run database migrations |
| `bun run db:seed` | Seed admin user and categories (interactive prompts) |
| `bun run db:push` | Push schema changes to database |
| `bun run db:studio` | Open Drizzle Studio (database GUI) |

## Auto-Seeding

The backend automatically checks for an admin user on startup:

- **If no admin exists:** Automatically creates one using credentials from `.env`
- **If admin exists:** Skips seeding

This means after cloning the project, you can simply run:

```bash
bun install
bun run dev
```

And the database will be automatically set up and seeded!

## Manual Seeding

If you prefer to seed manually or want to change admin credentials:

```bash
bun run db:seed
```

The script will:
- Prompt for email/password if not in `.env`
- Create or update the admin user
- Add default categories (if they don't exist)
- Display a summary of what was seeded

## API Documentation

Once the server is running, visit:

- **Swagger UI:** `http://localhost:3000/api/v1/docs`
- **API Base:** `http://localhost:3000/api/v1`

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── index.ts         # Database connection
│   │   ├── schema.ts        # Database schema (Drizzle)
│   │   ├── migrate.ts       # Migration runner
│   │   ├── seed.ts          # Database seeding script
│   │   ├── auto-seed.ts     # Auto-seed on startup
│   │   └── setup.ts         # Combined setup script
│   ├── routes/              # API route controllers
│   ├── middleware/          # Authentication & middleware
│   ├── utils/               # Utility functions
│   └── index.ts             # Server entry point
├── migrations/              # SQL migration files
├── .env.example             # Environment template
└── package.json
```

## Default Admin Credentials

After seeding, the default admin account is:

- **Email:** `admin@example.com` (or your `ADMIN_EMAIL`)
- **Password:** `admin123` (or your `ADMIN_PASSWORD`)

**Security Warning:** Change these immediately for production environments!

## Default Categories

The seeding process creates these security-focused categories:

1. Threat Intelligence
2. Penetration Testing
3. Malware Analysis
4. Network Security
5. Cryptography
6. Phishing

## Development

### Running in watch mode:
```bash
bun run dev
```

### Building for production:
```bash
bun run build
```

### Starting production server:
```bash
bun run start
```

## Troubleshooting

### Database not found / Migration errors

If you see database errors:

```bash
# Run migrations manually
bun run db:migrate

# Then seed
bun run db:seed
```

### Admin already exists but password doesn't work

Re-run the seed script to update the password:

```bash
bun run db:seed
```

The script will detect the existing admin and update their password.

### "ADMIN_EMAIL not found" warning

Either:
1. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to your `.env` file, or
2. The seed script will prompt you interactively (if running in a terminal)

### Path resolution errors

Make sure you're running commands from the `backend/` directory:

```bash
cd backend
bun run db:seed
```

### Auto-seed not working

Check that:
1. `.env` file exists with admin credentials
2. Database migrations have run successfully
3. Check server logs for auto-seed messages

You can always seed manually:
```bash
bun run db:seed
```

## Technologies Used

- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [Elysia](https://elysiajs.com/)
- **Database:** SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** JWT with bcrypt password hashing
- **API Docs:** Swagger/OpenAPI

## License

[Add your license here]
