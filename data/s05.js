/* SQL Модуль 5 — GROUP BY, агрегаты и подзапросы (Week 2–3) */
COURSE_DATA.s05 = {
  sqlModule: true,
  theory: [
    {
      title: 'Агрегатные функции',
      blocks: [
        '<p>Агрегаты сворачивают много строк в одно число:</p>',
        '<ul><li><code>COUNT(*)</code> — количество строк</li><li><code>SUM(x)</code> — сумма</li><li><code>AVG(x)</code> — среднее</li><li><code>MIN(x)</code> / <code>MAX(x)</code> — минимум и максимум</li></ul>',
        { sqlrun: 'SELECT COUNT(*) AS orders_count,\n       MIN(order_date) AS first_order,\n       MAX(order_date) AS last_order\nFROM orders;' },
        '<p>Важно: <code>COUNT(колонка)</code> не считает NULL, а <code>COUNT(*)</code> считает все строки.</p>',
      ],
    },
    {
      title: 'GROUP BY — свёртка по группам',
      blocks: [
        '<p><code>GROUP BY</code> делит строки на группы и применяет агрегаты к каждой группе отдельно. «Сколько клиентов в каждой стране»:</p>',
        { sqlrun: 'SELECT country, COUNT(*) AS customers_count\nFROM customers\nGROUP BY country;' },
        '<p>Железное правило: в SELECT могут быть только колонки из GROUP BY и агрегаты. Всё остальное — ошибка (SQL Server прямо её выбросит).</p>',
        { sqlrun: 'SELECT status, COUNT(*) AS cnt\nFROM orders\nGROUP BY status;' },
      ],
    },
    {
      title: 'HAVING — фильтр групп',
      blocks: [
        '<p><code>WHERE</code> фильтрует строки ДО группировки, <code>HAVING</code> — группы ПОСЛЕ. Разница WHERE vs HAVING — вопрос из каждого собеседования (и отдельное видео Week 2):</p>',
        { sqlrun: 'SELECT customer_id, COUNT(*) AS orders_cnt\nFROM orders\nGROUP BY customer_id\nHAVING COUNT(*) >= 2;' },
        '<p>Порядок выполнения запроса: <code>FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY</code>. Именно поэтому в WHERE нельзя писать агрегаты — групп ещё не существует.</p>',
      ],
    },
    {
      title: 'Подзапросы',
      blocks: [
        '<p><b>Подзапрос</b> — запрос внутри запроса, в скобках. «Товары дороже средней цены»:</p>',
        { sqlrun: 'SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products);' },
        '<p>Подзапрос может возвращать и список — тогда используется с <code>IN</code>. «Клиенты, у которых есть заказы»:</p>',
        { sqlrun: 'SELECT name\nFROM customers\nWHERE id IN (SELECT customer_id FROM orders);' },
        '<p><b>Коррелированный</b> подзапрос ссылается на строку внешнего запроса и выполняется для каждой строки — тема отдельного видео Week 2. Часто его можно заменить на JOIN (и это быстрее — тема Week 3 про performance).</p>',
      ],
    },
    {
      title: 'JOIN + GROUP BY = отчёт',
      blocks: [
        '<p>Настоящая мощь — соединить таблицы и свернуть. «Выручка по каждому заказу»:</p>',
        { sqlrun: 'SELECT o.id, SUM(oi.qty * oi.unit_price) AS revenue\nFROM orders AS o\nJOIN order_items AS oi ON oi.order_id = o.id\nGROUP BY o.id\nORDER BY revenue DESC\nLIMIT 5;' },
        '<p>Такие запросы — ежедневная работа Data Engineer: витрины, отчёты, метрики. Освой связку JOIN + GROUP BY + HAVING — и половина рабочих задач тебе по плечу.</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Что вернёт <code>SELECT COUNT(*) FROM products</code>?', options: ['Сумму цен', 'Количество строк в products', 'Количество колонок', 'Первую строку'], a: 1, explain: '<code>COUNT(*)</code> считает строки таблицы (или группы).' },
    { q: 'В чём разница WHERE и HAVING?', options: ['Никакой', 'WHERE фильтрует строки до группировки, HAVING — группы после', 'HAVING быстрее', 'WHERE только для чисел'], a: 1, explain: 'Порядок: FROM → WHERE → GROUP BY → HAVING. Агрегаты можно фильтровать только в HAVING.' },
    { q: 'Что можно писать в SELECT при GROUP BY country?', options: ['Любые колонки', 'Только country и агрегаты', 'Только агрегаты', 'Только country'], a: 1, explain: 'Колонки из GROUP BY + агрегатные функции. Остальное — ошибка.' },
    { q: 'Считает ли COUNT(manager_id) строки с NULL?', options: ['Да', 'Нет', 'Считает как 0.5', 'Ошибка'], a: 1, explain: '<code>COUNT(колонка)</code> пропускает NULL. Все строки считает только <code>COUNT(*)</code>.' },
    { q: 'Где выполняется подзапрос <code>WHERE price > (SELECT AVG(price)…)</code>?', options: ['После внешнего', 'Внутри скобок, его результат подставляется в условие', 'Параллельно', 'Не выполняется'], a: 1, explain: 'Подзапрос вычисляется, и его результат (число) подставляется в сравнение.' },
    { q: 'Коррелированный подзапрос — это…', options: ['Подзапрос с JOIN', 'Подзапрос, ссылающийся на строку внешнего запроса', 'Два подзапроса', 'Подзапрос с GROUP BY'], a: 1, explain: 'Он использует значения текущей строки внешнего запроса и выполняется для каждой строки.' },
  ],

  tasks: [
    {
      id: 't1', sql: true, title: 'Статистика по категориям', brief: 'JOIN + GROUP BY',
      desc: '<p>Для каждой категории выведи её название (псевдоним <code>category</code>), число товаров (псевдоним <code>products_cnt</code>) и среднюю цену (псевдоним <code>avg_price</code>).</p>',
      starter: '-- JOIN + GROUP BY c.name\n',
      solution: 'SELECT c.name AS category, COUNT(*) AS products_cnt, AVG(p.price) AS avg_price FROM products AS p JOIN categories AS c ON p.category_id = c.id GROUP BY c.name;',
      hint: 'SELECT c.name AS category, COUNT(*) …, AVG(p.price) … FROM products JOIN categories … GROUP BY c.name',
    },
    {
      id: 't2', sql: true, title: 'Крупные заказы', brief: 'GROUP BY + HAVING',
      desc: '<p>Выведи <code>order_id</code> и сумму заказа (qty × unit_price, псевдоним <code>total</code>) только для заказов на сумму больше 500. Таблица — <code>order_items</code>.</p>',
      starter: 'SELECT order_id, SUM(qty * unit_price) AS total\nFROM order_items\n-- GROUP BY + HAVING\n',
      solution: 'SELECT order_id, SUM(qty * unit_price) AS total FROM order_items GROUP BY order_id HAVING SUM(qty * unit_price) > 500;',
      hint: 'GROUP BY order_id HAVING SUM(qty * unit_price) > 500',
    },
    {
      id: 't3', sql: true, title: 'Дороже среднего', brief: 'Подзапрос',
      desc: '<p>Выведи <code>name</code> и <code>price</code> товаров, чья цена выше средней цены всех товаров.</p>',
      starter: '-- подзапрос: (SELECT AVG(price) FROM products)\n',
      solution: 'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);',
      hint: 'WHERE price > (SELECT AVG(price) FROM products)',
    },
  ],

  exam: {
    time: 600,
    questions: [
      { q: 'Каким запросом посчитать сумму зарплат сотрудников?', options: ['SELECT COUNT(salary)…', 'SELECT SUM(salary) FROM employees', 'SELECT AVG(salary)…', 'SELECT TOTAL salary'], a: 1, explain: '' },
      { q: 'Можно ли написать WHERE COUNT(*) > 5?', options: ['Да', 'Нет — агрегаты фильтруются в HAVING', 'Да, но только с JOIN', 'Только в SQL Server'], a: 1, explain: '' },
      { q: 'GROUP BY city даст по одной строке на…', options: ['Каждую строку таблицы', 'Каждый уникальный город', 'Каждую колонку', 'Каждый NULL'], a: 1, explain: '' },
      { q: 'Что вернёт подзапрос <code>SELECT customer_id FROM orders</code> для IN?', options: ['Одно число', 'Список значений', 'Таблицу целиком', 'Ошибку'], a: 1, explain: '' },
      { q: 'Порядок выполнения запроса?', options: ['SELECT → FROM → WHERE', 'FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY', 'WHERE → FROM → SELECT', 'Сверху вниз'], a: 1, explain: '' },
    ],
    task: {
      sql: true, title: 'Заказы по клиентам',
      desc: '<p>Для каждого клиента, у которого есть заказы, выведи имя (псевдоним <code>customer</code>) и количество его заказов (псевдоним <code>orders_cnt</code>). Используй JOIN и GROUP BY.</p>',
      starter: '',
      solution: 'SELECT cu.name AS customer, COUNT(*) AS orders_cnt FROM customers AS cu JOIN orders AS o ON o.customer_id = cu.id GROUP BY cu.name;',
    },
  },
};
