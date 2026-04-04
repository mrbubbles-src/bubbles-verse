import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { categories } from './schema';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
dotenv.config({ path: './.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL not found');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

const seedCategories: (typeof categories.$inferInsert)[] = [
  { name: 'Git', slug: 'git', iconKey: 'git', order: 0 },
  { name: 'GitHub', slug: 'github', iconKey: 'github', order: 1 },
  { name: 'Node.js', slug: 'node', iconKey: 'node', order: 2 },
  { name: 'HTML', slug: 'html', iconKey: 'html', order: 3 },
  { name: 'CSS', slug: 'css', iconKey: 'css', order: 4 },
  { name: 'JavaScript', slug: 'javascript', iconKey: 'js', order: 5 },
  { name: 'React', slug: 'react', iconKey: 'react', order: 6 },
  { name: 'Backend', slug: 'backend', iconKey: 'backend', order: 7 },
  { name: 'Database', slug: 'database', iconKey: 'database', order: 8 },
];

async function seed() {
  console.log('🌱 Seeding Kategorien...');
  await db.execute(
    sql`
      INSERT INTO "categories" ("name", "slug", "iconKey", "order", "updatedAt")
      VALUES ${sql.join(
        seedCategories.map(
          (cat) =>
            sql`(${cat.name}, ${cat.slug}, ${cat.iconKey}, ${cat.order}, NOW())`,
        ),
        sql`, `,
      )}
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "iconKey" = EXCLUDED."iconKey",
        "order" = EXCLUDED."order",
        "updatedAt" = NOW();
    `,
  );
  console.log('✅ Seed abgeschlossen!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Fehler beim Seed:', err);
  process.exit(1);
});
