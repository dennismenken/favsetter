import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { resolveDatabasePath } from './src/lib/dbUrl.mjs';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: `file:${resolveDatabasePath({ ensureDir: true })}`,
  },
});
