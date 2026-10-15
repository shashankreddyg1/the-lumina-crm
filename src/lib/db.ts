import { PrismaClient } from "@prisma/client";

/**
 * True when no DATABASE_URL is set. The app then runs fully in-memory:
 * every API route and page serves the demo store, and the AI pipeline
 * returns mock output. Zero config, zero cost — built for the live demo.
 */
export const isDemoMode = !process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Prisma client, or null in demo mode. Lazily created so importing this
 * module never throws when no database is configured.
 */
export function getDb(): PrismaClient | null {
  if (isDemoMode) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * The app is single-tenant for demo purposes: all records belong to one
 * workspace owner. This lazily creates that owner so the API works right after
 * `npx prisma db push` with no manual seeding step.
 */
export async function getOrCreateDemoUser() {
  const database = getDb();
  if (!database) throw new Error("Database is not configured (demo mode).");
  return database.user.upsert({
    where: { email: "demo@lumina.dev" },
    update: {},
    create: { email: "demo@lumina.dev", name: "Demo Rep" },
  });
}
