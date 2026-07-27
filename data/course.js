/* PyQuest — структура курса: 3 трека, план, геймификация, роадмап ментора */
window.COURSE = {
  tracks: [
    {
      id: 'py', name: 'Python', color: '#38bdf8', glyph: 'code',
      desc: 'Фундамент: язык, на котором работает Data Engineer',
      modules: ['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10'],
    },
    {
      id: 'sql', name: 'SQL · T-SQL', color: '#f59e0b', glyph: 'db',
      desc: 'Главный язык данных. Программа Week 1–4 от ментора, тренажёр прямо в браузере',
      modules: ['s01', 's02', 's03', 's04', 's05', 's06'],
    },
    {
      id: 'algo', name: 'Алгоритмы', color: '#a78bfa', glyph: 'algo',
      desc: '«Грокаем алгоритмы» + подготовка к LeetCode',
      modules: ['a01', 'a02', 'a03', 'a04'],
      needs: 'm08', needsText: 'Открывается после «Функций» в Python-треке',
    },
  ],

  modules: [
    { id: 'm01', track: 'py', num: 1, title: 'Старт: установка Python', tagline: 'Python, VS Code и первая программа' },
    { id: 'm02', track: 'py', num: 2, title: 'Переменные и типы данных', tagline: 'str, int, float, bool и f-строки' },
    { id: 'm03', track: 'py', num: 3, title: 'Списки', tagline: 'Индексы, срезы и методы списков' },
    { id: 'm04', track: 'py', num: 4, title: 'Циклы for', tagline: 'range, перебор списков, break и continue' },
    { id: 'm05', track: 'py', num: 5, title: 'Условия if', tagline: 'if / elif / else и логические операторы' },
    { id: 'm06', track: 'py', num: 6, title: 'Словари', tagline: 'Пары ключ-значение и работа с ними' },
    { id: 'm07', track: 'py', num: 7, title: 'Циклы while', tagline: 'Циклы по условию и валидация ввода' },
    { id: 'm08', track: 'py', num: 8, title: 'Функции', tagline: 'def, параметры, return и области видимости' },
    { id: 'm09', track: 'py', num: 9, title: 'Классы и ООП', tagline: 'Классы, объекты, __init__ и наследование' },
    { id: 'm10', track: 'py', num: 10, title: 'Работа с файлами', tagline: 'Чтение и запись файлов, with open' },

    { id: 's01', track: 'sql', num: 1, title: 'Базы данных и SELECT', tagline: 'Что такое БД, таблицы и первые запросы · Week 1' },
    { id: 's02', track: 'sql', num: 2, title: 'Фильтрация и сортировка', tagline: 'WHERE, ORDER BY, DISTINCT, NULL, CASE · Week 2' },
    { id: 's03', track: 'sql', num: 3, title: 'Функции и множества', tagline: 'Строки, даты, CAST, UNION и EXCEPT · Week 2' },
    { id: 's04', track: 'sql', num: 4, title: 'JOIN: соединение таблиц', tagline: 'INNER, LEFT, self-join и связи таблиц · Week 3' },
    { id: 's05', track: 'sql', num: 5, title: 'GROUP BY и подзапросы', tagline: 'Агрегаты, HAVING, вложенные запросы · Week 2–3' },
    { id: 's06', track: 'sql', num: 6, title: 'CTE и оконные функции', tagline: 'WITH, ROW_NUMBER, RANK, LAG · Week 4' },

    { id: 'a01', track: 'algo', num: 1, title: 'Сложность и бинарный поиск', tagline: 'O-большое и первый настоящий алгоритм · Грокаем гл. 1' },
    { id: 'a02', track: 'algo', num: 2, title: 'Сортировки', tagline: 'Сортировка выбором и пузырьком · Грокаем гл. 2' },
    { id: 'a03', track: 'algo', num: 3, title: 'Рекурсия', tagline: 'Базовый и рекурсивный случай, стек вызовов · Грокаем гл. 3' },
    { id: 'a04', track: 'algo', num: 4, title: 'Хеш-таблицы и графы', tagline: 'dict под капотом, BFS и путь к LeetCode · Грокаем гл. 5–6' },
  ],

  /* План на 6 недель — по программе ментора */
  plan: [
    { week: 1, title: 'Python: фундамент', items: ['Модули 1–5 Python-трека', 'Установи Python и VS Code (ментор одобрил VS Code)', 'Занимайся каждый день — держи стрик'] },
    { week: 2, title: 'Python: уверенность', items: ['Модули 6–10 + финальный экзамен', 'Свои решения пуш на GitHub с комментариями — так просил ментор'] },
    { week: 3, title: 'SQL: старт (Week 1–2)', items: ['Модули S1–S3 на сайте', 'Установи SQL Server 2019 + SSMS', 'Видео kudvenkat из Week 1–2 (ссылки в Роадмапе)'] },
    { week: 4, title: 'SQL: сила (Week 3–4)', items: ['Модули S4–S6 на сайте', 'Видео Week 3–4', 'Упражнения Week 2–3 из файлов ментора — ответы отправь Аслону'] },
    { week: 5, title: 'Алгоритмы', items: ['Модули A1–A4 на сайте', '«Грокаем алгоритмы» главы 1–6 (файл у тебя)', 'Первые 10 задач Easy на LeetCode'] },
    { week: 6, title: 'Реальная практика', items: ['SQL Practice Problems (файл ментора)', 'Pandas: первые шаги', 'Мини-проект: Django + Docker на своём сервере', 'Покажи результаты Аслону — он даст следующий уровень'] },
  ],

  ranks: [
    { xp: 0, name: 'Новичок' },
    { xp: 200, name: 'Ученик' },
    { xp: 500, name: 'Кодер' },
    { xp: 900, name: 'Практик' },
    { xp: 1400, name: 'Питонист' },
    { xp: 2100, name: 'Мастер кода' },
    { xp: 3000, name: 'Сенсей' },
    { xp: 4200, name: 'Data Engineer' },
  ],

  achievements: [
    { id: 'first-code', icon: '⌨️', name: 'Первый код', desc: 'Реши первую задачу' },
    { id: 'quiz-perfect', icon: '🎯', name: 'Снайпер', desc: 'Пройди квиз на 100%' },
    { id: 'boss-1', icon: '🗡️', name: 'Первый босс', desc: 'Сдай первый экзамен' },
    { id: 'streak-3', icon: '🔥', name: 'Огонёк', desc: '3 дня подряд' },
    { id: 'streak-7', icon: '🌋', name: 'Неделя силы', desc: '7 дней подряд' },
    { id: 'sql-first', icon: '🗄️', name: 'SELECT-мастер', desc: 'Реши первую SQL-задачу' },
    { id: 'half-way', icon: '⛰️', name: 'Экватор', desc: 'Пройди 10 модулей' },
    { id: 'exam-perfect', icon: '💎', name: 'Безупречно', desc: 'Экзамен на 100%' },
    { id: 'xp-1000', icon: '⚡', name: 'Тысячник', desc: 'Набери 1000 XP' },
    { id: 'all-tasks', icon: '🧠', name: 'Решала', desc: 'Реши 30 задач' },
    { id: 'py-track', icon: '🐍', name: 'Питон приручён', desc: 'Пройди Python-трек и финал' },
    { id: 'sql-track', icon: '👑', name: 'Повелитель данных', desc: 'Пройди SQL-трек' },
    { id: 'algo-track', icon: '🧮', name: 'Алгоритмист', desc: 'Пройди трек алгоритмов' },
  ],

  xpRewards: { theory: 30, quizAnswer: 10, task: 40, examPass: 120, examPerfect: 60, finalPass: 300 },

  /* Роадмап — всё, что описал ментор (Аслон Ака) сверх этого сайта */
  roadmap: [
    {
      id: 'rm-sql-ext', title: 'SQL Server — полная программа ментора',
      items: [
        { id: 'sqlserver-install', text: 'Установить SQL Server 2019 + SSMS, импортировать AdventureWorks2019 (Week 1)' },
        { id: 'kudvenkat', text: 'Плейлист kudvenkat — 150 видео по SQL Server («juda yaxshi tushuntirgan» — ментор)', link: 'https://www.youtube.com/watch?v=n1iwngG_zNY&list=PL08903FB7ACA1C2FB' },
        { id: 'kudvenkat-articles', text: 'Статьи kudvenkat (если видео сложно на слух — читай)', link: 'https://csharp-video-tutorials.blogspot.com/p/free-sql-server-video-tutorials-for.html' },
        { id: 'tsqlv4', text: 'Развернуть базу TSQLV4 (файл TSQLV4.sql у тебя) и практиковаться на ней' },
        { id: 'week-hw', text: 'Домашки Week 1–4: HW_for_Week_1, Week 2–3 Exercises.sql — решить и отправить Аслону' },
        { id: 'spp', text: 'SQL Practice Problems — 54 задачи (PDF + setup-скрипты у тебя в папке)' },
        { id: 'bengan', text: 'Книга «T-SQL Fundamentals» Ицика Бен-Гана (есть и русское издание — оба файла у тебя)' },
      ],
    },
    {
      id: 'rm-algo', title: 'Алгоритмы и подготовка к собеседованиям',
      items: [
        { id: 'grokking', text: '«Грокаем алгоритмы» Бхаргавы — прочитать целиком (PDF у тебя)' },
        { id: 'leetcode50', text: '50+ задач на LeetCode / HackerRank / robocontest (требование из WT-python-skills)', link: 'https://leetcode.com/' },
        { id: 'interview-guide', text: 'Data Engineer Interview Preparation — полный гайд (прислал ментор)', link: 'https://medium.com/@nishasreedharan/data-engineer-interview-preparation-complete-guide-98a9d16f6889' },
      ],
    },
    {
      id: 'rm-python-pro', title: 'Python продвинутый (из WT-python-skills)',
      items: [
        { id: 'files-formats', text: 'Работа с .csv и .json (не только .txt)' },
        { id: 'regex', text: 'Регулярные выражения (regex)' },
        { id: 'api', text: 'API: свой CRUD-сервис + requests (GET/POST, валидация ответов)' },
        { id: 'venv', text: 'Virtual environment: venv + pip' },
        { id: 'sql-connect', text: 'Подключение Python к SQL Server / PostgreSQL без ORM (писать запросы руками)' },
        { id: 'modules', text: 'Модули: стандартная библиотека + свои пакеты' },
      ],
    },
    {
      id: 'rm-de', title: 'Инструменты Data Engineer',
      items: [
        { id: 'pandas', text: 'Pandas: чтение csv/excel/json, фильтры, merge, дедупликация («keyin Pandas» — ментор)' },
        { id: 'numpy', text: 'NumPy и matplotlib' },
        { id: 'pyspark', text: 'PySpark или dask — большие данные («va Pyspark» — ментор)' },
        { id: 'airflow', text: 'Airflow / Prefect — понимать логику DAG' },
        { id: 'formats', text: 'Форматы: CSV vs Parquet vs JSON — в чём разница' },
        { id: 'cloud', text: 'Облака: S3, Blob, GCS, BigQuery — хотя бы основы' },
      ],
    },
    {
      id: 'rm-eng', title: 'Инженерная культура',
      items: [
        { id: 'django', text: 'Backend-проект на Django: хостинг + Docker + GitHub («architecturalarni bilish uchun» — ментор)' },
        { id: 'git-pro', text: 'Git глубже: ветки, pull request, приватные репо' },
        { id: 'github-push', text: 'Всё, что пишешь — пуш на GitHub с комментариями, показывать Аслону' },
        { id: 'docker', text: 'Docker: контейнеры и образы' },
        { id: 'linux', text: 'Linux и bash-скрипты (сервер у тебя уже есть!)' },
        { id: 'cicd', text: 'CI/CD: как устроены пайплайны' },
        { id: 'english', text: 'Английский — каждый день параллельно («doimiy englishni kuchaytirish» — ментор)' },
      ],
    },
  ],

  mentorLinks: [
    { text: 'Плейлист от ментора №1', link: 'https://www.youtube.com/playlist?list=PLkFqzDs4R3qwP5NNpsrCFMnAewAMlJqtR' },
    { text: 'Плейлист от ментора №2', link: 'https://www.youtube.com/playlist?list=PLgmMEXZSJs0-_IJQAcvomI0ZK1Eo9WJly' },
    { text: 'Плейлист от ментора №3', link: 'https://www.youtube.com/playlist?list=PLduM7bkxBdOfrkeXwUQBYl3dKwclDjXcd' },
  ],
};
window.COURSE_DATA = {};
