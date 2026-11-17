const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { put, del } = require('@vercel/blob');
require('dotenv').config();

const { pool, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer memory storage for photo uploads (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Ensure DB is initialized before handling requests
let dbReady = false;
initDB().then(() => {
  dbReady = true;
}).catch(err => {
  console.error('Falha ao inicializar banco de dados:', err);
});

// Middleware to ensure DB is ready
app.use(async (req, res, next) => {
  if (!dbReady && req.path.startsWith('/api')) {
    try {
      await initDB();
      dbReady = true;
    } catch (e) {
      return res.status(500).json({ error: 'Banco de dados conectando, tente novamente em instantes.' });
    }
  }
  next();
});

// ==========================================
// 1. GET FULL AGENDA DATA (All in one call)
// ==========================================
app.get('/api/data', async (req, res) => {
  try {
    const profileRes = await pool.query('SELECT * FROM laylla_profile WHERE id = $1', ['default']);
    const eventsRes = await pool.query('SELECT * FROM laylla_events ORDER BY event_date ASC, event_time ASC');
    const tasksRes = await pool.query('SELECT * FROM laylla_tasks ORDER BY created_at DESC');
    const habitsRes = await pool.query('SELECT * FROM laylla_habits WHERE key = $1', ['main']);
    const notesRes = await pool.query('SELECT * FROM laylla_notes ORDER BY created_at DESC');

    const profile = profileRes.rows[0] || {
      name: 'Laylla',
      status: 'Hoje é um dia lindo para brilhar 🌸',
      avatar: null,
      mood: 'Radiante ✨'
    };

    // Format events for frontend
    const events = eventsRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      date: r.event_date,
      time: r.event_time,
      category: r.category,
      notes: r.notes,
      done: r.done
    }));

    // Format tasks for frontend
    const tasks = tasksRes.rows.map(r => ({
      id: r.id,
      text: r.text,
      category: r.category,
      done: r.done,
      isToday: r.is_today
    }));

    // Format habits
    const habits = habitsRes.rows[0]?.data || null;

    // Format notes
    const notes = notesRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      color: r.color,
      date: r.note_date
    }));

    res.json({
      success: true,
      data: {
        profile,
        events,
        tasks,
        habits,
        notes
      }
    });
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    res.status(500).json({ error: 'Erro ao carregar dados do banco.' });
  }
});

// ==========================================
// 2. PROFILE ROUTES
// ==========================================
app.post('/api/profile', async (req, res) => {
  try {
    const { name, status, mood } = req.body;
    await pool.query(`
      UPDATE laylla_profile
      SET name = COALESCE($1, name),
          status = COALESCE($2, status),
          mood = COALESCE($3, mood),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 'default';
    `, [name, status, mood]);

    res.json({ success: true, message: 'Perfil atualizado no banco!' });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// ==========================================
// 3. PHOTO UPLOAD & STREAMING (Vercel Blob)
// ==========================================
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `avatar-laylla-${Date.now()}${ext}`;

    // Upload to Vercel Blob with private access
    const blob = await put(filename, req.file.buffer, {
      access: 'private',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log('Foto salva no Vercel Blob:', blob.url);

    // Save blob url in Postgres
    await pool.query(`
      UPDATE laylla_profile
      SET avatar = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'default';
    `, [blob.url]);

    res.json({
      success: true,
      message: 'Foto enviada com sucesso para o Vercel Blob!',
      avatarUrl: `/api/avatar?t=${Date.now()}`
    });
  } catch (err) {
    console.error('Erro no upload de foto:', err);
    res.status(500).json({ error: 'Falha no upload para o Vercel Blob.' });
  }
});

// Proxy stream for private blob avatar
app.get('/api/avatar', async (req, res) => {
  try {
    const profileRes = await pool.query('SELECT avatar FROM laylla_profile WHERE id = $1', ['default']);
    const avatarUrl = profileRes.rows[0]?.avatar;

    if (!avatarUrl) {
      return res.status(404).send('Nenhuma foto customizada.');
    }

    // Fetch from private Vercel Blob using authorization token
    const blobRes = await fetch(avatarUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });

    if (!blobRes.ok) {
      return res.status(blobRes.status).send('Erro ao buscar foto no Vercel Blob.');
    }

    const contentType = blobRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    const arrayBuffer = await blobRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Erro ao servir avatar:', err);
    res.status(500).send('Erro ao carregar avatar.');
  }
});

// Remove custom photo
app.post('/api/delete-photo', async (req, res) => {
  try {
    const profileRes = await pool.query('SELECT avatar FROM laylla_profile WHERE id = $1', ['default']);
    const currentAvatar = profileRes.rows[0]?.avatar;

    if (currentAvatar && currentAvatar.includes('blob.vercel-storage.com')) {
      try {
        await del(currentAvatar, { token: process.env.BLOB_READ_WRITE_TOKEN });
      } catch (e) {
        console.warn('Erro ao deletar blob antigo:', e.message);
      }
    }

    await pool.query(`
      UPDATE laylla_profile
      SET avatar = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'default';
    `);

    res.json({ success: true, message: 'Foto padrão restaurada.' });
  } catch (err) {
    console.error('Erro ao deletar foto:', err);
    res.status(500).json({ error: 'Erro ao remover foto.' });
  }
});

// ==========================================
// 4. EVENTS ROUTES
// ==========================================
app.post('/api/events', async (req, res) => {
  try {
    const { id, title, date, time, category, notes, done } = req.body;
    await pool.query(`
      INSERT INTO laylla_events (id, title, event_date, event_time, category, notes, done)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          event_date = EXCLUDED.event_date,
          event_time = EXCLUDED.event_time,
          category = EXCLUDED.category,
          notes = EXCLUDED.notes,
          done = EXCLUDED.done;
    `, [id, title, date, time, category, notes, done || false]);

    res.json({ success: true, message: 'Evento salvo no banco!' });
  } catch (err) {
    console.error('Erro ao salvar evento:', err);
    res.status(500).json({ error: 'Erro ao salvar evento.' });
  }
});

app.post('/api/events/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE laylla_events SET done = NOT done WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao alternar evento:', err);
    res.status(500).json({ error: 'Erro ao alternar evento.' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM laylla_events WHERE id = $1', [id]);
    res.json({ success: true, message: 'Evento excluído do banco.' });
  } catch (err) {
    console.error('Erro ao excluir evento:', err);
    res.status(500).json({ error: 'Erro ao excluir evento.' });
  }
});

// ==========================================
// 5. TASKS ROUTES
// ==========================================
app.post('/api/tasks', async (req, res) => {
  try {
    const { id, text, category, done, isToday } = req.body;
    await pool.query(`
      INSERT INTO laylla_tasks (id, text, category, done, is_today)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE
      SET text = EXCLUDED.text,
          category = EXCLUDED.category,
          done = EXCLUDED.done,
          is_today = EXCLUDED.is_today;
    `, [id, text, category, done || false, isToday || false]);

    res.json({ success: true, message: 'Tarefa salva no banco!' });
  } catch (err) {
    console.error('Erro ao salvar tarefa:', err);
    res.status(500).json({ error: 'Erro ao salvar tarefa.' });
  }
});

app.post('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE laylla_tasks SET done = NOT done WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao alternar tarefa:', err);
    res.status(500).json({ error: 'Erro ao alternar tarefa.' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM laylla_tasks WHERE id = $1', [id]);
    res.json({ success: true, message: 'Tarefa excluída do banco.' });
  } catch (err) {
    console.error('Erro ao excluir tarefa:', err);
    res.status(500).json({ error: 'Erro ao excluir tarefa.' });
  }
});

// ==========================================
// 6. HABITS & GYM ROUTES
// ==========================================
app.post('/api/habits', async (req, res) => {
  try {
    const habitsData = req.body;
    await pool.query(`
      INSERT INTO laylla_habits (key, data, updated_at)
      VALUES ('main', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = CURRENT_TIMESTAMP;
    `, [JSON.stringify(habitsData)]);

    res.json({ success: true, message: 'Hábitos e treinos salvos!' });
  } catch (err) {
    console.error('Erro ao salvar hábitos:', err);
    res.status(500).json({ error: 'Erro ao salvar hábitos.' });
  }
});

// ==========================================
// 7. NOTES ROUTES
// ==========================================
app.post('/api/notes', async (req, res) => {
  try {
    const { id, title, content, color, date } = req.body;
    await pool.query(`
      INSERT INTO laylla_notes (id, title, content, color, note_date)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          content = EXCLUDED.content,
          color = EXCLUDED.color,
          note_date = EXCLUDED.note_date;
    `, [id, title, content, color, date]);

    res.json({ success: true, message: 'Nota salva no banco!' });
  } catch (err) {
    console.error('Erro ao salvar nota:', err);
    res.status(500).json({ error: 'Erro ao salvar nota.' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM laylla_notes WHERE id = $1', [id]);
    res.json({ success: true, message: 'Nota excluída do banco.' });
  } catch (err) {
    console.error('Erro ao excluir nota:', err);
    res.status(500).json({ error: 'Erro ao excluir nota.' });
  }
});

// ==========================================
// 8. FULL SYNC (Backup Restore / Bulk Sync)
// ==========================================
app.post('/api/sync-all', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { profile, events, tasks, habits, notes } = req.body;

    if (profile) {
      await client.query(`
        UPDATE laylla_profile
        SET name = COALESCE($1, name), status = COALESCE($2, status), mood = COALESCE($3, mood)
        WHERE id = 'default';
      `, [profile.name, profile.status, profile.mood]);
    }

    if (events && Array.isArray(events)) {
      for (const e of events) {
        await client.query(`
          INSERT INTO laylla_events (id, title, event_date, event_time, category, notes, done)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title, event_date = EXCLUDED.event_date, event_time = EXCLUDED.event_time,
              category = EXCLUDED.category, notes = EXCLUDED.notes, done = EXCLUDED.done;
        `, [e.id, e.title, e.date, e.time, e.category, e.notes, e.done || false]);
      }
    }

    if (tasks && Array.isArray(tasks)) {
      for (const t of tasks) {
        await client.query(`
          INSERT INTO laylla_tasks (id, text, category, done, is_today)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE
          SET text = EXCLUDED.text, category = EXCLUDED.category, done = EXCLUDED.done, is_today = EXCLUDED.is_today;
        `, [t.id, t.text, t.category, t.done || false, t.isToday || false]);
      }
    }

    if (habits) {
      await client.query(`
        INSERT INTO laylla_habits (key, data, updated_at)
        VALUES ('main', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE
        SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
      `, [JSON.stringify(habits)]);
    }

    if (notes && Array.isArray(notes)) {
      for (const n of notes) {
        await client.query(`
          INSERT INTO laylla_notes (id, title, content, color, note_date)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title, content = EXCLUDED.content, color = EXCLUDED.color, note_date = EXCLUDED.note_date;
        `, [n.id, n.title, n.content, n.color, n.date]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Todos os dados foram sincronizados com o Neon PostgreSQL!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro na sincronização completa:', err);
    res.status(500).json({ error: 'Erro ao sincronizar dados.' });
  } finally {
    client.release();
  }
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`✨ Agenda da Laylla rodando em: http://localhost:${PORT}`);
    console.log(`🗄️ Banco de dados: Neon PostgreSQL (Conectado)`);
    console.log(`☁️ Armazenamento de Fotos: Vercel Blob (Conectado)`);
    console.log(`=================================================\n`);
  });
}

module.exports = app;
