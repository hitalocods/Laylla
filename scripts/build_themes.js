const fs = require('fs');

const nudeCss = fs.readFileSync('style_nude_clean.css', 'utf8');
const wineCss = fs.readFileSync('style.css', 'utf8');

// Function to prefix selectors in a CSS string
function scopeCss(css, prefix) {
  // We need to parse CSS respecting @media and standard rule blocks
  let result = '';
  let i = 0;
  const len = css.length;

  while (i < len) {
    // Skip comments
    if (css[i] === '/' && css[i+1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      result += css.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // Check for @media or @keyframes
    if (css.slice(i).startsWith('@keyframes')) {
      const braceOpen = css.indexOf('{', i);
      let depth = 1;
      let j = braceOpen + 1;
      while (j < len && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      result += css.slice(i, j);
      i = j;
      continue;
    }

    if (css.slice(i).startsWith('@media')) {
      const braceOpen = css.indexOf('{', i);
      const mediaHeader = css.slice(i, braceOpen + 1);
      result += '\n' + mediaHeader + '\n';
      
      // Find matching brace for media query
      let depth = 1;
      let j = braceOpen + 1;
      let innerStart = j;
      while (j < len && depth > 0) {
        if (css[j] === '/' && css[j+1] === '*') {
          j = css.indexOf('*/', j + 2) + 2;
          continue;
        }
        if (css[j] === '{') depth++;
        else if (css[j] === '}') {
          depth--;
          if (depth === 0) break;
        }
        j++;
      }
      const innerCss = css.slice(innerStart, j);
      result += scopeCss(innerCss, prefix);
      result += '\n}\n';
      i = j + 1;
      continue;
    }

    // Normal rule
    const braceOpen = css.indexOf('{', i);
    if (braceOpen === -1) {
      result += css.slice(i);
      break;
    }

    const rawSelector = css.slice(i, braceOpen).trim();
    const braceClose = css.indexOf('}', braceOpen);
    if (braceClose === -1) break;

    const body = css.slice(braceOpen, braceClose + 1);

    if (rawSelector && !rawSelector.startsWith('@')) {
      const scopedSelector = rawSelector.split(',').map(part => {
        part = part.trim();
        if (!part) return '';
        if (part === ':root' || part === 'html') return prefix;
        if (part === 'body') return `${prefix} body, html${prefix} body, ${prefix}`;
        if (part.startsWith('body ')) return `${prefix} ${part.slice(5)}, html${prefix} ${part}`;
        if (part.startsWith('html ')) return `${prefix} ${part.slice(5)}`;
        return `${prefix} ${part}`;
      }).filter(Boolean).join(',\n');

      result += scopedSelector + ' ' + body + '\n';
    } else {
      result += rawSelector + ' ' + body + '\n';
    }

    i = braceClose + 1;
  }

  return result;
}

// Generate scoped wine rules
const scopedWine = scopeCss(wineCss, '[data-theme="wine"]');

const themeCardsCss = `
/* =====================================================
   THEME SWITCHER IN SETTINGS MODAL
   ===================================================== */
.theme-cards-picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

@media (max-width: 480px) {
  .theme-cards-picker {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.theme-card-option {
  position: relative;
  cursor: pointer;
  display: block;
}

.theme-card-option input[type="radio"] {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  pointer-events: none;
}

.theme-card-preview {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-subtle);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.theme-nude-preview {
  background: #FAF7F4;
  color: #3E332E;
}

.theme-wine-preview {
  background: #160F1C;
  color: #FFFFFF;
}

.theme-card-option input[type="radio"]:checked + .theme-card-preview {
  border-color: #D7BDB0;
  box-shadow: 0 4px 18px rgba(215, 189, 176, 0.45);
  transform: translateY(-2px);
}

[data-theme="wine"] .theme-card-option input[type="radio"]:checked + .theme-card-preview {
  border-color: #642444;
  box-shadow: 0 4px 18px rgba(100, 36, 68, 0.55);
}

.theme-card-option input[type="radio"]:checked + .theme-card-preview::after {
  content: "✓";
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #D7BDB0;
  color: #FFF;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

[data-theme="wine"] .theme-card-option input[type="radio"]:checked + .theme-card-preview::after {
  background: #642444;
}

.theme-swatch-bar {
  display: flex;
  gap: 4px;
  align-items: center;
}

.theme-swatch-bar span {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.theme-card-info strong {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.2;
}

.theme-card-info small {
  display: block;
  font-size: 0.72rem;
  opacity: 0.75;
  margin-top: 2px;
}
`;

const combinedCss = `/* =====================================================
   AGENDA DA LAYLLA - TEMA BASE: NUDE & ROSÉ 🌸
   Paleta: #D7BDB0, #E3D5CA, #F5EBE1, #D6CCC2, #EDEEE9
   ===================================================== */
${nudeCss}

/* =====================================================
   AGENDA DA LAYLLA - TEMA ALTERNATIVO: DARK WINE & PLUM 🍷
   Paleta: #0C0C14, #44142C, #642444, #E4E4EC, #FFFFFF
   ===================================================== */
${scopedWine}

${themeCardsCss}
`;

fs.writeFileSync('style.css', combinedCss, 'utf8');
fs.writeFileSync('public/style.css', combinedCss, 'utf8');
console.log('Successfully built combined style.css and public/style.css! Total length:', combinedCss.length);
