/* SQL Модуль 6 — CTE и оконные функции (Week 4) */
COURSE_DATA.s06 = {
  sqlModule: true,
  theory: [
    {
      title: 'CTE — общее табличное выражение',
      blocks: [
        '<p><code>WITH имя AS (запрос)</code> создаёт временный именованный результат — <b>CTE</b> (Common Table Expression). Это способ разбить сложный запрос на понятные шаги:</p>',
        { sqlrun: 'WITH order_totals AS (\n    SELECT order_id, SUM(qty * unit_price) AS total\n    FROM order_items\n    GROUP BY order_id\n)\nSELECT order_id, total\nFROM order_totals\nWHERE total > 800;' },
        '<p>Сначала считаем суммы заказов (CTE), потом фильтруем результат как обычную таблицу. Week 4 у ментора сравнивает CTE с временными таблицами (<code>#temp</code>) и табличными переменными (<code>@table</code>) — CTE живёт только внутри одного запроса.</p>',
      ],
    },
    {
      title: 'Оконные функции: OVER',
      blocks: [
        '<p><b>Оконные функции</b> — как агрегаты, но НЕ сворачивают строки: каждая строка остаётся, а рядом появляется вычисление «по окну». Ключевое слово — <code>OVER</code>:</p>',
        { sqlrun: 'SELECT name, city, salary,\n       AVG(salary) OVER (PARTITION BY city) AS avg_city_salary\nFROM employees;' },
        '<p><code>PARTITION BY city</code> делит строки на окна по городам — и у каждого сотрудника видно среднее ЕГО города. GROUP BY схлопнул бы всё до одной строки на город, а окно сохраняет детали. Это тема №1 собеседований по SQL!</p>',
      ],
    },
    {
      title: 'ROW_NUMBER, RANK, DENSE_RANK',
      blocks: [
        '<p>Функции нумерации расставляют строки по порядку внутри окна:</p>',
        { sqlrun: 'SELECT name, price,\n  ROW_NUMBER() OVER (ORDER BY price DESC) AS row_num,\n  RANK()       OVER (ORDER BY price DESC) AS rnk,\n  DENSE_RANK() OVER (ORDER BY price DESC) AS dense_rnk\nFROM products\nLIMIT 8;' },
        '<p>Разница видна на одинаковых значениях: <code>ROW_NUMBER</code> всегда 1,2,3…; <code>RANK</code> даёт одинаковым одно место и «дырку» после (1,2,2,4); <code>DENSE_RANK</code> — без дырок (1,2,2,3). Вопрос про их разницу — стандарт собеседования (и отдельное видео Week 4).</p>',
      ],
    },
    {
      title: 'LAG и LEAD — сосед по строке',
      blocks: [
        '<p><code>LAG(x)</code> — значение из предыдущей строки окна, <code>LEAD(x)</code> — из следующей. Так сравнивают «с прошлым периодом»:</p>',
        { sqlrun: 'SELECT id, order_date,\n       LAG(order_date) OVER (ORDER BY order_date) AS prev_date\nFROM orders\nLIMIT 8;' },
        '<p>Типичная рабочая задача: «на сколько выросли продажи по сравнению с прошлым месяцем» — это LAG. Без оконных функций пришлось бы писать сложный self-join.</p>',
      ],
    },
    {
      title: 'Нарастающий итог (running total)',
      blocks: [
        '<p>Агрегат + <code>OVER (ORDER BY …)</code> = нарастающий итог. Классика отчётности:</p>',
        { sqlrun: 'WITH daily AS (\n    SELECT o.order_date, SUM(oi.qty * oi.unit_price) AS day_total\n    FROM orders AS o\n    JOIN order_items AS oi ON oi.order_id = o.id\n    GROUP BY o.order_date\n)\nSELECT order_date, day_total,\n       SUM(day_total) OVER (ORDER BY order_date) AS running_total\nFROM daily\nLIMIT 10;' },
        '<p>Это финальная тема программы Week 4: CTE + оконные функции вместе. После этого модуля ты готов к SQL Practice Problems и настоящим собеседованиям по SQL. 🎓</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Что такое CTE?', options: ['Постоянная таблица', 'Именованный временный результат внутри запроса (WITH … AS)', 'Индекс', 'Хранимая процедура'], a: 1, explain: '<code>WITH имя AS (…)</code> — временный результат, живущий только в этом запросе.' },
    { q: 'Чем оконная функция отличается от GROUP BY?', options: ['Ничем', 'Окно не схлопывает строки — каждая строка остаётся', 'Окно быстрее', 'Окно работает без таблиц'], a: 1, explain: 'GROUP BY сворачивает группу в одну строку, OVER добавляет вычисление к каждой строке.' },
    { q: 'Цены: 100, 90, 90, 80. Что даст RANK() по убыванию?', options: ['1, 2, 3, 4', '1, 2, 2, 4', '1, 2, 2, 3', '4, 3, 2, 1'], a: 1, explain: 'RANK даёт одинаковым значениям одно место и пропускает следующее: 1, 2, 2, 4.' },
    { q: 'А DENSE_RANK на тех же данных?', options: ['1, 2, 3, 4', '1, 2, 2, 4', '1, 2, 2, 3', '1, 1, 2, 3'], a: 2, explain: 'DENSE_RANK не оставляет дырок: 1, 2, 2, 3.' },
    { q: 'Что вернёт LAG(price) для первой строки окна?', options: ['0', 'Последнее значение', 'NULL', 'Ошибку'], a: 2, explain: 'У первой строки нет предыдущей — LAG вернёт NULL (или значение по умолчанию, если задать).' },
    { q: 'Что делает PARTITION BY внутри OVER?', options: ['Сортирует строки', 'Делит строки на независимые окна', 'Удаляет дубликаты', 'Создаёт таблицу'], a: 1, explain: 'PARTITION BY — «раздели на группы-окна»: расчёт идёт отдельно внутри каждого окна.' },
  ],

  tasks: [
    {
      id: 't1', sql: true, title: 'Дорогие заказы через CTE', brief: 'WITH … AS',
      desc: '<p>Через CTE с именем <code>totals</code> посчитай сумму каждого заказа из <code>order_items</code> (колонки <code>order_id</code>, <code>total</code> = SUM(qty*unit_price)), затем выведи <code>order_id</code> и <code>total</code> заказов с суммой больше 900.</p>',
      starter: 'WITH totals AS (\n    -- SELECT order_id, SUM(...) AS total ...\n)\nSELECT order_id, total\nFROM totals\n-- условие\n',
      solution: 'WITH totals AS (SELECT order_id, SUM(qty * unit_price) AS total FROM order_items GROUP BY order_id) SELECT order_id, total FROM totals WHERE total > 900;',
      hint: 'Внутри CTE: SELECT order_id, SUM(qty * unit_price) AS total FROM order_items GROUP BY order_id. Снаружи: WHERE total > 900.',
    },
    {
      id: 't2', sql: true, title: 'Номер в своей категории', brief: 'ROW_NUMBER + PARTITION BY',
      desc: '<p>Выведи <code>name</code>, <code>category_id</code>, <code>price</code> и номер товара по убыванию цены внутри его категории (псевдоним <code>rn</code>, ROW_NUMBER).</p>',
      starter: '-- ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ... DESC)\n',
      solution: 'SELECT name, category_id, price, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC) AS rn FROM products;',
      hint: 'ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC) AS rn',
    },
    {
      id: 't3', sql: true, title: 'Зарплата и место в рейтинге', brief: 'DENSE_RANK',
      desc: '<p>Выведи <code>name</code>, <code>salary</code> и место сотрудника по зарплате от большей к меньшей без пропусков мест (псевдоним <code>place</code>, DENSE_RANK).</p>',
      starter: '-- DENSE_RANK() OVER (ORDER BY ...)\n',
      solution: 'SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS place FROM employees;',
      hint: 'DENSE_RANK() OVER (ORDER BY salary DESC) AS place',
    },
  ],

  exam: {
    time: 600,
    questions: [
      { q: 'Где живёт CTE?', options: ['В базе навсегда', 'Только внутри одного запроса', 'В отдельном файле', 'В памяти сервера сутки'], a: 1, explain: '' },
      { q: 'SUM(x) OVER (ORDER BY d) — это…', options: ['Обычная сумма', 'Нарастающий итог', 'Средняя', 'Ошибка'], a: 1, explain: '' },
      { q: 'Какая функция даёт значение следующей строки?', options: ['LAG', 'LEAD', 'NEXT', 'ROW_NUMBER'], a: 1, explain: '' },
      { q: 'ROW_NUMBER при одинаковых значениях…', options: ['Даёт одинаковые номера', 'Всё равно нумерует подряд: 1,2,3', 'Пропускает', 'Ошибка'], a: 1, explain: '' },
      { q: 'В T-SQL временная таблица создаётся как…', options: ['WITH t AS', 'CREATE TABLE #t', 'DECLARE @t', 'TEMP TABLE t'], a: 1, explain: '' },
    ],
    task: {
      sql: true, title: 'Рейтинг товаров по цене',
      desc: '<p>Выведи <code>name</code>, <code>price</code> и место товара по цене от дорогих к дешёвым с пропусками мест при равенстве (псевдоним <code>rnk</code>, RANK).</p>',
      starter: '',
      solution: 'SELECT name, price, RANK() OVER (ORDER BY price DESC) AS rnk FROM products;',
    },
  },
};
