/* Алгоритмы Модуль 4 — Хеш-таблицы и графы (Грокаем алгоритмы, гл. 5–6) */
COURSE_DATA.a04 = {
  theory: [
    {
      title: 'Хеш-таблица — самый полезный инструмент',
      blocks: [
        '<p>Ты уже пользуешься хеш-таблицами — это питоновский <code>dict</code>! Хеш-функция превращает ключ в номер ячейки, поэтому поиск по ключу — <b>O(1)</b>, мгновенно при любом размере.</p>',
        { run: "phone_book = {'aziz': '+998901234567', 'aslon': '+998914011281'}\n# поиск за O(1) - неважно, 2 записи или 2 миллиона:\nprint(phone_book['aslon'])\nprint('timur' in phone_book)" },
        '<p>Сравни: поиск в списке — O(n), в отсортированном — O(log n), в словаре — O(1). Вот почему «а можно ли тут применить словарь?» — первый вопрос при оптимизации.</p>',
      ],
    },
    {
      title: 'Три применения из книги',
      blocks: [
        '<p>1) <b>Справочники</b> — телефонная книга, DNS, настройки. 2) <b>Проверка дубликатов</b> — «этот человек уже голосовал?». 3) <b>Кеш</b> — запомнить результат, чтобы не считать заново:</p>',
        { run: "voted = {}\nfor name in ['aziz', 'timur', 'aziz']:\n    if name in voted:\n        print(f'{name}: уже голосовал! Гнать!')\n    else:\n        voted[name] = True\n        print(f'{name}: голос принят')" },
        '<p>Коллизии (два ключа в одной ячейке) бывают, но хорошая хеш-функция делает их редкими — в среднем всё равно O(1). Так и отвечай на собеседовании.</p>',
      ],
    },
    {
      title: 'Граф — вершины и связи',
      blocks: [
        '<p><b>Граф</b> — вершины (узлы), соединённые рёбрами. Это модель для всего связанного: друзья в соцсети, дороги между городами, зависимости задач в Airflow (DAG — это граф!).</p>',
        '<p>В Python граф удобно хранить словарём «вершина → список соседей»:</p>',
        { run: "graph = {\n    'Ташкент':   ['Самарканд', 'Фергана'],\n    'Самарканд': ['Бухара', 'Карши'],\n    'Фергана':   ['Андижан'],\n    'Бухара':    [],\n    'Карши':     [],\n    'Андижан':   [],\n}\nprint(graph['Самарканд'])" },
      ],
    },
    {
      title: 'BFS — поиск в ширину',
      blocks: [
        '<p><b>BFS</b> (breadth-first search) обходит граф «волнами»: сначала соседи, потом соседи соседей. Отвечает на вопросы «есть ли путь?» и «какой путь кратчайший?» (по числу шагов):</p>',
        { run: "from collections import deque\n\ndef bfs_path_exists(graph, start, target):\n    queue = deque([start])\n    visited = set()\n    while queue:\n        node = queue.popleft()      # берём из НАЧАЛА очереди\n        if node == target:\n            return True\n        if node in visited:\n            continue\n        visited.add(node)\n        queue.extend(graph[node])   # соседей - в конец очереди\n    return False\n\ngraph = {'A': ['B', 'C'], 'B': ['D'], 'C': [], 'D': []}\nprint(bfs_path_exists(graph, 'A', 'D'))\nprint(bfs_path_exists(graph, 'C', 'A'))" },
        '<p>Два ключевых элемента: <b>очередь</b> (deque — брать спереди, класть сзади) и <b>visited</b> (не ходить по кругу). Выучи этот шаблон — он решает десятки задач LeetCode.</p>',
      ],
    },
    {
      title: 'Ты готов к LeetCode',
      blocks: [
        '<p>После этого модуля у тебя есть весь стартовый набор: сложность, поиск, сортировки, рекурсия, хеш-таблицы, BFS. План ментора — <b>50+ задач</b>. Начни так:</p>',
        '<ul><li>LeetCode → Problems → сложность Easy → темы Array, Hash Table, Two Pointers</li><li>Начни с легенд: Two Sum, Valid Palindrome, Merge Sorted Array, Contains Duplicate</li><li>15–30 минут думаешь сам → смотри решения других → разбирайся → решай заново сам</li><li>Решённое пуш на GitHub с комментариями — как просил ментор</li></ul>',
        '<p>Боевое крещение — задача Two Sum (задача №1 на LeetCode) — ждёт тебя на экзамене этого модуля. 😉</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Сложность поиска по ключу в словаре?', options: ['O(n)', 'O(log n)', 'O(1) в среднем', 'O(n²)'], a: 2, explain: 'Хеш-функция сразу указывает ячейку — поиск не зависит от размера.' },
    { q: 'Что такое коллизия в хеш-таблице?', options: ['Удаление ключа', 'Два ключа попали в одну ячейку', 'Пустая таблица', 'Ошибка Python'], a: 1, explain: 'Разные ключи, одна ячейка. Хорошая хеш-функция делает это редким — в среднем остаётся O(1).' },
    { q: 'Как хранят граф в Python чаще всего?', options: ['Списком списков только', 'Словарём «вершина → соседи»', 'Строкой', 'Кортежем'], a: 1, explain: '<code>{\'A\': [\'B\', \'C\']}</code> — список смежности, самый ходовой способ.' },
    { q: 'BFS находит…', options: ['Самый дешёвый путь по весу', 'Кратчайший путь по числу шагов', 'Все циклы', 'Максимум графа'], a: 1, explain: 'BFS идёт волнами, поэтому первым находит путь с минимальным числом рёбер.' },
    { q: 'Зачем в BFS нужен visited?', options: ['Для скорости печати', 'Чтобы не зациклиться на уже посещённых вершинах', 'Для сортировки', 'Не нужен'], a: 1, explain: 'Без visited обход по графу с циклами будет бесконечным.' },
    { q: 'Какая структура лежит в основе BFS?', options: ['Стек', 'Очередь', 'Дерево', 'Куча'], a: 1, explain: 'Очередь: берём спереди, кладём назад — так и получаются «волны».' },
  ],

  tasks: [
    {
      id: 't1', title: 'Первый дубликат', brief: 'Сила O(1)',
      desc: '<p>Напиши функцию <code>first_duplicate(items)</code> — вернуть первый элемент, который встречается повторно, или <code>None</code>, если все уникальны. Одним проходом со словарём/множеством!</p>',
      starter: 'def first_duplicate(items):\n    seen = set()\n    # если элемент уже в seen - вот он, дубликат!\n    pass\n\nprint(first_duplicate([3, 7, 1, 7, 5]))\n',
      tests: "assert first_duplicate([3, 7, 1, 7, 5]) == 7, 'Первый повтор - 7'\nassert first_duplicate([1, 2, 3]) is None, 'Нет дубликатов - None'\nassert first_duplicate([5, 5]) == 5, 'Сразу дубль - 5'\nassert first_duplicate([]) is None, 'Пустой список - None'\nassert first_duplicate([1, 2, 2, 1]) == 2, 'Из двух дублей вернуть тот, что повторился ПЕРВЫМ (2)'",
      hint: 'for x in items: if x in seen: return x; seen.add(x). После цикла return None.',
    },
    {
      id: 't2', title: 'Частоты слов', brief: 'Классика подсчёта',
      desc: '<p>Напиши функцию <code>word_freq(text)</code>: принять строку, вернуть словарь «слово → сколько раз встретилось». Слова разделены пробелами, регистр привести к нижнему.</p>',
      starter: "def word_freq(text):\n    counts = {}\n    # text.lower().split() + get()\n    pass\n\nprint(word_freq('SQL питон sql Питон SQL'))\n",
      tests: "assert word_freq('SQL питон sql Питон SQL') == {'sql': 3, 'питон': 2}, 'Ожидалось: sql - 3, питон - 2'\nassert word_freq('') == {}, 'Пустая строка - пустой словарь'\nassert word_freq('a a a') == {'a': 3}, 'Одно слово трижды'",
      hint: "for word in text.lower().split(): counts[word] = counts.get(word, 0) + 1",
    },
    {
      id: 't3', title: 'Есть ли путь?', brief: 'BFS по графу',
      desc: '<p>Напиши функцию <code>path_exists(graph, start, target)</code> — BFS-проверка, можно ли добраться из <code>start</code> в <code>target</code>. Используй <code>deque</code> и множество <code>visited</code>.</p>',
      starter: "from collections import deque\n\ndef path_exists(graph, start, target):\n    queue = deque([start])\n    visited = set()\n    # шаблон BFS из теории\n    pass\n\ng = {'A': ['B'], 'B': ['C'], 'C': [], 'D': ['A']}\nprint(path_exists(g, 'A', 'C'))\n",
      tests: "g = {'A': ['B'], 'B': ['C'], 'C': [], 'D': ['A']}\nassert path_exists(g, 'A', 'C') == True, 'A -> B -> C: путь есть'\nassert path_exists(g, 'C', 'A') == False, 'Из C выходов нет - пути в A нет'\nassert path_exists(g, 'D', 'C') == True, 'D -> A -> B -> C'\nassert path_exists(g, 'A', 'A') == True, 'Путь из вершины в саму себя - True'\ng2 = {'X': ['Y'], 'Y': ['X'], 'Z': []}\nassert path_exists(g2, 'X', 'Z') == False, 'Граф с циклом X<->Y не должен зависнуть!'",
      hint: 'Точно как в теории: while queue: node = queue.popleft(); если node == target — True; пропусти посещённые; добавь соседей. После цикла — False.',
    },
  ],

  exam: {
    time: 600,
    questions: [
      { q: 'Поиск в списке из 10 млн строк против словаря — разница?', options: ['Нет разницы', 'Словарь мгновенный O(1), список — O(n)', 'Список быстрее', 'Словарь O(log n)'], a: 1, explain: '' },
      { q: 'counts.get(x, 0) + 1 — зачем get?', options: ['Для скорости', 'Вернуть 0, если ключа ещё нет', 'Удалить ключ', 'Сортировка'], a: 1, explain: '' },
      { q: 'popleft() у deque берёт элемент…', options: ['С конца', 'Из начала', 'Случайный', 'Средний'], a: 1, explain: '' },
      { q: 'DAG в Airflow — это…', options: ['База данных', 'Направленный граф задач без циклов', 'Язык запросов', 'Формат файла'], a: 1, explain: '' },
      { q: 'Сколько задач LeetCode требует план ментора?', options: ['10', '25', '50+', '500'], a: 2, explain: '' },
    ],
    task: {
      title: 'Two Sum — задача №1 LeetCode',
      desc: '<p>Напиши функцию <code>two_sum(nums, target)</code>: вернуть индексы <b>[i, j]</b> двух чисел, дающих в сумме <code>target</code>. Ровно одно решение существует. Сделай за один проход со словарём «значение → индекс».</p>',
      starter: 'def two_sum(nums, target):\n    seen = {}  # значение -> индекс\n    # для каждого x проверь, видел ли ты target - x\n    pass\n\nprint(two_sum([2, 7, 11, 15], 9))\n',
      tests: "assert two_sum([2, 7, 11, 15], 9) == [0, 1], 'nums[0] + nums[1] = 2 + 7 = 9'\nassert two_sum([3, 2, 4], 6) == [1, 2], '2 + 4 = 6 - индексы [1, 2]'\nassert two_sum([3, 3], 6) == [0, 1], 'Одинаковые числа тоже работают'",
    },
  },
};
