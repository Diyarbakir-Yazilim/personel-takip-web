const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'personel_takip_db',
});

async function run() {
  try {
    const res = await pool.query('SELECT email, password FROM "User"');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
