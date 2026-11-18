/* =====================================================
   AGENDA DA LAYLLA ✨ - JAVASCRIPT
   Persistência total no LocalStorage (sem necessidade de login)
   ===================================================== */

// --- CONFIG & STATE ---
const STORAGE_KEYS = {
  PROFILE: 'laylla_profile',
  EVENTS: 'laylla_events',
  TASKS: 'laylla_tasks',
  HABITS: 'laylla_habits',
  NOTES: 'laylla_notes',
};

// Default cute sample data
const DEFAULT_PROFILE = {
  name: 'Laylla',
  status: 'Hoje é um dia lindo para brilhar 🌸',
  avatar: null, // null defaults to cute SVG avatar
  mood: 'Radiante ✨',
  theme: 'nude',
  notificationsEnabled: false
};

// --- THEME MANAGEMENT ---
const THEME_NOTE_COLORS = {
  nude: ['#F5EBE1', '#E3D5CA', '#D7BDB0', '#D6CCC2', '#EDEEE9'],
  wine: ['#2D1328', '#44142C', '#5A1B3A', '#1C0D1A', '#381428'],
  ruby: ['#3D050D', '#5E0815', '#850C1F', '#220307', '#4E0611']
};

function applyTheme(themeName) {
  if (!['nude', 'wine', 'ruby'].includes(themeName)) {
    themeName = 'nude';
  }
  document.documentElement.setAttribute('data-theme', themeName);
  try {
    localStorage.setItem('laylla_theme', themeName);
  } catch (e) {}

  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  const themeColors = {
    nude: '#D7BDB0',
    wine: '#0C0C14',
    ruby: '#080002'
  };
  metaTheme.content = themeColors[themeName] || '#D7BDB0';

  const radio = document.querySelector(`input[name="settings-theme"][value="${themeName}"]`);
  if (radio && !radio.checked) {
    radio.checked = true;
  }

  updateNoteColorPicker(themeName);
  if (typeof renderNotesUI === 'function') {
    renderNotesUI();
  }
}

function updateNoteColorPicker(themeName) {
  const container = document.querySelector('.note-color-picker');
  if (!container) return;

  const colors = THEME_NOTE_COLORS[themeName] || THEME_NOTE_COLORS.nude;
  const currentChecked = container.querySelector('input[name="note-bg"]:checked')?.value;

  container.innerHTML = colors.map((c, i) => {
    const isChecked = currentChecked ? currentChecked === c : i === 0;
    return `
      <label class="color-dot" style="background:${c};">
        <input type="radio" name="note-bg" value="${c}" ${isChecked ? 'checked' : ''}>
      </label>
    `;
  }).join('');
}

// Immediate theme bootstrap to prevent flash of wrong theme
(function() {
  try {
    const savedTheme = localStorage.getItem('laylla_theme') || 'nude';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } catch (e) {}
})();

const DEFAULT_EVENTS = [
  {
    id: 'evt-1',
    title: 'Manhã de Auto-cuidado e Skincare',
    date: getTodayDateString(),
    time: '09:00',
    category: '🌸 Auto-cuidado',
    notes: 'Hidratar a pele e tomar café da manhã com calma ✨',
    done: true
  },
  {
    id: 'evt-2',
    title: 'Momento Foco & Organização',
    date: getTodayDateString(),
    time: '14:30',
    category: '💻 Trabalho / Estudo',
    notes: 'Revisar metas da semana e tarefas prioritárias.',
    done: false
  },
  {
    id: 'evt-3',
    title: 'Passeio & Cineminha com Pipoca',
    date: getTodayDateString(),
    time: '19:30',
    category: '💖 Encontro / Date',
    notes: 'Com a pessoa favorita 💕',
    done: false
  }
];

const DEFAULT_TASKS = [
  { id: 'tsk-1', text: 'Beber meu primeiro copo d\'água do dia 💧', category: 'saude', done: true, isToday: true },
  { id: 'tsk-2', text: 'Organizar os compromissos da semana 📅', category: 'hoje', done: true, isToday: true },
  { id: 'tsk-3', text: 'Fazer uma pausa gostosa de 15 minutos ☕', category: 'hoje', done: false, isToday: true },
  { id: 'tsk-4', text: 'Comprar aquele mimo que eu estava querendo 🛍️', category: 'compras', done: false, isToday: false }
];

const DEFAULT_SELFCARE = [
  { id: 'care-1', text: 'Skincare matinal com filtro solar 🧖‍♀️', done: true },
  { id: 'care-2', text: 'Comer algo gostoso e saudável 🥗', done: false },
  { id: 'care-3', text: 'Alongamento ou caminhada leve 🧘‍♀️', done: false },
  { id: 'care-4', text: 'Pausa para respirar e agradecer 🌸', done: true },
  { id: 'care-5', text: 'Skincare noturno & descanso merecido 🌙', done: false }
];

const DEFAULT_GYM = {
  focus: 'Inferiores & Glúteos 🍑',
  weekDays: { seg: true, ter: false, qua: false, qui: false, sex: false, sab: false, dom: false },
  checklist: [
    { id: 'gym-1', text: 'Garrafinha de água abastecida 💧', done: true },
    { id: 'gym-2', text: 'Lookinho confortável & tênis amarrado 👟', done: true },
    { id: 'gym-3', text: 'Fone de ouvido com playlist animada 🎧', done: false },
    { id: 'gym-4', text: 'Aquecimento & alongamento inicial (5-10 min) ⏱️', done: false },
    { id: 'gym-5', text: 'Treino de musculação feito com determinação 🔥', done: false },
    { id: 'gym-6', text: 'Cardio concluído (esteira / escada / bike) 🏃‍♀️', done: false },
    { id: 'gym-7', text: 'Pós-treino / proteína / banho relaxante 🥤🧖‍♀️', done: false }
  ]
};

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'Coisas que me fazem feliz 💖',
    content: '1. Dia de sol quentinho ☀️\n2. Café com cheirinho bom ☕\n3. Receber abraço apertado e carinho\n4. Maratona de filmes debaixo da coberta!',
    color: '#F5EBE1',
    date: 'Hoje'
  },
  {
    id: 'note-2',
    title: 'Lembrete pra mim mesma ✨',
    content: 'Você é muito mais forte, talentosa e incrível do que imagina. Respeite seu tempo e brilhe no seu próprio ritmo!',
    color: '#E3D5CA',
    date: 'Ontem'
  }
];

// App State
let state = {
  profile: loadData(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
  events: loadData(STORAGE_KEYS.EVENTS, DEFAULT_EVENTS),
  tasks: loadData(STORAGE_KEYS.TASKS, DEFAULT_TASKS),
  habits: loadData(STORAGE_KEYS.HABITS, {
    waterDate: getTodayDateString(),
    waterCups: 3,
    selfCare: DEFAULT_SELFCARE,
    gym: DEFAULT_GYM
  }),
  notes: loadData(STORAGE_KEYS.NOTES, DEFAULT_NOTES),
  calendarCurrentDate: new Date(),
  selectedDate: getTodayDateString(),
  taskFilter: 'all'
};

// --- HELPER FUNCTIONS ---
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Erro ao salvar:', e);
  }
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateToPTBR(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${weekdays[d.getDay()]}, ${day} de ${months[d.getMonth()]}`;
}

function showToast(message) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// --- API CLIENT (Neon PostgreSQL & Vercel Blob) ---
const api = {
  isOnline: false,
  async fetchAll() {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return null;
      const json = await res.json();
      this.isOnline = true;
      return json.data;
    } catch (e) {
      this.isOnline = false;
      return null;
    }
  },
  async saveProfile(profile) {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) {}
  },
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  async deletePhoto() {
    try {
      await fetch('/api/delete-photo', { method: 'POST' });
    } catch (e) {}
  },
  async saveEvent(event) {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (e) {}
  },
  async toggleEvent(id) {
    try {
      await fetch(`/api/events/${id}/toggle`, { method: 'POST' });
    } catch (e) {}
  },
  async deleteEvent(id) {
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
    } catch (e) {}
  },
  async saveTask(task) {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    } catch (e) {}
  },
  async toggleTask(id) {
    try {
      await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
    } catch (e) {}
  },
  async deleteTask(id) {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (e) {}
  },
  async saveHabits(habits) {
    try {
      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habits)
      });
    } catch (e) {}
  },
  async saveNote(note) {
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
    } catch (e) {}
  },
  async deleteNote(id) {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    } catch (e) {}
  },
  async syncAll(payload) {
    try {
      await fetch('/api/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  const currentTheme = state.profile.theme || localStorage.getItem('laylla_theme') || 'nude';
  applyTheme(currentTheme);

  initProfile();
  initCalendar();
  initTasks();
  initHabits();
  initNotes();
  initNavigation();
  initModals();
  initBackup();
  initNotifications();
  initPWAInstall();
  registerServiceWorker();

  // Sync with Neon PostgreSQL & Vercel Blob in background
  syncWithBackend();
});

async function syncWithBackend() {
  const remote = await api.fetchAll();
  if (!remote) return; // Server offline or running without backend

  // Sync profile
  if (remote.profile) {
    state.profile.name = remote.profile.name || state.profile.name;
    state.profile.status = remote.profile.status || state.profile.status;
    state.profile.mood = remote.profile.mood || state.profile.mood;
    if (remote.profile.theme) {
      state.profile.theme = remote.profile.theme;
      applyTheme(state.profile.theme);
    }
    if (remote.profile.notificationsEnabled !== undefined) {
      state.profile.notificationsEnabled = remote.profile.notificationsEnabled;
      const toggle = document.getElementById('settings-notifications-toggle');
      if (toggle) toggle.checked = !!state.profile.notificationsEnabled;
      if (typeof updateNotificationStatus === 'function') updateNotificationStatus();
    }
    if (remote.profile.avatar) {
      state.profile.avatar = '/api/avatar';
    }
  }

  // Check if remote already has data
  const hasRemoteData = (remote.events && remote.events.length > 0) || (remote.tasks && remote.tasks.length > 0);
  if (hasRemoteData) {
    if (remote.events) state.events = remote.events;
    if (remote.tasks) state.tasks = remote.tasks;
    if (remote.habits) state.habits = remote.habits;
    if (remote.notes) state.notes = remote.notes;
  } else {
    // Database was newly created: seed it with our rich local template data
    await api.syncAll({
      profile: state.profile,
      events: state.events,
      tasks: state.tasks,
      habits: state.habits,
      notes: state.notes
    });
  }

  // Update local cache
  saveData(STORAGE_KEYS.PROFILE, state.profile);
  saveData(STORAGE_KEYS.EVENTS, state.events);
  saveData(STORAGE_KEYS.TASKS, state.tasks);
  saveData(STORAGE_KEYS.HABITS, state.habits);
  saveData(STORAGE_KEYS.NOTES, state.notes);

  // Refresh UI
  initProfile();
  initCalendar();
  initTasks();
  initHabits();
  initNotes();
}

// ==========================================
// 1. PROFILE & HEADER
// ==========================================
function initProfile() {
  const avatarImg = document.getElementById('user-avatar');
  const displayName = document.getElementById('user-display-name');
  const statusText = document.getElementById('user-status-text');
  const todayHeaderDate = document.getElementById('header-today-date');
  const avatarInput = document.getElementById('avatar-input');
  const moodPills = document.querySelectorAll('.mood-pill');

  // Render profile
  function renderProfile() {
    displayName.textContent = `Olá, ${state.profile.name || 'Laylla'} ✨`;
    statusText.textContent = `"${state.profile.status || 'Hoje é um dia lindo para brilhar 🌸'}"`;
    if (state.profile.avatar) {
      avatarImg.src = state.profile.avatar;
    }

    // Set today date in header
    const now = new Date();
    const shortWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][now.getDay()];
    const shortMonth = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][now.getMonth()];
    todayHeaderDate.textContent = `${shortWeek}, ${now.getDate()} ${shortMonth}`;

    // Active mood
    moodPills.forEach(pill => {
      if (pill.dataset.mood === state.profile.mood) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // Handle avatar file upload (Vercel Blob + Local cache)
  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Por favor, escolha uma imagem de até 5MB.');
      return;
    }

    showToast('Enviando foto para o Vercel Blob... ☁️');

    try {
      const res = await api.uploadPhoto(file);
      if (res && res.success) {
        state.profile.avatar = res.avatarUrl;
        saveData(STORAGE_KEYS.PROFILE, state.profile);
        avatarImg.src = res.avatarUrl;
        showToast('Foto salva no Vercel Blob com sucesso! ☁️✨');
        return;
      }
    } catch (err) {
      console.warn('API de upload indisponível, usando fallback local:', err);
    }

    // Fallback if backend offline
    const reader = new FileReader();
    reader.onload = function (evt) {
      state.profile.avatar = evt.target.result;
      saveData(STORAGE_KEYS.PROFILE, state.profile);
      avatarImg.src = state.profile.avatar;
      showToast('Foto atualizada com sucesso! ✨');
    };
    reader.readAsDataURL(file);
  });

  // Mood selector clicks
  moodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      moodPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.profile.mood = pill.dataset.mood;
      saveData(STORAGE_KEYS.PROFILE, state.profile);
      showToast(`Humor definido como: ${state.profile.mood}`);
    });
  });

  // Click on status to quickly edit
  statusText.addEventListener('click', () => {
    document.getElementById('settings-name-input').value = state.profile.name || 'Laylla';
    document.getElementById('settings-status-input').value = state.profile.status || '';
    const currentTheme = state.profile.theme || localStorage.getItem('laylla_theme') || 'nude';
    const themeRadio = document.querySelector(`input[name="settings-theme"][value="${currentTheme}"]`);
    if (themeRadio) themeRadio.checked = true;
    if (typeof updateNotificationStatus === 'function') updateNotificationStatus();
    openModal('modal-settings');
  });

  renderProfile();
}

// ==========================================
// 2. CALENDAR & SCHEDULE
// ==========================================
function initCalendar() {
  const monthYearLabel = document.getElementById('cal-month-year');
  const prevMonthBtn = document.getElementById('prev-month-btn');
  const nextMonthBtn = document.getElementById('next-month-btn');
  const todayShortcut = document.getElementById('cal-today-shortcut');
  const daysGrid = document.getElementById('calendar-days-grid');
  const eventDateInput = document.getElementById('event-date-input');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  function renderCalendar() {
    const year = state.calendarCurrentDate.getFullYear();
    const month = state.calendarCurrentDate.getMonth();

    monthYearLabel.textContent = `${monthNames[month]} ${year}`;

    // First day of month & total days
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    daysGrid.innerHTML = '';

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.textContent = prevMonthTotalDays - i;
      daysGrid.appendChild(cell);
    }

    // Days of current month
    const todayStr = getTodayDateString();

    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      cell.textContent = day;

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (dateStr === todayStr) {
        cell.classList.add('today');
      }

      if (dateStr === state.selectedDate) {
        cell.classList.add('selected');
      }

      // Check if this date has events
      const dayEvents = state.events.filter(e => e.date === dateStr);
      if (dayEvents.length > 0) {
        const dotContainer = document.createElement('div');
        dotContainer.className = 'event-dot-container';
        // max 3 dots
        const count = Math.min(dayEvents.length, 3);
        for (let k = 0; k < count; k++) {
          const dot = document.createElement('span');
          dot.className = 'event-dot';
          dotContainer.appendChild(dot);
        }
        cell.appendChild(dotContainer);
      }

      cell.addEventListener('click', () => {
        state.selectedDate = dateStr;
        renderCalendar();
        renderDaySchedule();
      });

      daysGrid.appendChild(cell);
    }

    // Trailing days to fill 7 columns grid
    const totalCells = firstDayIndex + totalDays;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.textContent = j;
      daysGrid.appendChild(cell);
    }
  }

  prevMonthBtn.addEventListener('click', () => {
    state.calendarCurrentDate.setMonth(state.calendarCurrentDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    state.calendarCurrentDate.setMonth(state.calendarCurrentDate.getMonth() + 1);
    renderCalendar();
  });

  todayShortcut.addEventListener('click', () => {
    state.calendarCurrentDate = new Date();
    state.selectedDate = getTodayDateString();
    renderCalendar();
    renderDaySchedule();
    showToast('Voltando para hoje ✨');
  });

  renderCalendar();
  renderDaySchedule();

  // Set default date for new event modal to currently selected date
  document.getElementById('open-add-event-modal').addEventListener('click', () => {
    eventDateInput.value = state.selectedDate || getTodayDateString();
    openModal('modal-event');
  });

  // Handle Event Form Submission
  const eventForm = document.getElementById('form-event');
  eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('event-title-input').value.trim();
    const date = document.getElementById('event-date-input').value;
    const time = document.getElementById('event-time-input').value || '12:00';
    const notes = document.getElementById('event-notes-input').value.trim();
    const category = document.querySelector('input[name="event-cat"]:checked')?.value || '🌸 Auto-cuidado';

    if (!title || !date) return;

    const newEvent = {
      id: 'evt-' + Date.now(),
      title,
      date,
      time,
      category,
      notes,
      done: false
    };

    state.events.push(newEvent);
    saveData(STORAGE_KEYS.EVENTS, state.events);
    api.saveEvent(newEvent);

    // Switch selected date to the event's date
    state.selectedDate = date;
    const [y, m] = date.split('-').map(Number);
    state.calendarCurrentDate = new Date(y, m - 1, 1);

    renderCalendar();
    renderDaySchedule();
    closeModal('modal-event');
    eventForm.reset();
    showToast('Compromisso agendado com sucesso! 💖');
  });
}

function renderDaySchedule() {
  const titleElem = document.getElementById('selected-day-title');
  const subtitleElem = document.getElementById('selected-day-subtitle');
  const container = document.getElementById('events-container');

  const todayStr = getTodayDateString();
  const isToday = state.selectedDate === todayStr;

  titleElem.textContent = isToday ? 'Compromissos de Hoje ✨' : 'Compromissos do Dia';
  subtitleElem.textContent = formatDateToPTBR(state.selectedDate);

  const dayEvents = state.events
    .filter(e => e.date === state.selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  container.innerHTML = '';

  if (dayEvents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-emoji">🌸</div>
        <p>Nenhum compromisso marcado para este dia.<br>Aproveite para relaxar ou adicione um novo!</p>
      </div>
    `;
    return;
  }

  dayEvents.forEach(evt => {
    const card = document.createElement('div');
    card.className = `event-card ${evt.done ? 'done' : ''}`;

    card.innerHTML = `
      <div class="event-card-left">
        <span class="event-time-badge">${evt.time}</span>
        <div class="event-card-info">
          <span class="event-card-cat">${evt.category}</span>
          <h4 class="event-card-title">${escapeHTML(evt.title)}</h4>
          ${evt.notes ? `<p class="event-card-notes">${escapeHTML(evt.notes)}</p>` : ''}
        </div>
      </div>
      <div class="event-actions">
        <button class="action-icon-btn toggle-event-btn" title="${evt.done ? 'Marcar como pendente' : 'Marcar como concluído'}">
          ${evt.done
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`}
        </button>
        <button class="action-icon-btn delete delete-event-btn" title="Excluir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;

    // Toggle event status
    card.querySelector('.toggle-event-btn').addEventListener('click', () => {
      evt.done = !evt.done;
      saveData(STORAGE_KEYS.EVENTS, state.events);
      api.toggleEvent(evt.id);
      renderDaySchedule();
      showToast(evt.done ? 'Compromisso concluído! 🎉' : 'Compromisso reaberto!');
    });

    // Delete event
    card.querySelector('.delete-event-btn').addEventListener('click', () => {
      if (confirm(`Remover "${evt.title}" da sua agenda?`)) {
        state.events = state.events.filter(e => e.id !== evt.id);
        saveData(STORAGE_KEYS.EVENTS, state.events);
        api.deleteEvent(evt.id);
        renderDaySchedule();
        initCalendar(); // update calendar dots
        showToast('Compromisso removido.');
      }
    });

    container.appendChild(card);
  });
}

// ==========================================
// 3. TASKS & TO-DO
// ==========================================
function initTasks() {
  const taskInput = document.getElementById('quick-task-input');
  const taskCatSelect = document.getElementById('quick-task-category');
  const addTaskBtn = document.getElementById('quick-task-btn');
  const filterChips = document.querySelectorAll('.filter-chip');

  function renderTasks() {
    const container = document.getElementById('tasks-container');
    const summary = document.getElementById('tasks-progress-summary');
    const bar = document.getElementById('tasks-progress-bar');

    // Progress calculation
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.done).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    summary.textContent = `${completed} de ${total} tarefas concluídas (${percent}%)`;
    bar.style.width = `${percent}%`;

    // Filter
    let filtered = state.tasks;
    if (state.taskFilter === 'hoje') {
      filtered = state.tasks.filter(t => t.isToday || t.category === 'hoje');
    } else if (state.taskFilter === 'pending') {
      filtered = state.tasks.filter(t => !t.done);
    } else if (state.taskFilter === 'done') {
      filtered = state.tasks.filter(t => t.done);
    }

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-emoji">✨</div>
          <p>Tudo limpo por aqui! Você está livre ou já completou tudo.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(task => {
      const item = document.createElement('div');
      item.className = `task-item ${task.done ? 'completed' : ''}`;

      const catBadge = {
        hoje: '🌸 Hoje',
        amor: '💖 Amor',
        estudo: '💻 Estudo',
        compras: '🛍️ Compras',
        saude: '🩺 Saúde'
      }[task.category] || '🌸 Tarefa';

      item.innerHTML = `
        <div class="task-left">
          <div class="custom-checkbox">
            ${task.done ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
          </div>
          <div class="task-text-group">
            <div class="task-text">${escapeHTML(task.text)}</div>
            <span class="task-tag">${catBadge}</span>
          </div>
        </div>
        <button class="action-icon-btn delete delete-task-btn" title="Excluir">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;

      // Toggle Done
      item.querySelector('.custom-checkbox').addEventListener('click', () => {
        task.done = !task.done;
        saveData(STORAGE_KEYS.TASKS, state.tasks);
        api.toggleTask(task.id);
        renderTasks();
        if (task.done) showToast('Mais uma conquista, parabéns! 🌟');
      });

      // Delete Task
      item.querySelector('.delete-task-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        state.tasks = state.tasks.filter(t => t.id !== task.id);
        saveData(STORAGE_KEYS.TASKS, state.tasks);
        api.deleteTask(task.id);
        renderTasks();
      });

      container.appendChild(item);
    });
  }

  function handleAddTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
      id: 'tsk-' + Date.now(),
      text,
      category: taskCatSelect.value,
      done: false,
      isToday: taskCatSelect.value === 'hoje'
    };

    state.tasks.unshift(newTask);
    saveData(STORAGE_KEYS.TASKS, state.tasks);
    api.saveTask(newTask);
    taskInput.value = '';
    renderTasks();
    showToast('Tarefa adicionada à listinha! 📝');
  }

  addTaskBtn.addEventListener('click', handleAddTask);
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddTask();
  });

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.taskFilter = chip.dataset.filter;
      renderTasks();
    });
  });

  renderTasks();
}

// ==========================================
// 4. HABITS & SELF-CARE
// ==========================================
function initHabits() {
  const glassesGrid = document.getElementById('water-glasses-grid');
  const counterText = document.getElementById('water-intake-counter');
  const resetBtn = document.getElementById('reset-water-btn');
  const selfCareList = document.getElementById('selfcare-list');

  // Check if water tracker is from today; if not, reset for the new day
  const todayStr = getTodayDateString();
  if (state.habits.waterDate !== todayStr) {
    state.habits.waterDate = todayStr;
    state.habits.waterCups = 0;
    saveData(STORAGE_KEYS.HABITS, state.habits);
  }

  function renderWater() {
    glassesGrid.innerHTML = '';
    const currentCups = state.habits.waterCups || 0;
    const ml = currentCups * 250;
    counterText.textContent = `Meta: 2000ml (${currentCups}/8 copos - ${ml}ml tomados)`;

    for (let i = 1; i <= 8; i++) {
      const isFilled = i <= currentCups;
      const cup = document.createElement('div');
      cup.className = `water-cup ${isFilled ? 'filled' : ''}`;
      cup.innerHTML = `
        <span class="water-cup-icon">${isFilled ? '💧' : '🥛'}</span>
        <span class="water-cup-ml">${i * 250}ml</span>
      `;

      cup.addEventListener('click', () => {
        if (i === currentCups) {
          // Unfill last cup
          state.habits.waterCups = i - 1;
        } else {
          state.habits.waterCups = i;
        }
        saveData(STORAGE_KEYS.HABITS, state.habits);
        api.saveHabits(state.habits);
        renderWater();
        if (state.habits.waterCups === 8) {
          showToast('Meta de água atingida! Pele de princesa radiante! 💧✨');
        } else {
          showToast(`Hidratação: ${state.habits.waterCups * 250}ml tomados!`);
        }
      });

      glassesGrid.appendChild(cup);
    }
  }

  resetBtn.addEventListener('click', () => {
    state.habits.waterCups = 0;
    saveData(STORAGE_KEYS.HABITS, state.habits);
    api.saveHabits(state.habits);
    renderWater();
    showToast('Contador de água zerado.');
  });

  function renderSelfCare() {
    selfCareList.innerHTML = '';
    (state.habits.selfCare || DEFAULT_SELFCARE).forEach(item => {
      const row = document.createElement('div');
      row.className = `care-item ${item.done ? 'done' : ''}`;
      row.innerHTML = `
        <span>${escapeHTML(item.text)}</span>
        <span>${item.done ? '✅' : '⚪'}</span>
      `;

      row.addEventListener('click', () => {
        item.done = !item.done;
        saveData(STORAGE_KEYS.HABITS, state.habits);
        api.saveHabits(state.habits);
        renderSelfCare();
        if (item.done) showToast('Cuidado merecido concluído! 🧖‍♀️');
      });

      selfCareList.appendChild(row);
    });
  }

  // Affirmations list
  const affirmations = [
    'Você é especial, inteligente, linda e capaz de conquistar tudo o que sonhar hoje!',
    'Lembre-se de respirar fundo e comemorar suas pequenas vitórias de hoje! 🌸',
    'Sua luz é única e ilumina o dia de todo mundo ao seu redor! ✨',
    'Dias bons te dão felicidade, dias desafiadores te dão força. Você arrasa sempre! 💖'
  ];
  const quoteElem = document.getElementById('daily-affirmation-text');
  if (quoteElem) {
    const todayIndex = new Date().getDate() % affirmations.length;
    quoteElem.textContent = affirmations[todayIndex];
  }

  // --- Gym & Workout Checklist Logic ---
  if (!state.habits.gym) {
    state.habits.gym = JSON.parse(JSON.stringify(DEFAULT_GYM));
    saveData(STORAGE_KEYS.HABITS, state.habits);
  }

  const gymChips = document.querySelectorAll('.gym-chip');
  const gymWeekTracker = document.getElementById('gym-week-tracker');
  const gymStreakSummary = document.getElementById('gym-streak-summary');
  const gymChecklistContainer = document.getElementById('gym-checklist-container');
  const gymNewItemInput = document.getElementById('gym-new-item-input');
  const gymAddItemBtn = document.getElementById('gym-add-item-btn');
  const resetGymWeekBtn = document.getElementById('reset-gym-week-btn');

  function renderGym() {
    const gym = state.habits.gym;

    // Focus Chips
    gymChips.forEach(chip => {
      if (chip.dataset.focus === gym.focus) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Week Tracker (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
    if (gymWeekTracker) {
      const weekLabels = [
        { key: 'seg', label: 'Seg' },
        { key: 'ter', label: 'Ter' },
        { key: 'qua', label: 'Qua' },
        { key: 'qui', label: 'Qui' },
        { key: 'sex', label: 'Sex' },
        { key: 'sab', label: 'Sáb' },
        { key: 'dom', label: 'Dom' }
      ];

      gymWeekTracker.innerHTML = '';
      let completedDays = 0;

      weekLabels.forEach(d => {
        const isDone = !!(gym.weekDays && gym.weekDays[d.key]);
        if (isDone) completedDays++;

        const dayBtn = document.createElement('div');
        dayBtn.className = `gym-day-circle ${isDone ? 'done' : ''}`;
        dayBtn.title = `${d.label}: ${isDone ? 'Treino feito!' : 'Dia pendente'}`;
        dayBtn.innerHTML = `
          <span class="gym-day-letter">${d.label}</span>
          <span class="gym-day-status">${isDone ? '🔥' : '○'}</span>
        `;

        dayBtn.addEventListener('click', () => {
          if (!gym.weekDays) gym.weekDays = {};
          gym.weekDays[d.key] = !gym.weekDays[d.key];
          saveData(STORAGE_KEYS.HABITS, state.habits);
          api.saveHabits(state.habits);
          renderGym();
          if (gym.weekDays[d.key]) {
            showToast(`Treino de ${d.label} registrado! Arrasou, gatinha! 💪🔥`);
          }
        });

        gymWeekTracker.appendChild(dayBtn);
      });

      if (gymStreakSummary) {
        gymStreakSummary.textContent = `${completedDays} de 7 dias com treino na semana! ${completedDays >= 3 ? 'Guerreira demais! 💖' : 'Bora focar! ✨'}`;
      }
    }

    // Gym Checklist Items
    if (gymChecklistContainer) {
      gymChecklistContainer.innerHTML = '';
      (gym.checklist || []).forEach(item => {
        const row = document.createElement('div');
        row.className = `gym-check-item ${item.done ? 'done' : ''}`;

        row.innerHTML = `
          <div class="gym-check-left">
            <div class="custom-checkbox">
              ${item.done ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
            </div>
            <span class="gym-item-text">${escapeHTML(item.text)}</span>
          </div>
          <button class="action-icon-btn delete delete-gym-item-btn" title="Excluir item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        `;

        row.querySelector('.gym-check-left').addEventListener('click', () => {
          item.done = !item.done;
          saveData(STORAGE_KEYS.HABITS, state.habits);
          api.saveHabits(state.habits);
          renderGym();
          if (item.done) showToast('Etapa do treino concluída! 💪✨');
        });

        row.querySelector('.delete-gym-item-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          gym.checklist = gym.checklist.filter(i => i.id !== item.id);
          saveData(STORAGE_KEYS.HABITS, state.habits);
          api.saveHabits(state.habits);
          renderGym();
        });

        gymChecklistContainer.appendChild(row);
      });
    }
  }

  // Focus chips click
  gymChips.forEach(chip => {
    chip.addEventListener('click', () => {
      state.habits.gym.focus = chip.dataset.focus;
      saveData(STORAGE_KEYS.HABITS, state.habits);
      api.saveHabits(state.habits);
      renderGym();
      showToast(`Foco de hoje: ${state.habits.gym.focus}`);
    });
  });

  // Reset week days
  if (resetGymWeekBtn) {
    resetGymWeekBtn.addEventListener('click', () => {
      state.habits.gym.weekDays = { seg: false, ter: false, qua: false, qui: false, sex: false, sab: false, dom: false };
      saveData(STORAGE_KEYS.HABITS, state.habits);
      api.saveHabits(state.habits);
      renderGym();
      showToast('Frequência da semana zerada para um novo ciclo!');
    });
  }

  // Add custom gym item
  function handleAddGymItem() {
    if (!gymNewItemInput) return;
    const text = gymNewItemInput.value.trim();
    if (!text) return;

    if (!state.habits.gym.checklist) state.habits.gym.checklist = [];
    state.habits.gym.checklist.push({
      id: 'gym-' + Date.now(),
      text,
      done: false
    });

    saveData(STORAGE_KEYS.HABITS, state.habits);
    api.saveHabits(state.habits);
    gymNewItemInput.value = '';
    renderGym();
    showToast('Item adicionado ao checklist de academia! 🏋️‍♀️');
  }

  if (gymAddItemBtn) gymAddItemBtn.addEventListener('click', handleAddGymItem);
  if (gymNewItemInput) {
    gymNewItemInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAddGymItem();
    });
  }

  renderWater();
  renderSelfCare();
  renderGym();
}

// ==========================================
// 5. NOTES & DIARY
// ==========================================
let renderNotesUI = null;

function isColorDark(color) {
  if (!color) return false;
  color = color.trim().toLowerCase();
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    const nums = color.match(/\d+/g);
    if (nums && nums.length >= 3) {
      const r = parseInt(nums[0]), g = parseInt(nums[1]), b = parseInt(nums[2]);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 155;
    }
  }
  if (color.startsWith('#')) {
    let hex = color.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 155;
  }
  return false;
}

function resolveNoteColor(note, currentTheme) {
  if (!note.color || note.color === '#F5EBE1' || note.color === '#E3D5CA') {
    if (currentTheme === 'ruby') {
      return note.color === '#E3D5CA' ? '#5E0815' : '#3D050D';
    }
    if (currentTheme === 'wine') {
      return note.color === '#E3D5CA' ? '#44142C' : '#2D1328';
    }
    return note.color || '#F5EBE1';
  }
  return note.color;
}

function initNotes() {
  const container = document.getElementById('notes-container');
  const addNoteBtn = document.getElementById('open-add-note-modal');
  const noteForm = document.getElementById('form-note');

  function renderNotes() {
    container.innerHTML = '';

    if (state.notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-emoji">📔</div>
          <p>Seu caderninho está vazio.<br>Clique em "+ Anotar" para guardar seus pensamentos e ideias!</p>
        </div>
      `;
      return;
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'nude';

    state.notes.forEach(note => {
      const card = document.createElement('div');
      const actualColor = resolveNoteColor(note, currentTheme);
      const isDark = isColorDark(actualColor);

      card.className = `note-card ${isDark ? 'dark-note' : 'light-note'}`;
      card.style.backgroundColor = actualColor;

      card.innerHTML = `
        <div class="note-card-top">
          <span class="note-card-date">${escapeHTML(note.date || 'Hoje')}</span>
          <div class="note-card-actions">
            <button class="action-icon-btn edit-note-btn" title="Editar anotação">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button class="action-icon-btn delete delete-note-btn" title="Excluir nota">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <h4>${escapeHTML(note.title)}</h4>
        <p>${escapeHTML(note.content)}</p>
      `;

      // Click edit button
      card.querySelector('.edit-note-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditNoteModal(note);
      });

      // Click card itself to edit
      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-note-btn') || e.target.closest('.edit-note-btn')) return;
        openEditNoteModal(note);
      });

      // Click delete button
      card.querySelector('.delete-note-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Excluir a nota "${note.title}"?`)) {
          state.notes = state.notes.filter(n => n.id !== note.id);
          saveData(STORAGE_KEYS.NOTES, state.notes);
          api.deleteNote(note.id);
          renderNotes();
          showToast('Nota excluída.');
        }
      });

      container.appendChild(card);
    });
  }

  renderNotesUI = renderNotes;

  function openEditNoteModal(note) {
    const modalTitle = document.getElementById('modal-note-title');
    const submitBtn = document.getElementById('note-submit-btn');
    const editIdInput = document.getElementById('note-edit-id');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');

    if (modalTitle) modalTitle.textContent = 'Editar Anotação 📝';
    if (submitBtn) submitBtn.textContent = 'Salvar Alterações ✨';
    if (editIdInput) editIdInput.value = note.id;
    if (titleInput) titleInput.value = note.title;
    if (contentInput) contentInput.value = note.content;

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'nude';
    updateNoteColorPicker(currentTheme);

    const actualColor = resolveNoteColor(note, currentTheme);
    const radio = document.querySelector(`input[name="note-bg"][value="${actualColor}"]`);
    if (radio) {
      radio.checked = true;
    }

    openModal('modal-note');
  }

  addNoteBtn.addEventListener('click', () => {
    const modalTitle = document.getElementById('modal-note-title');
    const submitBtn = document.getElementById('note-submit-btn');
    const editIdInput = document.getElementById('note-edit-id');

    if (modalTitle) modalTitle.textContent = 'Nova Anotação 📝';
    if (submitBtn) submitBtn.textContent = 'Guardar Nota ✨';
    if (editIdInput) editIdInput.value = '';
    noteForm.reset();

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'nude';
    updateNoteColorPicker(currentTheme);
    openModal('modal-note');
  });

  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('note-title-input').value.trim();
    const content = document.getElementById('note-content-input').value.trim();
    const editId = document.getElementById('note-edit-id')?.value;
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'nude';
    const fallbackColor = currentTheme === 'ruby' ? '#3D050D' : (currentTheme === 'wine' ? '#2D1328' : '#F5EBE1');
    const color = document.querySelector('input[name="note-bg"]:checked')?.value || fallbackColor;

    if (!title || !content) return;

    if (editId) {
      const existing = state.notes.find(n => n.id === editId);
      if (existing) {
        existing.title = title;
        existing.content = content;
        existing.color = color;
        saveData(STORAGE_KEYS.NOTES, state.notes);
        api.saveNote(existing);
        renderNotes();
        closeModal('modal-note');
        noteForm.reset();
        if (document.getElementById('note-edit-id')) {
          document.getElementById('note-edit-id').value = '';
        }
        showToast('Anotação atualizada com sucesso! ✨');
        return;
      }
    }

    const newNote = {
      id: 'note-' + Date.now(),
      title,
      content,
      color,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    };

    state.notes.unshift(newNote);
    saveData(STORAGE_KEYS.NOTES, state.notes);
    api.saveNote(newNote);
    renderNotes();
    closeModal('modal-note');
    noteForm.reset();
    if (document.getElementById('note-edit-id')) {
      document.getElementById('note-edit-id').value = '';
    }
    showToast('Anotação guardada no caderninho! 📔✨');
  });

  renderNotes();
}

// ==========================================
// 6. BOTTOM NAVIGATION
// ==========================================
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.view-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;

      tabs.forEach(t => {
        if (t.dataset.target === targetId) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
      views.forEach(v => v.classList.remove('active'));

      const targetView = document.getElementById(targetId);
      if (targetView) targetView.classList.add('active');

      // Scroll to top
      const main = document.querySelector('.app-main');
      if (main) main.scrollTop = 0;
    });
  });

  // Sidebar quick event button (Desktop / Tablet)
  const quickEventBtn = document.getElementById('sidebar-quick-event');
  if (quickEventBtn) {
    quickEventBtn.addEventListener('click', () => {
      const eventDateInput = document.getElementById('event-date-input');
      if (eventDateInput) eventDateInput.value = state.selectedDate || getTodayDateString();
      openModal('modal-event');
    });
  }
}

// ==========================================
// 7. MODALS & SETTINGS
// ==========================================
function initModals() {
  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.close);
    });
  });

  // Close when clicking backdrop outside dialog
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Settings modal open
  function prepareSettingsModal() {
    document.getElementById('settings-name-input').value = state.profile.name || 'Laylla';
    document.getElementById('settings-status-input').value = state.profile.status || '';
    const currentTheme = state.profile.theme || localStorage.getItem('laylla_theme') || 'nude';
    const themeRadio = document.querySelector(`input[name="settings-theme"][value="${currentTheme}"]`);
    if (themeRadio) themeRadio.checked = true;
    if (typeof updateNotificationStatus === 'function') {
      updateNotificationStatus();
    }
  }

  document.getElementById('open-settings-btn').addEventListener('click', () => {
    prepareSettingsModal();
    openModal('modal-settings');
  });

  // Live theme preview when radio changed or card clicked
  document.querySelectorAll('input[name="settings-theme"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  });

  document.querySelectorAll('.theme-card-option').forEach(card => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        applyTheme(radio.value);
      }
    });
  });

  // Trigger file upload from settings
  document.getElementById('trigger-file-upload').addEventListener('click', () => {
    document.getElementById('avatar-input').click();
  });

  // Remove custom photo
  document.getElementById('remove-custom-photo').addEventListener('click', () => {
    state.profile.avatar = null;
    saveData(STORAGE_KEYS.PROFILE, state.profile);
    api.deletePhoto();
    document.getElementById('user-avatar').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E3D5CA'/%3E%3Cpath d='M50 48c7.7 0 14-6.3 14-14s-6.3-14-14-14-14 6.3-14 14 6.3 14 14 14zm0 6c-11.7 0-26 5.8-26 17.5V78h52v-6.5C76 59.8 61.7 54 50 54z' fill='%23D7BDB0'/%3E%3Ctext x='50' y='65' font-size='22' text-anchor='middle' fill='%235A4A42'%3E%F0%9F%90%BE%3C/text%3E%3C/svg%3E";
    showToast('Foto redefinida para o avatar padrão.');
  });

  // Settings form submit
  document.getElementById('form-settings').addEventListener('submit', (e) => {
    e.preventDefault();
    state.profile.name = document.getElementById('settings-name-input').value.trim() || 'Laylla';
    state.profile.status = document.getElementById('settings-status-input').value.trim() || 'Hoje é um dia lindo para brilhar 🌸';

    const selectedTheme = document.querySelector('input[name="settings-theme"]:checked')?.value || 'nude';
    state.profile.theme = selectedTheme;
    applyTheme(selectedTheme);

    const notifToggle = document.getElementById('settings-notifications-toggle');
    state.profile.notificationsEnabled = !!notifToggle?.checked;

    saveData(STORAGE_KEYS.PROFILE, state.profile);
    api.saveProfile({
      name: state.profile.name,
      status: state.profile.status,
      theme: state.profile.theme,
      notificationsEnabled: state.profile.notificationsEnabled
    });
    document.getElementById('user-display-name').textContent = `Olá, ${state.profile.name} ✨`;
    document.getElementById('user-status-text').textContent = `"${state.profile.status}"`;

    closeModal('modal-settings');
    const themeLabels = {
      nude: 'Nude & Rosé 🌸',
      wine: 'Dark Wine & Plum 🍷',
      ruby: 'Ruby Glassmorphism 💎'
    };
    const themeLabel = themeLabels[selectedTheme] || 'Nude & Rosé 🌸';
    showToast(`Configurações salvas! Tema ${themeLabel} ativo 💕`);
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// ==========================================
// 8. BACKUP & EXPORT/IMPORT
// ==========================================
function initBackup() {
  const exportBtn = document.getElementById('export-data-btn');
  const importTrigger = document.getElementById('import-data-trigger');
  const importInput = document.getElementById('import-data-input');

  exportBtn.addEventListener('click', () => {
    const backupData = {
      profile: state.profile,
      events: state.events,
      tasks: state.tasks,
      habits: state.habits,
      notes: state.notes,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenda-laylla-backup-${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso! 📦');
  });

  importTrigger.addEventListener('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported.profile) state.profile = imported.profile;
        if (imported.events) state.events = imported.events;
        if (imported.tasks) state.tasks = imported.tasks;
        if (imported.habits) state.habits = imported.habits;
        if (imported.notes) state.notes = imported.notes;

        saveData(STORAGE_KEYS.PROFILE, state.profile);
        saveData(STORAGE_KEYS.EVENTS, state.events);
        saveData(STORAGE_KEYS.TASKS, state.tasks);
        saveData(STORAGE_KEYS.HABITS, state.habits);
        saveData(STORAGE_KEYS.NOTES, state.notes);

        location.reload();
      } catch (err) {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================
// 9. SERVICE WORKER & PWA INSTALLATION
// ==========================================
let deferredInstallPrompt = null;

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker ativo com sucesso ✨:', reg.scope);
      })
      .catch(err => {
        console.warn('Aviso de Service Worker:', err);
      });
  }
}

function initPWAInstall() {
  const installBtn = document.getElementById('install-pwa-btn');
  const iosHint = document.getElementById('ios-install-hint');

  // Detect iOS & Standalone
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  if (isIos && !isStandalone && iosHint) {
    iosHint.style.display = 'block';
  }

  // Capture beforeinstallprompt for Android, Chrome, Edge
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (isStandalone) {
        showToast('O app já está instalado na tela inicial! 💕');
        return;
      }

      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('App instalado na tela inicial com sucesso! 🎉📲');
          deferredInstallPrompt = null;
        }
      } else if (isIos) {
        if (iosHint) {
          iosHint.style.display = 'block';
          iosHint.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showToast('No iPhone: toque em Compartilhar ⬆️ e selecione "Adicionar à Tela de Início" 📲');
      } else {
        showToast('No navegador: abra o menu (3 pontinhos) e clique em "Instalar Aplicativo" 📲');
      }
    });
  }
}

// ==========================================
// 10. NOTIFICAÇÕES & LEMBRETES DE COMPROMISSOS
// ==========================================
const notifiedEventIds = new Set();

function updateNotificationStatus() {
  const badge = document.getElementById('notification-status-badge');
  const icon = document.getElementById('notification-status-icon');
  const text = document.getElementById('notification-status-text');
  const toggle = document.getElementById('settings-notifications-toggle');

  if (!badge || !icon || !text) return;

  if (!('Notification' in window)) {
    icon.textContent = '❌';
    text.textContent = 'Este navegador não suporta notificações';
    badge.className = 'notification-badge-row blocked';
    if (toggle) toggle.disabled = true;
    return;
  }

  if (Notification.permission === 'denied') {
    icon.textContent = '⚠️';
    text.textContent = 'Notificações bloqueadas nas permissões do navegador';
    badge.className = 'notification-badge-row blocked';
    if (toggle) toggle.checked = false;
    return;
  }

  if (state.profile.notificationsEnabled && Notification.permission === 'granted') {
    icon.textContent = '🟢';
    text.textContent = 'Lembretes ativos! Avisaremos no horário dos compromissos ✨';
    badge.className = 'notification-badge-row active';
    if (toggle) toggle.checked = true;
  } else {
    icon.textContent = '⚪';
    text.textContent = 'Lembretes desativados';
    badge.className = 'notification-badge-row';
    if (toggle) toggle.checked = false;
  }
}

function initNotifications() {
  const toggle = document.getElementById('settings-notifications-toggle');
  const testBtn = document.getElementById('test-notification-btn');

  if (toggle) {
    toggle.checked = !!state.profile.notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted';
    updateNotificationStatus();

    toggle.addEventListener('change', async () => {
      if (!('Notification' in window)) {
        alert('Seu navegador não suporta notificações.');
        toggle.checked = false;
        return;
      }

      if (toggle.checked) {
        let perm = Notification.permission;
        if (perm !== 'granted') {
          perm = await Notification.requestPermission();
        }

        if (perm === 'granted') {
          state.profile.notificationsEnabled = true;
          saveData(STORAGE_KEYS.PROFILE, state.profile);
          api.saveProfile({ notificationsEnabled: true });
          updateNotificationStatus();
          sendDesktopNotification(
            'Lembretes Ativados! 🔔🌸',
            'Prontinho, gatinha! Você receberá avisos dos seus compromissos no horário certo 💕'
          );
          showToast('Notificações e lembretes ativados com sucesso! 🔔');
        } else {
          state.profile.notificationsEnabled = false;
          saveData(STORAGE_KEYS.PROFILE, state.profile);
          toggle.checked = false;
          updateNotificationStatus();
          showToast('Permissão de notificação não autorizada.');
        }
      } else {
        state.profile.notificationsEnabled = false;
        saveData(STORAGE_KEYS.PROFILE, state.profile);
        api.saveProfile({ notificationsEnabled: false });
        updateNotificationStatus();
        showToast('Lembretes desativados.');
      }
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        alert('Seu navegador não suporta notificações.');
        return;
      }

      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          alert('Por favor, autorize as notificações para receber lembretes!');
          return;
        }
      }

      sendDesktopNotification(
        'Lembrete da Gatinha ✨',
        'Olá Laylla! O sistema de lembretes está funcionando perfeitamente no seu aparelho 🌸💕'
      );
      showToast('Notificação de teste enviada! 🔔');
    });
  }

  // Check reminders every 30 seconds
  setInterval(checkUpcomingReminders, 30000);
  checkUpcomingReminders();
}

function sendDesktopNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200]
  };

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  } catch (err) {
    try {
      new Notification(title, options);
    } catch (e) {
      console.warn('Erro ao disparar notificação:', e);
    }
  }
}

function checkUpcomingReminders() {
  if (!state.profile.notificationsEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHour}:${currentMinute}`;

  if (!state.events || !Array.isArray(state.events)) return;

  state.events.forEach(evt => {
    // If event is for today, matching current minute, and not yet notified
    if (evt.date === todayStr && evt.time === currentTimeStr && !notifiedEventIds.has(evt.id)) {
      notifiedEventIds.add(evt.id);
      sendDesktopNotification(
        `Lembrete: ${evt.title} ⏰`,
        `Horário: ${evt.time} • ${evt.category || 'Compromisso'}\n${evt.notes || 'Hora de brilhar! ✨'}`
      );
    }
  });
}
