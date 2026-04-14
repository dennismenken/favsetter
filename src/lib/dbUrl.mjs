import path from 'node:path';
import fs from 'node:fs';

/**
 * @param {{ ensureDir?: boolean }} [options]
 * @returns {string}
 */
export function resolveDatabasePath(options = {}) {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!raw.startsWith('file:')) {
    throw new Error('DATABASE_URL must be a file: URL (SQLite-only project)');
  }

  const filePath = raw.slice('file:'.length);
  const schemaDir = path.resolve(process.cwd(), 'prisma');
  const baseDir = fs.existsSync(schemaDir) ? schemaDir : process.cwd();
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);

  if (options.ensureDir) {
    const directoryPath = path.dirname(absolutePath);
    try {
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }
    } catch {
      // SQLite will surface any real error on connect
    }
  }

  return absolutePath;
}
