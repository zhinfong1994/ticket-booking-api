import * as fs from 'fs';
import * as path from 'path';
import { pool } from './db';

export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      appliedAt TIMESTAMP DEFAULT NOW()
    )
  `);

  const result = await pool.query<{ version: string }>(
    `SELECT version FROM schema_migrations ORDER BY version`,
  );
  const applied = new Set(result.rows.map((r) => r.version));

  const migrationsDir = path.join(process.cwd(), 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = path.basename(file, '.sql');

    if (applied.has(version)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations (version) VALUES ($1)`,
        [version],
      );
      await client.query('COMMIT');
      console.log(`Migration applied: ${version}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(
        `Migration ${version} failed: ${(err as Error).message}`,
      );
    } finally {
      client.release();
    }
  }
}
