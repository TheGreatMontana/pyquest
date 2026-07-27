/* PyQuest — структура курса, план и геймификация */
window.COURSE = {
  modules: [
    { id: 'm01', icon: '🚀', title: 'Старт: установка Python', tagline: 'Ставим Python и PyCharm, пишем первую программу' },
    { id: 'm02', icon: '📦', title: 'Переменные и типы данных', tagline: 'str, int, float, bool и f-строки' },
    { id: 'm03', icon: '📋', title: 'Списки', tagline: 'Индексы, срезы и методы списков' },
    { id: 'm04', icon: '🔁', title: 'Циклы for', tagline: 'range, перебор списков, break и continue' },
    { id: 'm05', icon: '🔀', title: 'Условия if', tagline: 'if / elif / else и логические операторы' },
    { id: 'm06', icon: '📖', title: 'Словари', tagline: 'Пары ключ-значение и работа с ними' },
    { id: 'm07', icon: '♾️', title: 'Циклы while', tagline: 'Циклы по условию и валидация ввода' },
    { id: 'm08', icon: '🧩', title: 'Функции', tagline: 'def, параметры, return и области видимости' },
    { id: 'm09', icon: '🏗️', title: 'Классы и ООП', tagline: 'Классы, объекты, __init__ и наследование' },
    { id: 'm10', icon: '💾', title: 'Работа с файлами', tagline: 'Чтение и запись файлов, with open' },
  ],

  /* Интенсивный план на 14 дней */
  plan: [
    { day: 1,  text: '🚀 Модуль 1 — установка. Сразу начни Модуль 2!' },
    { day: 2,  text: '📦 Модуль 2 — переменные и типы. Экзамен!' },
    { day: 3,  text: '📋 Модуль 3 — списки.' },
    { day: 4,  text: '🔁 Модуль 4 — циклы for.' },
    { day: 5,  text: '🔀 Модуль 5 — условия if.' },
    { day: 6,  text: '💪 День закрепления: добей хвосты и пересдай экзамены на 100%.' },
    { day: 7,  text: '📖 Модуль 6 — словари.' },
    { day: 8,  text: '♾️ Модуль 7 — циклы while.' },
    { day: 9,  text: '🧩 Модуль 8 — функции (важнейшая тема!).' },
    { day: 10, text: '🧩 Модуль 8 — дорешай задачи и сдай экзамен.' },
    { day: 11, text: '🏗️ Модуль 9 — ООП, часть 1: классы и объекты.' },
    { day: 12, text: '🏗️ Модуль 9 — ООП, часть 2: наследование + экзамен.' },
    { day: 13, text: '💾 Модуль 10 — файлы.' },
    { day: 14, text: '🏆 ФИНАЛЬНЫЙ ЭКЗАМЕН и сертификат!' },
  ],

  ranks: [
    { xp: 0,    name: 'Новичок',        icon: '🥚' },
    { xp: 200,  name: 'Ученик змеи',    icon: '🐣' },
    { xp: 500,  name: 'Кодер',          icon: '⌨️' },
    { xp: 900,  name: 'Практик',        icon: '🔨' },
    { xp: 1400, name: 'Питонист',       icon: '🐍' },
    { xp: 2100, name: 'Мастер кода',    icon: '⚔️' },
    { xp: 3000, name: 'Сенсей Python',  icon: '🥷' },
  ],

  achievements: [
    { id: 'first-code',   icon: '👶', name: 'Первый код',   desc: 'Реши первую задачу' },
    { id: 'quiz-perfect', icon: '🎯', name: 'Снайпер',      desc: 'Пройди квиз на 100%' },
    { id: 'boss-1',       icon: '🗡️', name: 'Первый босс',  desc: 'Сдай первый экзамен' },
    { id: 'streak-3',     icon: '🔥', name: 'Огонёк',       desc: '3 дня подряд' },
    { id: 'streak-7',     icon: '🌋', name: 'Неделя силы',  desc: '7 дней подряд' },
    { id: 'half-way',     icon: '⛰️', name: 'Экватор',      desc: 'Пройди 5 модулей' },
    { id: 'exam-perfect', icon: '💎', name: 'Безупречно',   desc: 'Экзамен на 100%' },
    { id: 'xp-1000',      icon: '⚡', name: 'Тысячник',     desc: 'Набери 1000 XP' },
    { id: 'all-tasks',    icon: '🧠', name: 'Решала',       desc: 'Реши 20 задач' },
    { id: 'finisher',     icon: '👑', name: 'Легенда',      desc: 'Пройди весь курс' },
  ],

  xpRewards: { theory: 30, quizAnswer: 10, task: 40, examPass: 120, examPerfect: 60, finalPass: 300 },
};
window.COURSE_DATA = {};
