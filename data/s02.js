/* SQL Модуль 2 — Фильтрация и сортировка (Week 2) */
COURSE_DATA.s02 = {
  sqlModule: true,
  theory: [
    {
      title: 'WHERE — фильтр строк',
      blocks: [
        '<p><code>WHERE</code> оставляет только строки, где условие истинно. Операторы: <code>=</code>, <code>&lt;&gt;</code> (не равно), <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>:</p>',
        { sqlrun: "SELECT name, price\nFROM products\nWHERE price > 500;" },
        '<p>Текст сравнивается в одинарных кавычках. Условия соединяются через <code>AND</code> / <code>OR</code>, как в Python:</p>',
        { sqlrun: "SELECT name, city\nFROM customers\nWHERE country = 'Узбекистан' AND city <> 'Ташкент';" },
      ],
    },
    {
      title: 'IN, BETWEEN, LIKE',
      blocks: [
        '<p>Три удобных оператора для фильтров:</p>',
        '<ul><li><code>IN (a, b, c)</code> — значение из списка</li><li><code>BETWEEN x AND y</code> — диапазон, границы включаются</li><li><code>LIKE</code> — шаблон текста: <code>%</code> — любые символы, <code>_</code> — один символ</li></ul>',
        { sqlrun: "SELECT name, price\nFROM products\nWHERE price BETWEEN 100 AND 300;" },
        { sqlrun: "SELECT name\nFROM products\nWHERE name LIKE 'Монитор%';" },
      ],
    },
    {
      title: 'NULL — отсутствие значения',
      blocks: [
        '<p><code>NULL</code> — это «нет данных». С ним не работают обычные сравнения: <code>manager_id = NULL</code> НЕ сработает. Только <code>IS NULL</code> / <code>IS NOT NULL</code>:</p>',
        { sqlrun: 'SELECT name, title\nFROM employees\nWHERE manager_id IS NULL;' },
        '<p>У директора нет руководителя — поэтому NULL. Это классика собеседований: «почему = NULL не работает?» Ответ: NULL не равен даже сам себе, любое сравнение с NULL даёт «неизвестно».</p>',
      ],
    },
    {
      title: 'ORDER BY и DISTINCT',
      blocks: [
        '<p><code>ORDER BY</code> сортирует результат: <code>ASC</code> — по возрастанию (по умолчанию), <code>DESC</code> — по убыванию. <code>DISTINCT</code> убирает дубликаты:</p>',
        { sqlrun: 'SELECT name, price\nFROM products\nORDER BY price DESC;' },
        { sqlrun: 'SELECT DISTINCT city\nFROM customers;' },
        '<p>Ограничение количества строк: в SQL Server — <code>SELECT TOP 3 …</code>, в тренажёре (SQLite) и PostgreSQL — <code>LIMIT 3</code> в конце запроса:</p>',
        { sqlrun: 'SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 3;' },
      ],
    },
    {
      title: 'CASE — условия внутри запроса',
      blocks: [
        '<p><code>CASE</code> — это if/elif/else внутри SQL. Создаёт вычисляемую колонку:</p>',
        { sqlrun: "SELECT name, price,\n  CASE\n    WHEN price >= 800 THEN 'дорогой'\n    WHEN price >= 200 THEN 'средний'\n    ELSE 'бюджетный'\n  END AS segment\nFROM products;" },
        '<p>Порядок веток важен — выполняется первая подходящая, как elif в Python. CASE постоянно используется в отчётах и витринах данных.</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Как выбрать товары дешевле 100?', options: ['SELECT * FROM products IF price < 100', 'SELECT * FROM products WHERE price < 100', 'SELECT * FROM products HAVING price < 100', 'FILTER products BY price < 100'], a: 1, explain: 'Фильтр строк — это <code>WHERE условие</code>.' },
    { q: 'Что означает <code>&lt;&gt;</code> в SQL?', options: ['Меньше и больше', 'Не равно', 'Диапазон', 'Сравнение строк'], a: 1, explain: '<code>&lt;&gt;</code> — «не равно» (в большинстве СУБД работает и <code>!=</code>).' },
    { q: 'Как найти строки, где manager_id пустой?', options: ['WHERE manager_id = NULL', 'WHERE manager_id == NULL', 'WHERE manager_id IS NULL', 'WHERE manager_id = 0'], a: 2, explain: 'С NULL работают только <code>IS NULL</code> и <code>IS NOT NULL</code> — сравнение через = всегда даёт «неизвестно».' },
    { q: 'Что найдёт <code>WHERE name LIKE \'А%\'</code>?', options: ['Имена, оканчивающиеся на А', 'Имена, начинающиеся с А', 'Имена, содержащие А', 'Имена ровно из одной буквы А'], a: 1, explain: '<code>%</code> — любое продолжение, значит шаблон «А%» = начинается с А.' },
    { q: 'Как отсортировать по цене от дорогих к дешёвым?', options: ['ORDER BY price', 'ORDER BY price ASC', 'ORDER BY price DESC', 'SORT price DESC'], a: 2, explain: '<code>DESC</code> — по убыванию. Без указания сортировка идёт по возрастанию (ASC).' },
    { q: 'Чем TOP отличается от LIMIT?', options: ['Ничем, TOP — в SQL Server, LIMIT — в SQLite/PostgreSQL', 'TOP быстрее', 'LIMIT сортирует, TOP нет', 'TOP выбирает случайные строки'], a: 0, explain: 'Это одно и то же ограничение количества строк, просто разные диалекты: <code>SELECT TOP 5</code> (T-SQL) против <code>LIMIT 5</code>.' },
    { q: 'Что вернёт CASE, если ни одно WHEN не подошло и есть ELSE?', options: ['Ошибку', 'NULL', 'Значение из ELSE', 'Первое WHEN'], a: 2, explain: 'Как else в Python: не подошло ни одно условие — берётся ELSE (без ELSE было бы NULL).' },
  ],

  tasks: [
    {
      id: 't1', sql: true, title: 'Бюджетные товары', brief: 'WHERE',
      desc: '<p>Выведи <code>name</code> и <code>price</code> товаров дешевле 100.</p>',
      starter: 'SELECT name, price\nFROM products\n-- добавь условие\n',
      solution: 'SELECT name, price FROM products WHERE price < 100;',
      hint: 'WHERE price < 100',
    },
    {
      id: 't2', sql: true, title: 'Клиенты из Узбекистана по алфавиту', brief: 'WHERE + ORDER BY',
      desc: '<p>Выведи <code>name</code> и <code>city</code> клиентов из страны <code>Узбекистан</code>, отсортировав по имени по алфавиту.</p>',
      starter: '-- WHERE + ORDER BY\n',
      solution: "SELECT name, city FROM customers WHERE country = 'Узбекистан' ORDER BY name;",
      orderMatters: true,
      hint: "WHERE country = 'Узбекистан' ORDER BY name — текст в одинарных кавычках.",
    },
    {
      id: 't3', sql: true, title: 'Активные заказы июня', brief: 'IN + диапазон дат',
      desc: '<p>Выведи <code>id</code>, <code>order_date</code>, <code>status</code> заказов за июнь 2026 (даты от <code>2026-06-01</code> до <code>2026-06-30</code>) со статусом <code>done</code> или <code>shipped</code>.</p>',
      starter: "-- даты сравниваются как текст: order_date >= '2026-06-01'\n",
      solution: "SELECT id, order_date, status FROM orders WHERE order_date BETWEEN '2026-06-01' AND '2026-06-30' AND status IN ('done', 'shipped');",
      hint: "BETWEEN '2026-06-01' AND '2026-06-30' и status IN ('done', 'shipped') через AND.",
    },
  ],

  exam: {
    time: 540,
    questions: [
      { q: 'Что выберет <code>WHERE price BETWEEN 100 AND 300</code>?', options: ['Только 100 и 300', 'От 100 до 300, границы включаются', 'От 101 до 299', 'Больше 300'], a: 1, explain: '' },
      { q: 'Как выбрать заказы со статусом new ИЛИ shipped?', options: ["status IN ('new', 'shipped')", "status = 'new' AND status = 'shipped'", "status LIKE 'new+shipped'", "status BETWEEN new AND shipped"], a: 0, explain: '' },
      { q: 'Что делает DISTINCT?', options: ['Сортирует', 'Убирает повторяющиеся строки', 'Считает строки', 'Фильтрует NULL'], a: 1, explain: '' },
      { q: 'Как в SQL Server взять первые 5 строк?', options: ['LIMIT 5', 'SELECT TOP 5 …', 'FIRST 5', 'ROWNUM 5'], a: 1, explain: '' },
      { q: 'Что вернёт <code>WHERE stock = NULL</code>?', options: ['Строки с пустым stock', 'Все строки', 'Ни одной строки', 'Ошибку синтаксиса'], a: 2, explain: '' },
    ],
    task: {
      sql: true, title: 'Товары в наличии, сначала дорогие',
      desc: '<p>Выведи <code>name</code> и <code>price</code> товаров, которых есть на складе (<code>stock &gt; 0</code>), отсортировав по цене от дорогих к дешёвым.</p>',
      starter: '',
      solution: 'SELECT name, price FROM products WHERE stock > 0 ORDER BY price DESC;',
      orderMatters: true,
    },
  },
};
