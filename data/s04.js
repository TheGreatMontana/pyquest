/* SQL Модуль 4 — JOIN: соединение таблиц (Week 3) */
COURSE_DATA.s04 = {
  sqlModule: true,
  theory: [
    {
      title: 'Зачем нужны JOIN',
      blocks: [
        '<p>Данные специально разложены по таблицам без повторов (это называется <b>нормализация</b> — темы 1NF/2NF/3NF из Week 3). В <code>products</code> лежит только <code>category_id</code>, а имя категории — в <code>categories</code>.</p>',
        '<p><code>JOIN</code> соединяет таблицы обратно по условию — обычно «внешний ключ = первичный ключ»:</p>',
        { sqlrun: 'SELECT p.name, c.name AS category\nFROM products AS p\nJOIN categories AS c ON p.category_id = c.id\nLIMIT 6;' },
        '<p>Обрати внимание на псевдонимы таблиц (<code>p</code>, <code>c</code>) — с ними запрос короче и читаемее. <code>ON</code> — условие соединения.</p>',
      ],
    },
    {
      title: 'INNER JOIN — только совпадения',
      blocks: [
        '<p><code>INNER JOIN</code> (или просто <code>JOIN</code>) оставляет только строки, у которых нашлась пара в другой таблице:</p>',
        { sqlrun: "SELECT o.id, o.order_date, cu.name\nFROM orders AS o\nJOIN customers AS cu ON o.customer_id = cu.id\nWHERE o.status = 'done'\nLIMIT 6;" },
        '<p>Схема чтения: FROM первая таблица → JOIN вторая → ON как соединять → дальше обычные WHERE/ORDER BY. JOIN-ов в одном запросе может быть сколько угодно.</p>',
      ],
    },
    {
      title: 'LEFT JOIN — все слева + совпадения справа',
      blocks: [
        '<p><code>LEFT JOIN</code> сохраняет ВСЕ строки левой таблицы. Если пары справа нет — там будет NULL. Классика: «клиенты, у которых нет заказов»:</p>',
        { sqlrun: 'SELECT cu.name, o.id AS order_id\nFROM customers AS cu\nLEFT JOIN orders AS o ON o.customer_id = cu.id\nWHERE o.id IS NULL;' },
        '<p>Есть ещё <code>RIGHT JOIN</code> (зеркальный) и <code>FULL JOIN</code> (все строки обеих таблиц) — в SQL Server есть оба, в тренажёре RIGHT/FULL заменяются перестановкой таблиц в LEFT JOIN.</p>',
      ],
    },
    {
      title: 'Self-join — таблица сама с собой',
      blocks: [
        '<p>Таблицу можно соединить с самой собой — так решают задачу «сотрудник и его руководитель» (руководитель — тоже строка employees):</p>',
        { sqlrun: 'SELECT e.name AS employee,\n       m.name AS manager\nFROM employees AS e\nLEFT JOIN employees AS m ON e.manager_id = m.id;' },
        '<p>Секрет — два разных псевдонима одной таблицы (<code>e</code> и <code>m</code>). LEFT JOIN нужен, чтобы директор (без руководителя) не пропал. Это любимый вопрос собеседований!</p>',
      ],
    },
    {
      title: 'Цепочки JOIN: 3+ таблицы',
      blocks: [
        '<p>Реальные отчёты соединяют несколько таблиц подряд. «Что купили в каждом заказе»:</p>',
        { sqlrun: 'SELECT o.id AS order_id, cu.name AS customer,\n       p.name AS product, oi.qty\nFROM orders AS o\nJOIN customers AS cu ON o.customer_id = cu.id\nJOIN order_items AS oi ON oi.order_id = o.id\nJOIN products AS p ON p.id = oi.product_id\nLIMIT 8;' },
        '<p>Каждый JOIN добавляет таблицу в цепочку по своему ключу. Так устроен почти каждый рабочий запрос Data Engineer — освой это до автоматизма.</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Что делает INNER JOIN?', options: ['Берёт все строки обеих таблиц', 'Только строки, у которых нашлась пара по условию ON', 'Все строки левой таблицы', 'Складывает таблицы вертикально'], a: 1, explain: 'INNER JOIN оставляет только совпадения по условию <code>ON</code>.' },
    { q: 'Что будет в колонках правой таблицы у LEFT JOIN без совпадения?', options: ['0', 'Пустая строка', 'NULL', 'Строка пропадёт'], a: 2, explain: 'LEFT JOIN сохраняет строку левой таблицы, а справа подставляет NULL.' },
    { q: 'Для чего пишут ON в JOIN?', options: ['Фильтр результата', 'Условие соединения таблиц', 'Сортировка', 'Выбор колонок'], a: 1, explain: '<code>ON</code> говорит, по каким колонкам таблицы соединяются, обычно FK = PK.' },
    { q: 'Как найти клиентов БЕЗ заказов?', options: ['INNER JOIN + WHERE', 'LEFT JOIN + WHERE o.id IS NULL', 'UNION', 'DISTINCT'], a: 1, explain: 'LEFT JOIN сохранит всех клиентов, а у клиентов без заказов колонки заказа будут NULL — их и ловим.' },
    { q: 'Что такое self-join?', options: ['JOIN без ON', 'Соединение таблицы с самой собой через два псевдонима', 'JOIN трёх таблиц', 'Ошибка'], a: 1, explain: 'Одна таблица под двумя псевдонимами — так связывают сотрудника и его руководителя.' },
    { q: 'Что такое нормализация (Week 3)?', options: ['Сжатие базы', 'Разделение данных по таблицам без дублирования', 'Сортировка таблиц', 'Резервное копирование'], a: 1, explain: 'Нормальные формы (1NF, 2NF, 3NF) — правила проектирования таблиц без повторов данных.' },
  ],

  tasks: [
    {
      id: 't1', sql: true, title: 'Товары с категориями', brief: 'INNER JOIN',
      desc: '<p>Выведи название товара (псевдоним <code>product</code>) и название его категории (псевдоним <code>category</code>) — соедини <code>products</code> и <code>categories</code>.</p>',
      starter: 'SELECT p.name AS product, c.name AS category\nFROM products AS p\n-- допиши JOIN\n',
      solution: 'SELECT p.name AS product, c.name AS category FROM products AS p JOIN categories AS c ON p.category_id = c.id;',
      hint: 'JOIN categories AS c ON p.category_id = c.id',
    },
    {
      id: 't2', sql: true, title: 'Все клиенты и их заказы', brief: 'LEFT JOIN',
      desc: '<p>Выведи имя клиента (<code>name</code>) и <code>id</code> его заказов (псевдоним <code>order_id</code>) — <b>включая клиентов без заказов</b> (у них order_id будет NULL).</p>',
      starter: '-- LEFT JOIN сохранит всех клиентов\n',
      solution: 'SELECT cu.name, o.id AS order_id FROM customers AS cu LEFT JOIN orders AS o ON o.customer_id = cu.id;',
      hint: 'FROM customers AS cu LEFT JOIN orders AS o ON o.customer_id = cu.id',
    },
    {
      id: 't3', sql: true, title: 'Кто чей руководитель', brief: 'Self-join',
      desc: '<p>Выведи имя сотрудника (псевдоним <code>employee</code>) и имя его руководителя (псевдоним <code>manager</code>). Директор тоже должен попасть в результат — с NULL вместо руководителя.</p>',
      starter: '-- employees дважды: AS e и AS m\n',
      solution: 'SELECT e.name AS employee, m.name AS manager FROM employees AS e LEFT JOIN employees AS m ON e.manager_id = m.id;',
      hint: 'FROM employees AS e LEFT JOIN employees AS m ON e.manager_id = m.id',
    },
  ],

  exam: {
    time: 600,
    questions: [
      { q: 'JOIN без слова INNER — это…', options: ['LEFT JOIN', 'INNER JOIN', 'FULL JOIN', 'Ошибка'], a: 1, explain: '' },
      { q: 'Сколько строк даст INNER JOIN, если совпадений нет?', options: ['Все строки левой', '0 строк', 'Все строки правой', 'NULL-строки'], a: 1, explain: '' },
      { q: 'В цепочке из 4 таблиц сколько нужно JOIN?', options: ['1', '2', '3', '4'], a: 2, explain: '' },
      { q: 'orders.customer_id → customers.id — это связь…', options: ['PRIMARY KEY к PRIMARY KEY', 'FOREIGN KEY к PRIMARY KEY', 'UNIQUE к CHECK', 'Без связи'], a: 1, explain: '' },
      { q: 'RIGHT JOIN A → B равен…', options: ['LEFT JOIN B → A', 'INNER JOIN', 'FULL JOIN', 'UNION'], a: 0, explain: '' },
    ],
    task: {
      sql: true, title: 'Дорогая электроника с категорией',
      desc: '<p>Выведи название товара (псевдоним <code>product</code>), категорию (псевдоним <code>category</code>) и <code>price</code> для товаров дороже 500.</p>',
      starter: '',
      solution: 'SELECT p.name AS product, c.name AS category, p.price FROM products AS p JOIN categories AS c ON p.category_id = c.id WHERE p.price > 500;',
    },
  },
};
