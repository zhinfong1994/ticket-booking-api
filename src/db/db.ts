import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'ticket_db_main',
  password: 'postgres',
  port: 5432,
};

export const pool: Pool = new Pool(config);
