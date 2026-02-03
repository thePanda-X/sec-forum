#!/usr/bin/env bun
/**
 * Docker Initialization Script
 * 
 * This script handles the complete setup of the Docker environment:
 * 1. Checks for required files (.env)
 * 2. Generates database migrations if needed
 * 3. Builds and starts Docker containers
 * 4. Waits for services to be healthy
 * 5. Seeds the database with initial data
 * 
 * Usage: bun run docker:init
 */

import { $ } from "bun";
import { existsSync, copyFileSync, readFileSync } from "fs";
import { join } from "path";

const ROOT_DIR = import.meta.dir;
const ENV_FILE = join(ROOT_DIR, ".env");
const ENV_EXAMPLE = join(ROOT_DIR, ".env.example");

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, total: number, message: string) {
  log(`\n[${step}/${total}] ${message}`, "cyan");
}

function logSuccess(message: string) {
  log(`✅ ${message}`, "green");
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, "yellow");
}

function logError(message: string) {
  log(`❌ ${message}`, "red");
}

async function checkDocker(): Promise<boolean> {
  try {
    await $`docker --version`.quiet();
    await $`docker-compose --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function waitForHealthy(service: string, maxAttempts: number = 30): Promise<boolean> {
  log(`   Waiting for ${service} to be healthy...`, "blue");
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await $`docker-compose ps ${service} --format json`.quiet();
      const output = result.text();
      
      if (output.includes('"Health":"healthy"') || output.includes('healthy')) {
        return true;
      }
    } catch {
      // Service might not be ready yet
    }
    
    // Wait 2 seconds between checks
    await Bun.sleep(2000);
    process.stdout.write(".");
  }
  
  console.log();
  return false;
}

async function main() {
  const TOTAL_STEPS = 6;
  
  log("\n🐳 SEC Forum Docker Initialization", "bright");
  log("=".repeat(40), "blue");

  // Step 1: Check Docker is installed
  logStep(1, TOTAL_STEPS, "Checking Docker installation...");
  
  const dockerInstalled = await checkDocker();
  if (!dockerInstalled) {
    logError("Docker or Docker Compose is not installed!");
    log("   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop");
    process.exit(1);
  }
  logSuccess("Docker is installed");

  // Step 2: Check/create .env file
  logStep(2, TOTAL_STEPS, "Checking environment configuration...");
  
  if (!existsSync(ENV_FILE)) {
    if (existsSync(ENV_EXAMPLE)) {
      logWarning(".env file not found, creating from .env.example");
      copyFileSync(ENV_EXAMPLE, ENV_FILE);
      logSuccess("Created .env file from .env.example");
      logWarning("Please review and update .env with your production values!");
    } else {
      logError(".env.example not found! Cannot create environment file.");
      process.exit(1);
    }
  } else {
    logSuccess(".env file exists");
  }

  // Validate critical env vars
  const envContent = readFileSync(ENV_FILE, "utf-8");
  const warnings: string[] = [];
  
  if (envContent.includes("your-secure-database-password")) {
    warnings.push("POSTGRES_PASSWORD is using default value");
  }
  if (envContent.includes("your-super-secret-jwt-key-change-in-production")) {
    warnings.push("JWT_SECRET is using default value");
  }
  if (envContent.includes("ADMIN_PASSWORD=admin123")) {
    warnings.push("ADMIN_PASSWORD is using default value");
  }
  
  if (warnings.length > 0) {
    logWarning("Security warnings:");
    warnings.forEach(w => log(`   - ${w}`, "yellow"));
    log("   Consider updating these values in .env for production use.", "yellow");
  }

  // Step 3: Generate migrations if needed
  logStep(3, TOTAL_STEPS, "Checking database migrations...");
  
  const migrationsDir = join(ROOT_DIR, "backend", "migrations");
  const journalFile = join(migrationsDir, "meta", "_journal.json");
  
  let needsMigrations = false;
  
  if (!existsSync(migrationsDir)) {
    needsMigrations = true;
    log("   No migrations directory found", "blue");
  } else if (!existsSync(journalFile)) {
    needsMigrations = true;
    log("   No migrations journal found", "blue");
  } else {
    // Check if journal has entries and is for PostgreSQL
    try {
      const journal = JSON.parse(readFileSync(journalFile, "utf-8"));
      if (journal.dialect !== "postgresql") {
        needsMigrations = true;
        log("   Migrations are not for PostgreSQL, regenerating...", "blue");
      } else if (!journal.entries || journal.entries.length === 0) {
        needsMigrations = true;
        log("   No migration entries found", "blue");
      }
    } catch {
      needsMigrations = true;
      log("   Could not read migrations journal", "blue");
    }
  }
  
  if (needsMigrations) {
    log("   Installing dependencies and generating migrations...", "blue");
    
    try {
      await $`cd backend && bun install`.quiet();
      await $`cd backend && bunx drizzle-kit generate`;
      logSuccess("Database migrations generated");
    } catch (error) {
      logWarning("Could not generate migrations automatically");
      log("   You may need to run: cd backend && bun run db:generate", "yellow");
    }
  } else {
    logSuccess("PostgreSQL migrations are ready");
  }

  // Step 4: Build Docker images
  logStep(4, TOTAL_STEPS, "Building Docker images...");
  
  try {
    await $`docker-compose build`;
    logSuccess("Docker images built successfully");
  } catch (error) {
    logError("Failed to build Docker images");
    console.error(error);
    process.exit(1);
  }

  // Step 5: Start containers
  logStep(5, TOTAL_STEPS, "Starting Docker containers...");
  
  try {
    await $`docker-compose up -d`;
    logSuccess("Containers started");
  } catch (error) {
    logError("Failed to start containers");
    console.error(error);
    process.exit(1);
  }

  // Step 6: Wait for services to be healthy
  logStep(6, TOTAL_STEPS, "Waiting for services to be healthy...");
  
  const dbHealthy = await waitForHealthy("db", 30);
  if (!dbHealthy) {
    logWarning("Database health check timed out, but it might still be starting...");
  } else {
    logSuccess("Database is healthy");
  }
  
  const backendHealthy = await waitForHealthy("backend", 60);
  if (!backendHealthy) {
    logWarning("Backend health check timed out");
    log("   Check logs with: docker-compose logs backend", "yellow");
  } else {
    logSuccess("Backend is healthy (migrations and seeding complete)");
  }
  
  const frontendHealthy = await waitForHealthy("frontend", 30);
  if (!frontendHealthy) {
    logWarning("Frontend health check timed out");
    log("   Check logs with: docker-compose logs frontend", "yellow");
  } else {
    logSuccess("Frontend is healthy");
  }

  // Final summary
  log("\n" + "=".repeat(40), "blue");
  log("🎉 SEC Forum Docker Setup Complete!", "bright");
  log("=".repeat(40), "blue");
  
  log("\n📍 Access your application:", "cyan");
  log("   Frontend:  http://localhost:3001", "green");
  log("   API:       http://localhost:3000/api/v1", "green");
  log("   API Docs:  http://localhost:3000/api/v1/docs", "green");
  
  log("\n📝 Default admin credentials:", "cyan");
  log("   Email:    admin@example.com", "yellow");
  log("   Password: admin123", "yellow");
  log("   (Change these in .env for production!)", "yellow");
  
  log("\n🛠️  Useful commands:", "cyan");
  log("   View logs:      docker-compose logs -f", "blue");
  log("   Stop:           docker-compose down", "blue");
  log("   Restart:        docker-compose restart", "blue");
  log("   Rebuild:        docker-compose up --build -d", "blue");
  
  log("\n");
}

main().catch((error) => {
  logError("Initialization failed!");
  console.error(error);
  process.exit(1);
});
