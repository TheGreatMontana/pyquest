/* PyQuest — учебная база данных для SQL-тренажёра (магазин электроники «Data Store»)
   Схема близка к Northwind/TSQLV4, на которых построена программа ментора. */
window.SQL_SEED = `
PRAGMA foreign_keys = ON;

CREATE TABLE categories (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL
);

CREATE TABLE products (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  price       REAL NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE customers (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  city    TEXT,
  country TEXT,
  reg_date TEXT
);

CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_date  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE order_items (
  order_id   INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  qty        INTEGER NOT NULL,
  unit_price REAL NOT NULL
);

CREATE TABLE employees (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  title      TEXT,
  manager_id INTEGER,
  salary     INTEGER,
  city       TEXT
);

INSERT INTO categories (id, name) VALUES
 (1, 'Ноутбуки'), (2, 'Смартфоны'), (3, 'Аксессуары'), (4, 'Мониторы');

INSERT INTO products (id, name, category_id, price, stock) VALUES
 (1,  'Lenovo IdeaPad 3',    1, 550, 12),
 (2,  'MacBook Air M3',      1, 1250, 5),
 (3,  'Asus VivoBook',       1, 640, 8),
 (4,  'iPhone 15',           2, 900, 20),
 (5,  'Samsung Galaxy S24',  2, 850, 15),
 (6,  'Redmi Note 13',       2, 260, 40),
 (7,  'Мышь Logitech',       3, 25, 100),
 (8,  'Клавиатура Keychron', 3, 95, 30),
 (9,  'Хаб USB-C',           3, 35, 60),
 (10, 'Монитор LG 27',       4, 210, 10),
 (11, 'Монитор Dell 24',     4, 180, 14),
 (12, 'Веб-камера Logitech', 3, 55, 0);

INSERT INTO customers (id, name, city, country, reg_date) VALUES
 (1,  'Азиз Азимов',      'Ташкент',   'Узбекистан', '2025-11-02'),
 (2,  'Тимур Каримов',    'Самарканд', 'Узбекистан', '2025-12-15'),
 (3,  'Сара Ли',          'Алматы',    'Казахстан',  '2026-01-08'),
 (4,  'Бек Норов',        'Бухара',    'Узбекистан', '2026-01-20'),
 (5,  'Дана Ахметова',    'Астана',    'Казахстан',  '2026-02-03'),
 (6,  'Иван Петров',      'Москва',    'Россия',     '2026-02-14'),
 (7,  'Малика Юсупова',   'Ташкент',   'Узбекистан', '2026-03-01'),
 (8,  'Олжас Серик',      'Алматы',    'Казахстан',  '2026-03-22'),
 (9,  'Нодир Хамидов',    'Андижан',   'Узбекистан', '2026-04-05'),
 (10, 'Елена Смирнова',   'Казань',    'Россия',     '2026-04-19');

INSERT INTO orders (id, customer_id, order_date, status) VALUES
 (1,  1, '2026-05-01', 'done'),
 (2,  2, '2026-05-03', 'done'),
 (3,  1, '2026-05-05', 'done'),
 (4,  3, '2026-05-08', 'cancelled'),
 (5,  4, '2026-05-12', 'done'),
 (6,  5, '2026-05-15', 'done'),
 (7,  1, '2026-05-21', 'done'),
 (8,  6, '2026-05-25', 'shipped'),
 (9,  7, '2026-06-02', 'done'),
 (10, 2, '2026-06-06', 'done'),
 (11, 8, '2026-06-10', 'shipped'),
 (12, 9, '2026-06-15', 'new'),
 (13, 3, '2026-06-21', 'done'),
 (14, 1, '2026-06-28', 'new'),
 (15, 5, '2026-07-02', 'done');

INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES
 (1, 4, 1, 900),  (1, 7, 2, 25),
 (2, 6, 1, 260),
 (3, 1, 1, 550),  (3, 8, 1, 95),   (3, 7, 1, 25),
 (4, 2, 1, 1250),
 (5, 10, 2, 210), (5, 9, 1, 35),
 (6, 5, 1, 850),  (6, 7, 1, 25),
 (7, 11, 1, 180),
 (8, 4, 1, 900),  (8, 9, 2, 35),
 (9, 6, 2, 260),  (9, 7, 3, 25),
 (10, 3, 1, 640), (10, 8, 1, 95),
 (11, 12, 1, 55), (11, 7, 1, 25),
 (12, 5, 1, 850),
 (13, 10, 1, 210),
 (14, 2, 1, 1250), (14, 9, 1, 35),
 (15, 6, 1, 260), (15, 11, 1, 180);

INSERT INTO employees (id, name, title, manager_id, salary, city) VALUES
 (1, 'Аслон Ахмедов',   'Директор',        NULL, 3000, 'Ташкент'),
 (2, 'Лола Рашидова',   'Менеджер продаж', 1,    1800, 'Ташкент'),
 (3, 'Санжар Умаров',   'Менеджер продаж', 1,    1700, 'Самарканд'),
 (4, 'Дильноза Азизова','Продавец',        2,    1100, 'Ташкент'),
 (5, 'Жасур Тошев',     'Продавец',        2,    1000, 'Ташкент'),
 (6, 'Камила Садыкова', 'Продавец',        3,    1050, 'Самарканд'),
 (7, 'Отабек Гулямов',  'Аналитик',        1,    2000, 'Ташкент'),
 (8, 'Нилюфар Косимова','Продавец',        3,    950,  'Бухара');
`;
