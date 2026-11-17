const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('Conectado com sucesso ao Neon PostgreSQL! 🚀');

    // Create Profile Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS laylla_profile (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        name VARCHAR(100) DEFAULT 'Laylla',
        status TEXT DEFAULT 'Hoje é um dia lindo para brilhar 🌸',
        avatar TEXT,
        mood VARCHAR(50) DEFAULT 'Radiante ✨',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Events Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS laylla_events (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        event_date VARCHAR(20) NOT NULL,
        event_time VARCHAR(10) NOT NULL,
        category VARCHAR(100),
        notes TEXT,
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Tasks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS laylla_tasks (
        id VARCHAR(100) PRIMARY KEY,
        text TEXT NOT NULL,
        category VARCHAR(50),
        done BOOLEAN DEFAULT FALSE,
        is_today BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Habits Table (water, self-care, gym)
    await client.query(`
      CREATE TABLE IF NOT EXISTS laylla_habits (
        key VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Notes Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS laylla_notes (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        color VARCHAR(20) DEFAULT '#F5EBE1',
        note_date VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default profile if not exists
    const profileRes = await client.query('SELECT * FROM laylla_profile WHERE id = $1', ['default']);
    if (profileRes.rows.length === 0) {
      await client.query(`
        INSERT INTO laylla_profile (id, name, status, mood)
        VALUES ('default', 'Laylla', 'Hoje é um dia lindo para brilhar 🌸', 'Radiante ✨');
      `);
      console.log('Perfil padrão criado no banco!');
    }

    console.log('Tabelas verificadas e prontas no banco Neon! ✨');
  } catch (err) {
    console.error('Erro ao conectar ou criar tabelas no banco:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };

if (require.main === module) {
  initDB().then(() => {
    console.log('Setup finalizado com sucesso.');
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
