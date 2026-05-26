import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, basename } from 'path';
import { readdirSync } from 'fs';

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('Error: SUPABASE_DB_URL is not set in .env.local');
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function run() {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    await sql.end();
    return;
  }

  for (const file of files) {
    const filePath = join(migrationsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    console.log(`Running ${basename(file)}...`);
    try {
      await sql.unsafe(content);
      console.log(`  ✓ Done`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Already-exists errors are safe to ignore (idempotent re-runs)
      if (msg.includes('already exists')) {
        console.log(`  ⚠ Skipped (already exists)`);
      } else {
        console.error(`  ✗ Failed: ${msg}`);
        await sql.end();
        process.exit(1);
      }
    }
  }

  console.log('\nAll migrations complete.');
  await sql.end();
}

run();
