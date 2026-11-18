const { execSync } = require('child_process');
const fs = require('fs');

// 1. Get pure original responsive stylesheet from commit 6d79cca
let rawCss = execSync('git show 6d79cca:style.css', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');

// 2. Remove the old :root variable block
const rootEndIndex = rawCss.indexOf('*, *::before, *::after');
if (rootEndIndex === -1) {
  throw new Error('Could not find *, *::before, *::after in original CSS');
}
let cssBody = rawCss.slice(rootEndIndex);

// 3. Systematically replace hardcoded colors in CSS body with theme variables
const replacements = [
  // Body background
  ['background: linear-gradient(135deg, #F3ECE6 0%, #E7D9CF 50%, #D8C0B4 100%);', 'background: var(--bg-body-gradient);'],
  
  // App frame
  ['border: 3px solid rgba(255, 255, 255, 0.85);', 'border: var(--border-app-frame);'],
  ['box-shadow: 0 20px 60px rgba(78, 62, 56, 0.14), 0 2px 10px rgba(0, 0, 0, 0.04);', 'box-shadow: var(--shadow-app-frame);'],
  
  // Sidebar
  ['background: linear-gradient(180deg, #FDFBF9 0%, #F5ECE5 100%);', 'background: var(--bg-sidebar);'],
  ['background: rgba(253, 251, 249, 0.96);', 'background: var(--bg-sidebar-mobile);'],
  ['background: rgba(255, 255, 255, 0.95);', 'background: var(--bg-bottom-nav);'],
  
  // Cards & containers (replace hardcoded white backgrounds)
  ['.glass-card {\n  background: #FFFFFF;', '.glass-card {\n  background: var(--card-bg);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  box-shadow: var(--shadow-card);'],
  ['.schedule-section {\n  background: #FFFFFF;', '.schedule-section {\n  background: var(--card-bg);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  box-shadow: var(--shadow-card);'],
  ['.tasks-main-column {\n  background: #FFFFFF;', '.tasks-main-column {\n  background: var(--card-bg);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  box-shadow: var(--shadow-card);'],
  ['.habit-widget {\n  background: #FFF;', '.habit-widget {\n  background: var(--card-bg);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  box-shadow: var(--shadow-card);'],
  ['.modal-dialog {\n  background: #FFF;', '.modal-dialog {\n  background: var(--card-bg);\n  border: 1px solid var(--border-subtle);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  box-shadow: var(--shadow-app-frame);'],

  // Subtle card items (task items, events, quick boxes)
  ['.event-card {\n  background: #FFF;', '.event-card {\n  background: var(--card-bg-subtle);'],
  ['.task-item {\n  background: #FFF;', '.task-item {\n  background: var(--card-bg-subtle);\n  color: var(--text-primary);'],
  ['.quick-add-task-box {\n  background: #FFF;', '.quick-add-task-box {\n  background: var(--card-bg-subtle);'],
  ['.filter-chip {\n  background: #FFF;', '.filter-chip {\n  background: var(--card-bg-subtle);'],
  ['.filter-chip.active {\n  background: var(--color-rose-nude);', '.filter-chip.active {\n  background: var(--btn-primary-bg);'],
  ['.empty-state {\n  text-align: center;\n  padding: 30px 16px;\n  background: rgba(255, 255, 255, 0.7);', '.empty-state {\n  text-align: center;\n  padding: 30px 16px;\n  background: var(--card-bg-subtle);'],

  // Active desktop tab
  ['.desktop-sidebar-nav .nav-tab.active {\n  background: #FFFFFF;', '.desktop-sidebar-nav .nav-tab.active {\n  background: var(--card-bg);'],
  ['.desktop-sidebar-nav .nav-tab:hover {\n  background: rgba(255, 255, 255, 0.7);', '.desktop-sidebar-nav .nav-tab:hover {\n  background: var(--card-bg-subtle);'],

  // Mood pills
  ['.mood-pill {\n  font-size: 0.76rem;\n  font-family: var(--font-main);\n  background: #FFF;', '.mood-pill {\n  font-size: 0.76rem;\n  font-family: var(--font-main);\n  background: var(--card-bg-subtle);'],

  // Avatar & badges
  ['border: 2px solid #FFF;', 'border: 2px solid var(--accent-badge-border);'],
  ['.greeting-badge {\n  font-size: 0.7rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  color: var(--text-secondary);\n  background: var(--color-cream);\n  padding: 2px 7px;\n  border-radius: var(--radius-pill);', '.greeting-badge {\n  font-size: 0.7rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  color: var(--badge-tag-color);\n  background: var(--badge-tag-bg);\n  padding: 2px 8px;\n  border-radius: var(--radius-pill);\n  border: var(--badge-tag-border);'],

  // Avatar image placeholder
  ['  border-radius: 50%;\n  background: #FFF;', '  border-radius: 50%;\n  background: var(--card-bg);'],

  // Input focus backgrounds
  ['.gym-add-item-box input:focus {\n  border-color: var(--color-rose-nude);\n  background: #FFF;', '.gym-add-item-box input:focus {\n  border-color: var(--color-rose-nude);\n  background: var(--input-bg);'],
  ['.form-group textarea:focus {\n  border-color: var(--color-rose-nude);\n  background: #FFF;', '.form-group textarea:focus {\n  border-color: var(--color-rose-nude);\n  background: var(--input-bg);'],

  // Buttons & controls
  ['background: rgba(255, 255, 255, 0.85);', 'background: var(--icon-btn-bg);'],
  ['.pill-btn.primary {\n  background: var(--color-rose-nude);', '.pill-btn.primary {\n  background: var(--btn-primary-bg);'],
  ['.pill-btn.secondary {\n  background: var(--color-cream);', '.pill-btn.secondary {\n  background: var(--btn-secondary-bg);'],

  // Tasks hero
  ['background: linear-gradient(135deg, var(--color-latte) 0%, var(--color-cream) 100%);', 'background: var(--tasks-hero-bg);'],
  ['background: var(--color-rose-nude);\n  border-radius: var(--radius-pill);', 'background: var(--progress-fill-bg);\n  border-radius: var(--radius-pill);'],

  // Calendar cells
  ['.cal-day-cell.today {\n  border: 1.5px solid var(--color-rose-nude);\n  font-weight: 700;\n}', '.cal-day-cell.today {\n  background: var(--cal-today-bg);\n  color: var(--cal-today-color) !important;\n  border: 1.5px solid var(--border-focus);\n  font-weight: 700;\n}'],
  ['.cal-day-cell.selected {\n  background: var(--color-rose-nude) !important;', '.cal-day-cell.selected {\n  background: var(--cal-selected-bg) !important;\n  color: var(--cal-selected-color) !important;'],

  // Inputs
  ['.form-group input[type="text"],\n.form-group input[type="date"],\n.form-group input[type="time"],\n.form-group textarea,\n.form-group select {\n  font-family: var(--font-main);\n  background: var(--color-pearl);', '.form-group input[type="text"],\n.form-group input[type="date"],\n.form-group input[type="time"],\n.form-group textarea,\n.form-group select {\n  font-family: var(--font-main);\n  background: var(--input-bg);\n  color: var(--text-primary);']
];

for (const [from, to] of replacements) {
  if (cssBody.includes(from)) {
    cssBody = cssBody.replace(from, to);
  } else {
    console.warn('Notice: replacement pattern not exact:', from.slice(0, 35));
  }
}

// 4. Multi-Theme Definitions
const themeDefinitions = `/* =====================================================
   AGENDA DA LAYLLA ✨ - SISTEMA MULTI-TEMA
   1. Nude & Rosé 🌸 (Padrão Aconchegante)
   2. Dark Wine & Plum 🍷 (Vinho & Ameixa Sofisticado)
   3. Ruby Glassmorphism 💎 (Efeito Vidro Vermelho & Preto Obsidian)
   ===================================================== */

:root, [data-theme="nude"] {
  --theme-id: "nude";
  --color-rose-nude: #D7BDB0;
  --color-latte: #E3D5CA;
  --color-cream: #F5EBE1;
  --color-taupe: #D6CCC2;
  --color-pearl: #EDEEE9;
  
  /* Text and contrast */
  --text-primary: #3E332E;
  --text-secondary: #74635D;
  --text-muted: #9E8D86;
  --text-inverse: #FFFFFF;

  /* Backgrounds */
  --bg-body-gradient: linear-gradient(135deg, #F3ECE6 0%, #E7D9CF 50%, #D8C0B4 100%);
  --bg-app: #FAF7F4;
  --bg-sidebar: linear-gradient(180deg, #FDFBF9 0%, #F5ECE5 100%);
  --bg-sidebar-mobile: rgba(253, 251, 249, 0.96);
  --bg-bottom-nav: rgba(255, 255, 255, 0.95);

  --card-bg: #FFFFFF;
  --card-bg-subtle: #FAF7F4;
  --card-tint: #F7EFE8;
  --card-inner: #FAF7F4;
  --glass-blur: none;

  /* Borders & shadows */
  --border-subtle: #E8DCD4;
  --border-focus: #D7BDB0;
  --border-app-frame: 3px solid rgba(255, 255, 255, 0.85);
  --shadow-app-frame: 0 20px 60px rgba(78, 62, 56, 0.14), 0 2px 10px rgba(0, 0, 0, 0.04);
  --shadow-card: 0 8px 24px rgba(114, 97, 91, 0.07);
  --shadow-soft: 0 8px 24px rgba(114, 97, 91, 0.07);
  --shadow-hover: 0 12px 30px rgba(114, 97, 91, 0.11);
  --shadow-pill: 0 4px 14px rgba(215, 189, 176, 0.35);

  --avatar-gradient: linear-gradient(135deg, #D7BDB0, #E3D5CA);
  --accent-badge-bg: #D7BDB0;
  --accent-badge-border: #FFFFFF;

  --badge-tag-bg: #F5EBE1;
  --badge-tag-color: #74635D;
  --badge-tag-border: none;

  --btn-primary-bg: linear-gradient(135deg, #D7BDB0, #C5A799);
  --btn-primary-color: #FFFFFF;
  --btn-primary-shadow: 0 4px 14px rgba(215, 189, 176, 0.45);
  --btn-secondary-bg: #F5EBE1;
  --btn-secondary-color: #74635D;

  --cal-today-bg: #E3D5CA;
  --cal-today-color: #3E332E;
  --cal-selected-bg: #D7BDB0;
  --cal-selected-color: #FFFFFF;

  --tasks-hero-bg: linear-gradient(135deg, #E3D5CA 0%, #F5EBE1 100%);
  --progress-fill-bg: #D7BDB0;

  --icon-btn-bg: rgba(255, 255, 255, 0.85);
  --icon-btn-color: #74635D;
  --icon-btn-hover-bg: #F5EBE1;
  --icon-btn-hover-color: #3E332E;

  --mood-pill-bg: #FFFFFF;
  --mood-pill-color: #74635D;
  --mood-pill-active-bg: #D7BDB0;

  --input-bg: #FAF7F4;

  --radius-xs: 8px;
  --radius-sm: 14px;
  --radius-md: 20px;
  --radius-lg: 26px;
  --radius-pill: 999px;

  --font-main: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;
}

[data-theme="wine"] {
  --theme-id: "wine";
  --color-rose-nude: #642444;
  --color-latte: #44142C;
  --color-cream: #22182B;
  --color-taupe: #261A30;
  --color-pearl: #160F1C;

  /* Text and contrast */
  --text-primary: #FFFFFF;
  --text-secondary: #E4E4EC;
  --text-muted: #9E8E9C;
  --text-inverse: #0C0C14;

  /* Backgrounds */
  --bg-body-gradient: radial-gradient(circle at 50% 12%, #260E1C 0%, #110B16 45%, #0C0C14 100%);
  --bg-app: #120E18;
  --bg-sidebar: linear-gradient(180deg, #18111E 0%, #120D17 100%);
  --bg-sidebar-mobile: rgba(18, 14, 24, 0.96);
  --bg-bottom-nav: rgba(18, 14, 24, 0.95);

  --card-bg: #1A1220;
  --card-bg-subtle: #22182B;
  --card-tint: #261A30;
  --card-inner: #160F1C;
  --glass-blur: none;

  /* Borders & shadows */
  --border-subtle: rgba(100, 36, 68, 0.35);
  --border-focus: #642444;
  --border-app-frame: 2px solid rgba(100, 36, 68, 0.45);
  --shadow-app-frame: 0 24px 70px rgba(0, 0, 0, 0.7), 0 0 40px rgba(100, 36, 68, 0.2);
  --shadow-card: 0 10px 30px rgba(0, 0, 0, 0.45);
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.45);
  --shadow-hover: 0 14px 38px rgba(0, 0, 0, 0.65);
  --shadow-pill: 0 4px 16px rgba(100, 36, 68, 0.55);

  --avatar-gradient: linear-gradient(135deg, #642444, #44142C);
  --accent-badge-bg: #642444;
  --accent-badge-border: #18111E;

  --badge-tag-bg: rgba(68, 20, 44, 0.6);
  --badge-tag-color: #E4E4EC;
  --badge-tag-border: 1px solid rgba(100, 36, 68, 0.35);

  --btn-primary-bg: linear-gradient(135deg, #642444, #44142C);
  --btn-primary-color: #FFFFFF;
  --btn-primary-shadow: 0 4px 16px rgba(100, 36, 68, 0.55);
  --btn-secondary-bg: #22182B;
  --btn-secondary-color: #E4E4EC;

  --cal-today-bg: #44142C;
  --cal-today-color: #FFFFFF;
  --cal-selected-bg: #642444;
  --cal-selected-color: #FFFFFF;

  --tasks-hero-bg: linear-gradient(135deg, #44142C 0%, #220B17 100%);
  --progress-fill-bg: linear-gradient(90deg, #642444, #A03D72);

  --icon-btn-bg: #201728;
  --icon-btn-color: #E4E4EC;
  --icon-btn-hover-bg: #44142C;
  --icon-btn-hover-color: #FFFFFF;

  --mood-pill-bg: #1C1322;
  --mood-pill-color: #E4E4EC;
  --mood-pill-active-bg: linear-gradient(135deg, #642444, #44142C);

  --input-bg: #160F1C;
}

[data-theme="ruby"] {
  --theme-id: "ruby";
  --color-rose-nude: #FF1744;
  --color-latte: #8A0014;
  --color-cream: #280309;
  --color-taupe: #1B0206;
  --color-pearl: #100103;

  /* Text and contrast */
  --text-primary: #FFFFFF;
  --text-secondary: #FFD2DA;
  --text-muted: #B87A86;
  --text-inverse: #080002;

  /* Backgrounds: Dark obsidian with glowing ruby backlights (Glassmorphic) */
  --bg-body-gradient: radial-gradient(circle at 85% 15%, #E60026 0%, transparent 40%),
                      radial-gradient(circle at 10% 85%, #99001A 0%, transparent 45%),
                      radial-gradient(circle at 50% 50%, #220207 0%, #080002 100%);
  --bg-app: rgba(18, 2, 5, 0.82);
  --bg-sidebar: linear-gradient(180deg, rgba(28, 3, 7, 0.9) 0%, rgba(14, 1, 3, 0.95) 100%);
  --bg-sidebar-mobile: rgba(18, 2, 5, 0.95);
  --bg-bottom-nav: rgba(18, 2, 5, 0.95);

  --card-bg: rgba(38, 4, 10, 0.65);
  --card-bg-subtle: rgba(52, 6, 14, 0.72);
  --card-tint: rgba(65, 8, 18, 0.6);
  --card-inner: rgba(22, 2, 6, 0.85);
  --glass-blur: blur(20px);

  /* Borders & shadows */
  --border-subtle: rgba(255, 30, 60, 0.28);
  --border-focus: #FF1744;
  --border-app-frame: 1px solid rgba(255, 45, 75, 0.38);
  --shadow-app-frame: 0 24px 80px rgba(0, 0, 0, 0.88), 0 0 60px rgba(230, 0, 38, 0.28);
  --shadow-card: 0 16px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.5);
  --shadow-hover: 0 14px 40px rgba(255, 23, 68, 0.4);
  --shadow-pill: 0 4px 18px rgba(255, 23, 68, 0.6);

  --avatar-gradient: linear-gradient(135deg, #FF1744, #8A0014);
  --accent-badge-bg: #FF1744;
  --accent-badge-border: #140205;

  --badge-tag-bg: rgba(138, 0, 20, 0.6);
  --badge-tag-color: #FFD2DA;
  --badge-tag-border: 1px solid rgba(255, 45, 75, 0.35);

  --btn-primary-bg: linear-gradient(135deg, #FF1744 0%, #B7001F 100%);
  --btn-primary-color: #FFFFFF;
  --btn-primary-shadow: 0 4px 20px rgba(255, 23, 68, 0.65);
  --btn-secondary-bg: rgba(50, 6, 14, 0.75);
  --btn-secondary-color: #FFD2DA;

  --cal-today-bg: #8A0014;
  --cal-today-color: #FFFFFF;
  --cal-selected-bg: #FF1744;
  --cal-selected-color: #FFFFFF;

  --tasks-hero-bg: linear-gradient(135deg, rgba(200, 15, 45, 0.75) 0%, rgba(45, 3, 10, 0.9) 100%);
  --progress-fill-bg: linear-gradient(90deg, #FF1744, #FF5277);

  --icon-btn-bg: rgba(50, 6, 14, 0.85);
  --icon-btn-color: #FFD2DA;
  --icon-btn-hover-bg: #FF1744;
  --icon-btn-hover-color: #FFFFFF;

  --mood-pill-bg: rgba(35, 4, 9, 0.85);
  --mood-pill-color: #FFD2DA;
  --mood-pill-active-bg: linear-gradient(135deg, #FF1744, #8A0014);

  --input-bg: rgba(22, 2, 6, 0.88);
}
`;

// 5. CSS for the 3-Theme Picker in Settings Modal, Notifications & PWA
const themePickerCss = `
/* =====================================================
   SELETOR DE TEMAS NAS CONFIGURAÇÕES (3 OPÇÕES)
   ===================================================== */
.theme-cards-picker {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 8px;
}

@media (max-width: 600px) {
  .theme-cards-picker {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.theme-card-option {
  position: relative;
  cursor: pointer;
  display: block;
}

.theme-card-option input[type="radio"] {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  pointer-events: none;
}

.theme-card-preview {
  padding: 12px 10px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-subtle);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  height: 100%;
}

.theme-nude-preview {
  background: #FAF7F4;
  color: #3E332E;
}

.theme-wine-preview {
  background: #160F1C;
  color: #FFFFFF;
}

.theme-ruby-preview {
  background: #170104;
  color: #FFFFFF;
  border-color: rgba(255, 23, 68, 0.4);
}

.theme-card-option input[type="radio"]:checked + .theme-card-preview {
  border-color: var(--color-rose-nude);
  box-shadow: 0 4px 18px var(--shadow-pill);
  transform: translateY(-2px);
}

.theme-card-option input[type="radio"]:checked + .theme-card-preview::after {
  content: "✓";
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-rose-nude);
  color: #FFF;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-swatch-bar {
  display: flex;
  gap: 4px;
  align-items: center;
}

.theme-swatch-bar span {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.theme-card-info strong {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.2;
}

.theme-card-info small {
  display: block;
  font-size: 0.68rem;
  opacity: 0.8;
  margin-top: 2px;
}

/* =====================================================
   SETTINGS: NOTIFICATIONS & PWA INSTALL BOXES
   ===================================================== */
.settings-section-box {
  background: var(--card-bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.settings-box-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  display: block;
}

/* iOS-style toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-subtle);
  transition: .3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 999px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.25);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-rose-nude);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.notification-badge-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--text-muted);
  padding: 2px 0;
}

.notification-badge-row.active {
  color: #27AE60;
  font-weight: 600;
}

.notification-badge-row.blocked {
  color: #E74C3C;
  font-weight: 600;
}

.ios-install-card {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  background: var(--card-inner);
  border: 1px dashed var(--border-subtle);
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.ios-hint-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ios-install-card p {
  margin-bottom: 3px;
}

.ios-install-card p:last-child {
  margin-bottom: 0;
}

/* =====================================================
   CADERNINHO DE NOTAS (CONTRASTE & EDITAR)
   ===================================================== */
.note-card {
  border-radius: var(--radius-md);
  padding: 16px;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  min-height: 130px;
  word-break: break-word;
  cursor: pointer;
  box-shadow: var(--shadow-card);
}

.note-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.note-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.note-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.note-card-actions .action-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

/* Dark note contrast (Ruby & Wine) */
.note-card.dark-note {
  color: #FFFFFF !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}
.note-card.dark-note h4 {
  color: #FFFFFF !important;
}
.note-card.dark-note p {
  color: #FFE6EB !important;
}
.note-card.dark-note .note-card-date {
  color: rgba(255, 255, 255, 0.75) !important;
}
.note-card.dark-note .action-icon-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #FFFFFF !important;
}
.note-card.dark-note .action-icon-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: scale(1.1);
}
.note-card.dark-note .action-icon-btn.delete:hover {
  background: rgba(255, 50, 75, 0.45) !important;
  color: #FF8595 !important;
}

/* Light note contrast (Nude & Rosé) */
.note-card.light-note {
  color: #3E332E !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}
.note-card.light-note h4 {
  color: #2D231F !important;
}
.note-card.light-note p {
  color: #55453F !important;
}
.note-card.light-note .note-card-date {
  color: #7A6761 !important;
}
.note-card.light-note .action-icon-btn {
  background: rgba(0, 0, 0, 0.06) !important;
  color: #55453F !important;
}
.note-card.light-note .action-icon-btn:hover {
  background: rgba(0, 0, 0, 0.12) !important;
  transform: scale(1.1);
}
.note-card.light-note .action-icon-btn.delete:hover {
  background: #FFE4E4 !important;
  color: #C0392B !important;
}

[data-theme="ruby"] .note-card {
  border: 1px solid rgba(255, 30, 60, 0.35) !important;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(18px) !important;
  -webkit-backdrop-filter: blur(18px) !important;
}

[data-theme="wine"] .note-card {
  border: 1px solid rgba(100, 36, 68, 0.4) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
}
`;

const finalCss = `${themeDefinitions}

${cssBody}

${themePickerCss}
`;

fs.writeFileSync('style.css', finalCss, 'utf8');
fs.writeFileSync('public/style.css', finalCss, 'utf8');
console.log('Successfully generated clean 3-theme style.css! Total lines:', finalCss.split('\n').length);
