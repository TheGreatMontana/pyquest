/* SQL Модуль 1 — Базы данных и SELECT (Week 1) */
COURSE_DATA.s01 = {
  sqlModule: true,
  theory: [
    {
      title: 'Что такое база данных и SQL',
      blocks: [
        '<p><b>База данных</b> — организованное хранилище данных. Данные лежат в <b>таблицах</b>: колонки задают структуру (имя, тип), строки — сами данные. Это фундамент профессии Data Engineer.</p>',
        '<p><b>SQL</b> — язык запросов к базе. <b>T-SQL</b> — диалект SQL в Microsoft SQL Server, именно его требует программа ментора (Week 1: установить SQL Server 2019 + SSMS).</p>',
        '<p>На этом сайте встроен настоящий SQL-движок — все запросы выполняются прямо в браузере на учебной базе магазина электроники. Синтаксис базовых запросов в тренажёре и в SQL Server одинаковый; где есть отличия — я отмечу плашкой <i>«в SQL Server»</i>.</p>',
      ],
    },
    {
      title: 'Наша учебная база: магазин',
      blocks: [
        '<p>В базе 6 таблиц:</p>',
        '<ul><li><code>customers</code> — клиенты (id, name, city, country, reg_date)</li><li><code>products</code> — товары (id, name, category_id, price, stock)</li><li><code>categories</code> — категории товаров</li><li><code>orders</code> — заказы (id, customer_id, order_date, status)</li><li><code>order_items</code> — состав заказов (order_id, product_id, qty, unit_price)</li><li><code>employees</code> — сотрудники (id, name, title, manager_id, salary, city)</li></ul>',
        '<p>Посмотри на клиентов — выполни запрос:</p>',
        { sqlrun: 'SELECT * FROM customers;' },
        '<p><code>SELECT * FROM таблица</code> — «выбери все колонки из таблицы». Звёздочка = все колонки.</p>',
      ],
    },
    {
      title: 'SELECT: выбираем колонки',
      blocks: [
        '<p>В работе почти никогда не тянут все колонки — перечисляют нужные через запятую:</p>',
        { sqlrun: 'SELECT name, price\nFROM products;' },
        '<p>Колонке можно дать псевдоним через <code>AS</code> — так делают отчёты читаемыми:</p>',
        { sqlrun: "SELECT name AS product_name,\n       price AS price_usd\nFROM products;" },
        '<p>SQL не чувствителен к регистру (<code>select</code> = <code>SELECT</code>), но ключевые слова принято писать ЗАГЛАВНЫМИ. Запрос завершается точкой с запятой.</p>',
      ],
    },
    {
      title: 'CREATE TABLE и типы данных',
      blocks: [
        '<p>Таблицы создаются командой <code>CREATE TABLE</code> — для каждой колонки задаётся тип. Основные типы в SQL Server:</p>',
        '<ul><li><code>INT</code> — целые числа</li><li><code>DECIMAL(10,2)</code> — точные дробные (деньги!)</li><li><code>NVARCHAR(100)</code> — текст до 100 символов (N = юникод)</li><li><code>DATE</code>, <code>DATETIME2</code> — даты</li><li><code>BIT</code> — да/нет</li></ul>',
        { sql: '-- Так выглядит T-SQL в SQL Server:\nCREATE TABLE suppliers (\n    id   INT IDENTITY(1,1) PRIMARY KEY,\n    name NVARCHAR(100) NOT NULL,\n    city NVARCHAR(50)\n);' },
        '<p><i>В тренажёре</i> (SQLite) типы проще: <code>INTEGER</code>, <code>REAL</code>, <code>TEXT</code>, а вместо <code>IDENTITY</code> автономер даёт <code>INTEGER PRIMARY KEY</code>. Суть та же.</p>',
        { sqlrun: "CREATE TABLE suppliers (\n    id   INTEGER PRIMARY KEY,\n    name TEXT NOT NULL,\n    city TEXT\n);\nINSERT INTO suppliers (name, city) VALUES ('TechImport', 'Ташкент');\nSELECT * FROM suppliers;" },
      ],
    },
    {
      title: 'Ограничения (constraints) — Week 1',
      blocks: [
        '<p>Ограничения защищают данные от мусора — их спрашивают на каждом собеседовании:</p>',
        '<ul><li><code>PRIMARY KEY</code> — уникальный идентификатор строки</li><li><code>FOREIGN KEY</code> — ссылка на строку другой таблицы (так связаны <code>products.category_id</code> → <code>categories.id</code>)</li><li><code>NOT NULL</code> — колонка обязана иметь значение</li><li><code>UNIQUE</code> — значения не повторяются</li><li><code>DEFAULT</code> — значение по умолчанию</li><li><code>CHECK</code> — своё правило (например, цена больше нуля)</li></ul>',
        { sql: "CREATE TABLE stores (\n    id        INT PRIMARY KEY,\n    name      NVARCHAR(50) NOT NULL,\n    ytd_sales DECIMAL(12,2) CHECK (ytd_sales >= 0),  -- только положительные\n    region    NVARCHAR(30) DEFAULT 'Unknown'\n);" },
        '<p>Это ровно то, что требует HW Week 1 ментора: базы HR и Store с CHECK, DEFAULT и внешними ключами. После этого модуля домашка станет понятной.</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Что делает запрос <code>SELECT * FROM orders</code>?', options: ['Удаляет таблицу orders', 'Выбирает все колонки и строки из orders', 'Создаёт таблицу orders', 'Выбирает только первую строку'], a: 1, explain: '<code>SELECT *</code> — выбрать все колонки, без условий вернутся все строки.' },
    { q: 'Какой тип в SQL Server правильный для хранения денег?', options: ['FLOAT', 'DECIMAL(10,2)', 'NVARCHAR(20)', 'BIT'], a: 1, explain: '<code>DECIMAL</code> хранит точные дробные значения — для денег нельзя использовать приблизительный FLOAT.' },
    { q: 'Что такое PRIMARY KEY?', options: ['Пароль таблицы', 'Уникальный идентификатор строки', 'Первая колонка таблицы', 'Самая важная таблица'], a: 1, explain: 'Первичный ключ уникально определяет каждую строку — обычно это колонка id.' },
    { q: 'Зачем нужен FOREIGN KEY?', options: ['Для быстрого поиска', 'Для связи с строкой другой таблицы', 'Для шифрования', 'Для сортировки'], a: 1, explain: 'Внешний ключ ссылается на строку другой таблицы: <code>orders.customer_id</code> → <code>customers.id</code>.' },
    { q: 'Какое ограничение запретит записать отрицательную цену?', options: ['NOT NULL', 'DEFAULT', 'CHECK (price >= 0)', 'UNIQUE'], a: 2, explain: '<code>CHECK</code> задаёт произвольное правило для значений колонки.' },
    { q: 'Что делает IDENTITY(1,1) в SQL Server?', options: ['Проверяет уникальность', 'Автоматически нумерует строки: 1, 2, 3…', 'Создаёт индекс', 'Запрещает NULL'], a: 1, explain: '<code>IDENTITY(старт, шаг)</code> — автоинкремент. В HW Week 1 нужно IDENTITY(100,10)!' },
  ],

  tasks: [
    {
      id: 't1', sql: true, title: 'Все сотрудники', brief: 'SELECT * FROM',
      desc: '<p>Выведи <b>все колонки</b> всех сотрудников из таблицы <code>employees</code>.</p>',
      starter: '-- напиши запрос\n',
      solution: 'SELECT * FROM employees;',
      hint: 'SELECT * FROM employees;',
    },
    {
      id: 't2', sql: true, title: 'Прайс-лист', brief: 'Выбор колонок',
      desc: '<p>Из таблицы <code>products</code> выведи только две колонки: <code>name</code> и <code>price</code>.</p>',
      starter: '-- только name и price\n',
      solution: 'SELECT name, price FROM products;',
      hint: 'Колонки перечисляются через запятую: SELECT name, price FROM …',
    },
    {
      id: 't3', sql: true, title: 'Своя таблица', brief: 'CREATE TABLE + INSERT',
      desc: '<p>Создай таблицу <code>couriers</code> с колонками: <code>id INTEGER PRIMARY KEY</code>, <code>name TEXT NOT NULL</code>, <code>phone TEXT</code>. Добавь двух курьеров: (1, \'Джасур\', \'+998901112233\') и (2, \'Умид\', \'+998907776655\').</p>',
      starter: '-- CREATE TABLE couriers (...);\n-- INSERT INTO couriers VALUES (...);\n',
      solution: "CREATE TABLE couriers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT);\nINSERT INTO couriers VALUES (1, 'Джасур', '+998901112233');\nINSERT INTO couriers VALUES (2, 'Умид', '+998907776655');",
      checkQuery: 'SELECT id, name, phone FROM couriers ORDER BY id;',
      hint: "CREATE TABLE couriers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT); потом два INSERT INTO couriers VALUES (…);",
    },
  ],

  exam: {
    time: 480,
    questions: [
      { q: 'Как выбрать колонки name и city из таблицы customers?', options: ['SELECT name + city FROM customers', 'SELECT name, city FROM customers', 'GET name, city FROM customers', 'SELECT FROM customers name, city'], a: 1, explain: '' },
      { q: 'Что делает AS в запросе?', options: ['Сортирует', 'Даёт колонке псевдоним', 'Фильтрует', 'Объединяет таблицы'], a: 1, explain: '' },
      { q: 'Какая таблица в нашей базе связывает заказы и товары?', options: ['customers', 'categories', 'order_items', 'employees'], a: 2, explain: '' },
      { q: 'Колонка обязана иметь значение. Какое ограничение?', options: ['UNIQUE', 'NOT NULL', 'CHECK', 'DEFAULT'], a: 1, explain: '' },
      { q: 'Что вернёт SELECT * FROM categories?', options: ['Только имена категорий', 'Все строки и колонки categories', 'Количество категорий', 'Ошибку'], a: 1, explain: '' },
    ],
    task: {
      sql: true, title: 'Каталог с остатками',
      desc: '<p>Выведи из <code>products</code> три колонки: <code>name</code>, <code>price</code>, <code>stock</code>.</p>',
      starter: '',
      solution: 'SELECT name, price, stock FROM products;',
    },
  },
};
