/**
 * ui.js — примитивы интерфейса: экранирование, иконки, подсветка кода,
 * уведомления, конфетти, доступные состояния.
 */
import { t } from './core/i18n.js';

export function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** SVG-иконка из спрайта. aria-hidden: иконки декоративны, смысл несёт текст рядом. */
export function ic(name, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
}

/* ---------- подсветка синтаксиса ---------- */
export function hlPython(src) {
  const s = esc(src);
  const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(\d+(?:\.\d+)?)\b|\b(def|return|if|elif|else|for|while|in|not|and|or|import|from|as|class|try|except|finally|with|pass|break|continue|True|False|None|lambda|is|del|raise|global|yield|self)\b|\b(print|input|len|range|type|int|str|float|bool|list|dict|set|open|sum|min|max|sorted|enumerate|round|abs|zip|isinstance|super|deque)\b/g;
  return s.replace(re, (m, com, str, num, kw, fn) => {
    if (com) return '<span class="py-com">' + com + '</span>';
    if (str) return '<span class="py-str">' + str + '</span>';
    if (num) return '<span class="py-num">' + num + '</span>';
    if (kw) return '<span class="py-kw">' + kw + '</span>';
    if (fn) return '<span class="py-fn">' + fn + '</span>';
    return m;
  });
}

export function hlSql(src) {
  const s = esc(src);
  const re = /(--[^\n]*)|('(?:[^'\n])*')|\b(\d+(?:\.\d+)?)\b|\b(SELECT|FROM|WHERE|ORDER|GROUP|BY|HAVING|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AS|AND|OR|NOT|IN|IS|NULL|LIKE|BETWEEN|DISTINCT|LIMIT|TOP|CASE|WHEN|THEN|ELSE|END|CREATE|TABLE|INSERT|INTO|VALUES|UPDATE|DELETE|SET|WITH|OVER|PARTITION|UNION|ALL|EXCEPT|INTERSECT|PRIMARY|FOREIGN|KEY|REFERENCES|DEFAULT|CHECK|UNIQUE|IDENTITY|INTEGER|TEXT|REAL|INT|NVARCHAR|DECIMAL|DATE|ASC|DESC|PRAGMA)\b|\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|LEN|ROUND|CAST|COALESCE|ISNULL|SUBSTR|SUBSTRING|REPLACE|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|NTILE|STRFTIME|GETDATE|YEAR|MONTH|DAY|DATEDIFF|DATEADD|CONCAT)\b/gi;
  return s.replace(re, (m, com, str, num, kw, fn) => {
    if (com) return '<span class="py-com">' + com + '</span>';
    if (str) return '<span class="py-str">' + str + '</span>';
    if (num) return '<span class="py-num">' + num + '</span>';
    if (kw) return '<span class="py-kw">' + m + '</span>';
    if (fn) return '<span class="py-fn">' + m + '</span>';
    return m;
  });
}

/** C-подобные языки: JavaScript, C, C++, C#, Java — общий набор правил. */
export function hlCLike(src, lang) {
  const s = esc(src);
  const KW = {
    javascript: 'const|let|var|function|return|if|else|for|while|do|break|continue|class|extends|new|this|typeof|instanceof|try|catch|finally|throw|switch|case|default|async|await|of|in|delete|null|undefined|true|false|import|export|from',
    c: 'int|char|float|double|void|long|short|unsigned|signed|const|static|struct|union|enum|typedef|sizeof|return|if|else|for|while|do|break|continue|switch|case|default|goto|NULL|include|define',
    cpp: 'int|char|float|double|void|long|short|unsigned|bool|auto|const|constexpr|static|class|struct|public|private|protected|virtual|override|template|typename|namespace|using|new|delete|this|nullptr|true|false|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|throw|include',
    csharp: 'int|string|char|float|double|decimal|bool|var|void|object|const|readonly|static|class|struct|interface|enum|public|private|protected|internal|virtual|override|abstract|sealed|namespace|using|new|this|base|null|true|false|return|if|else|for|foreach|while|do|break|continue|switch|case|default|try|catch|finally|throw|async|await|in|out|get|set',
    java: 'int|String|char|float|double|boolean|byte|long|short|void|final|static|class|interface|enum|extends|implements|public|private|protected|abstract|synchronized|package|import|new|this|super|null|true|false|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|throws',
  };
  const kw = KW[lang] || KW.javascript;
  const re = new RegExp(
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/|#[a-z]+[^\\n]*)' +          // комментарии и директивы
    '|(`(?:[^`\\\\]|\\\\.)*`|"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\')' +  // строки
    '|\\b(\\d+(?:\\.\\d+)?[fFlLuU]?)\\b' +                              // числа
    '|\\b(' + kw + ')\\b' +                                              // ключевые слова
    '|\\b([A-Za-z_]\\w*)(?=\\s*\\()',                                    // вызовы функций
    'g');
  return s.replace(re, (m, com, str, num, k, fn) => {
    if (com) return '<span class="py-com">' + com + '</span>';
    if (str) return '<span class="py-str">' + str + '</span>';
    if (num) return '<span class="py-num">' + num + '</span>';
    if (k) return '<span class="py-kw">' + k + '</span>';
    if (fn) return '<span class="py-fn">' + fn + '</span>';
    return m;
  });
}

const C_LIKE = ['javascript', 'js', 'c', 'cpp', 'csharp', 'java'];

export function codeBlock(code, lang) {
  let body;
  if (lang === 'sql') body = hlSql(code);
  else if (C_LIKE.includes(lang)) body = hlCLike(code, lang === 'js' ? 'javascript' : lang);
  else body = hlPython(code);
  return '<pre class="code" tabindex="0" data-lang="' + esc(lang || 'python') + '"><code>' + body + '</code></pre>';
}

/* ---------- уведомления ---------- */
export function toast(html, cls) {
  const layer = document.getElementById('toast-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'toast' + (cls ? ' ' + cls : '');
  el.setAttribute('role', 'status');
  el.innerHTML = html;
  layer.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 2800);
  setTimeout(() => el.remove(), 3300);
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function confetti(n) {
  if (reduceMotion()) return;                       // уважаем системную настройку
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  const colors = ['#34d399', '#38bdf8', '#fbbf24', '#a78bfa', '#f87171', '#f472b6'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = (1.6 + Math.random() * 1.8) + 's';
    c.style.animationDelay = Math.random() * 0.4 + 's';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    layer.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}

/* ---------- статусы: цвет + текст (не только цветом!) ---------- */
export function statusBadge(status) {
  const map = {
    'completed': { icon: 'check', key: 'status.completed', cls: 'ok' },
    'in-progress': { icon: 'play', key: 'status.inProgress', cls: 'progress' },
    'available': { icon: 'chevron', key: 'status.available', cls: 'available' },
    'locked': { icon: 'lock', key: 'status.locked', cls: 'locked' },
    'recommended': { icon: 'star', key: 'status.recommended', cls: 'recommended' },
  };
  const s = map[status] || map.available;
  return '<span class="status-badge ' + s.cls + '">' + ic(s.icon) + '<span>' + esc(t(s.key)) + '</span></span>';
}

export function progressBar(pct, cls) {
  const p = Math.max(0, Math.min(100, pct || 0));
  return '<div class="pbar' + (cls ? ' ' + cls : '') + '" role="progressbar" aria-valuenow="' + p +
    '" aria-valuemin="0" aria-valuemax="100"><div style="width:' + p + '%"></div></div>';
}

/** Редактор кода: Tab вставляет отступ, Esc возвращает фокус (доступность). */
export function bindEditor(ed, saveKey) {
  ed.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const s = ed.selectionStart;
      ed.value = ed.value.slice(0, s) + '    ' + ed.value.slice(ed.selectionEnd);
      ed.selectionStart = ed.selectionEnd = s + 4;
    }
    if (e.key === 'Escape') ed.blur();
  });
  if (saveKey) ed.addEventListener('input', () => {
    try { localStorage.setItem(saveKey, ed.value); } catch (err) { /* переполнение */ }
  });
}

/** Перемешивание (для блоков «сопоставь» и «по порядку»). */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Объявление для скринридеров. */
export function announce(msg) {
  const el = document.getElementById('sr-live');
  if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); }
}
