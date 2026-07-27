/* SQL Модуль 3 — Функции и операции с множествами (Week 2) */
COURSE_DATA.s03 = {
  sqlModule: true,
  theory: [
    {
      title: 'Строковые функции',
      blocks: [
        '<p>SQL умеет обрабатывать текст прямо в запросе. Главные функции (T-SQL → тренажёр):</p>',
        '<ul><li><code>UPPER / LOWER</code> — регистр (одинаково везде)</li><li><code>LEN</code> → <code>LENGTH</code> — длина строки</li><li><code>SUBSTRING</code> → <code>SUBSTR</code> — часть строки</li><li>Склейка: в T-SQL <code>+</code> или <code>CONCAT</code>, в тренажёре <code>||</code></li><li><code>REPLACE</code> — замена (одинаково)</li></ul>',
        { sqlrun: "SELECT UPPER(name) AS name_upper,\n       LENGTH(name) AS name_len\nFROM customers\nLIMIT 5;" },
        { sqlrun: "SELECT name || ' — ' || city AS info\nFROM employees\nLIMIT 5;" },
      ],
    },
    {
      title: 'Числа и даты',
      blocks: [
        '<p><code>ROUND(x, n)</code> округляет до n знаков. Из даты можно извлекать части: в T-SQL — <code>YEAR(d)</code>, <code>MONTH(d)</code>, <code>DATEDIFF</code>, <code>DATEADD</code>, <code>GETDATE()</code>; в тренажёре — <code>strftime</code>:</p>',
        { sqlrun: "SELECT id, order_date,\n       strftime('%m', order_date) AS month\nFROM orders\nLIMIT 6;" },
        { sql: "-- То же самое в SQL Server:\nSELECT id, order_date, MONTH(order_date) AS month\nFROM orders;\n-- Текущий момент: GETDATE(); разница дат: DATEDIFF(day, d1, d2)" },
        '<p>В программе Week 2 у ментора datetime-функциям посвящено 3 видео — это важная тема для Data Engineer (партиции по датам, отчёты по месяцам).</p>',
      ],
    },
    {
      title: 'CAST и COALESCE',
      blocks: [
        '<p><code>CAST(x AS тип)</code> преобразует тип — как <code>int()</code> и <code>str()</code> в Python:</p>',
        { sqlrun: "SELECT name, CAST(price AS INTEGER) AS price_int\nFROM products\nLIMIT 5;" },
        '<p><code>COALESCE(a, b, …)</code> возвращает первое не-NULL значение — главный способ заменить пустоту на значение по умолчанию:</p>',
        { sqlrun: 'SELECT name, COALESCE(manager_id, 0) AS manager\nFROM employees;' },
        '<p>В T-SQL есть ещё <code>ISNULL(a, b)</code> — то же самое, но только для двух аргументов. На собеседованиях любят спрашивать разницу.</p>',
      ],
    },
    {
      title: 'UNION, EXCEPT, INTERSECT',
      blocks: [
        '<p>Результаты двух запросов можно объединять как множества:</p>',
        '<ul><li><code>UNION</code> — объединение без дубликатов</li><li><code>UNION ALL</code> — объединение с дубликатами (быстрее)</li><li><code>EXCEPT</code> — строки первого запроса, которых нет во втором</li><li><code>INTERSECT</code> — только общие строки</li></ul>',
        { sqlrun: 'SELECT city FROM customers\nUNION\nSELECT city FROM employees;' },
        '<p>Правило: количество и типы колонок в обоих запросах должны совпадать. Это темы видео Week 2: Union, Except, Intersect.</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Как склеить строки в тренажёре (SQLite)?', options: ['CONCAT только', 'Оператор ||', 'Оператор +', 'JOIN'], a: 1, explain: 'В SQLite/PostgreSQL склейка — <code>||</code>. В T-SQL — <code>+</code> или CONCAT.' },
    { q: 'Что вернёт <code>COALESCE(NULL, NULL, 5, 7)</code>?', options: ['NULL', '5', '7', 'Ошибку'], a: 1, explain: 'COALESCE идёт слева направо и возвращает первое не-NULL — это 5.' },
    { q: 'Чем UNION отличается от UNION ALL?', options: ['Ничем', 'UNION убирает дубликаты, UNION ALL — нет', 'UNION ALL сортирует', 'UNION работает с одной таблицей'], a: 1, explain: 'UNION делает дедупликацию (медленнее), UNION ALL просто складывает результаты.' },
    { q: 'Что делает EXCEPT?', options: ['Объединяет всё', 'Строки первого запроса, которых нет во втором', 'Общие строки', 'Убирает NULL'], a: 1, explain: 'EXCEPT — разность множеств: «что есть у меня, но нет у тебя».' },
    { q: 'Как преобразовать price к целому?', options: ['TO_INT(price)', 'CAST(price AS INTEGER)', 'INT(price)', 'price.astype(int)'], a: 1, explain: '<code>CAST(значение AS тип)</code> — стандарт SQL. В T-SQL есть ещё CONVERT.' },
    { q: 'Функция длины строки в T-SQL?', options: ['LENGTH', 'LEN', 'SIZE', 'COUNT'], a: 1, explain: 'В SQL Server — <code>LEN()</code>, в SQLite/PostgreSQL — <code>LENGTH()</code>. Разные диалекты!' },
  ],

  tasks: [
    {
      id: 't1', sql: true, title: 'Города заглавными', brief: 'UPPER',
      desc: '<p>Выведи имя клиента (<code>name</code>) и его город ЗАГЛАВНЫМИ буквами с псевдонимом <code>city_upper</code>.</p>',
      starter: '-- UPPER(city) AS city_upper\n',
      solution: 'SELECT name, UPPER(city) AS city_upper FROM customers;',
      hint: 'SELECT name, UPPER(city) AS city_upper FROM customers;',
    },
    {
      id: 't2', sql: true, title: 'Скидка 10%', brief: 'ROUND + арифметика',
      desc: '<p>Выведи <code>name</code> и цену со скидкой 10% (price * 0.9), округлённую до 1 знака, с псевдонимом <code>sale_price</code>.</p>',
      starter: '-- ROUND(выражение, 1)\n',
      solution: 'SELECT name, ROUND(price * 0.9, 1) AS sale_price FROM products;',
      hint: 'ROUND(price * 0.9, 1) AS sale_price',
    },
    {
      id: 't3', sql: true, title: 'Все города компании', brief: 'UNION',
      desc: '<p>Выведи единый список городов без дубликатов: города клиентов (<code>customers.city</code>) плюс города сотрудников (<code>employees.city</code>).</p>',
      starter: '-- два SELECT, между ними UNION\n',
      solution: 'SELECT city FROM customers UNION SELECT city FROM employees;',
      hint: 'SELECT city FROM customers UNION SELECT city FROM employees; — UNION сам уберёт дубликаты.',
    },
  ],

  exam: {
    time: 540,
    questions: [
      { q: 'Что вернёт <code>UPPER(\'sql\')</code>?', options: ['sql', 'SQL', 'Sql', 'Ошибку'], a: 1, explain: '' },
      { q: 'ISNULL(a, b) в T-SQL — это аналог…', options: ['CASE', 'COALESCE для двух аргументов', 'EXCEPT', 'CAST'], a: 1, explain: '' },
      { q: 'Требование к запросам в UNION?', options: ['Одна и та же таблица', 'Одинаковое число и типы колонок', 'Не больше 2 колонок', 'Обязательный ORDER BY'], a: 1, explain: '' },
      { q: 'Что вернёт <code>ROUND(7.86, 1)</code>?', options: ['7.8', '7.9', '8', '7.86'], a: 1, explain: '' },
      { q: 'INTERSECT возвращает…', options: ['Все строки обоих запросов', 'Только строки, которые есть в обоих запросах', 'Разность', 'Дубликаты'], a: 1, explain: '' },
    ],
    task: {
      sql: true, title: 'Руководитель без пустот',
      desc: '<p>Выведи <code>name</code> сотрудника и <code>manager_id</code>, заменив NULL на 0, с псевдонимом <code>manager</code>.</p>',
      starter: '',
      solution: 'SELECT name, COALESCE(manager_id, 0) AS manager FROM employees;',
    },
  },
};
