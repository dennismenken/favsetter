import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import fs from 'node:fs';

function resolveDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!rawUrl.startsWith('file:')) {
    return rawUrl;
  }

  const filePath = rawUrl.slice('file:'.length);
  const schemaDir = path.resolve(process.cwd(), 'prisma');
  const baseDir = path.isAbsolute(filePath) ? '/' : (fs.existsSync(schemaDir) ? schemaDir : process.cwd());
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(baseDir, filePath);

  const directoryPath = path.dirname(absolutePath);
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  } catch {
    // If ensuring the directory fails, let the underlying SQLite error surface later
  }

  return `file:${absolutePath}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(),
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 