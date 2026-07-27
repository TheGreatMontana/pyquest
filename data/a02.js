/* Алгоритмы Модуль 2 — Сортировки (Грокаем алгоритмы, гл. 2) */
COURSE_DATA.a02 = {
  theory: [
    {
      title: 'Задача сортировки',
      blocks: [
        '<p>Сортировка — фундамент: бинарный поиск, отчёты, топ-10, дедупликация — всё начинается с «сначала отсортируй». В Python есть встроенная сортировка, но на собеседованиях просят написать свою — чтобы проверить, понимаешь ли ты, что под капотом.</p>',
        { run: "nums = [29, 5, 71, 34, 10]\nprint(sorted(nums))            # новая копия\nprint(sorted(nums, reverse=True))\nwords = ['питон', 'sql', 'данные']\nprint(sorted(words, key=len))  # сортировка по длине!" },
        '<p><code>key=</code> — суперсила встроенной сортировки: сортируй по любому признаку. Запомни на будущее для Pandas.</p>',
      ],
    },
    {
      title: 'Сортировка выбором — идея',
      blocks: [
        '<p><b>Selection sort</b> из книги: найди минимум → переложи в результат → повтори с остатком.</p>',
        '<ul><li>Шаг 1: в [29, 5, 71, 34] минимум 5 → результат [5]</li><li>Шаг 2: в [29, 71, 34] минимум 29 → [5, 29]</li><li>Шаг 3: в [71, 34] минимум 34 → [5, 29, 34]</li><li>Шаг 4: [5, 29, 34, 71] — готово</li></ul>',
        '<p>Каждый поиск минимума — O(n), повторяем n раз → итого <b>O(n²)</b>. Для миллиона строк — недопустимо, для обучения — идеально.</p>',
      ],
    },
    {
      title: 'Сортировка выбором — код',
      blocks: [
        { run: "def find_smallest_index(items):\n    smallest = 0\n    for i in range(1, len(items)):\n        if items[i] < items[smallest]:\n            smallest = i\n    return smallest\n\ndef selection_sort(items):\n    result = []\n    src = list(items)          # копия, чтобы не портить исходный\n    while src:\n        idx = find_smallest_index(src)\n        result.append(src.pop(idx))\n    return result\n\nprint(selection_sort([29, 5, 71, 34, 10]))" },
        '<p>Разбивка на две функции — хороший стиль: <code>find_smallest_index</code> ищет, <code>selection_sort</code> управляет. Точно как в книге.</p>',
      ],
    },
    {
      title: 'Пузырьковая сортировка',
      blocks: [
        '<p><b>Bubble sort</b> — второй учебный алгоритм: идём по списку и меняем местами соседей, если они стоят неправильно. Большие значения «всплывают» в конец:</p>',
        { run: "def bubble_sort(items):\n    arr = list(items)\n    n = len(arr)\n    for i in range(n):\n        for j in range(n - 1 - i):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]  # обмен!\n    return arr\n\nprint(bubble_sort([64, 25, 12, 90, 11]))" },
        '<p>Обрати внимание на обмен: <code>a, b = b, a</code> — питоновский способ поменять значения местами без временной переменной. Тоже O(n²).</p>',
      ],
    },
    {
      title: 'Что используют в реальности',
      blocks: [
        '<p>Быстрая сортировка (quicksort, гл. 4 книги) и её родня работают за <b>O(n·log n)</b> — это огромная разница:</p>',
        '<ul><li>n = 1 000 000: n² = триллион операций, n·log n ≈ 20 миллионов — в 50 000 раз быстрее</li></ul>',
        '<p>Встроенный <code>sorted()</code> в Python — это Timsort, O(n·log n). Правило инженера: <b>в бою — sorted(), в учёбе и на собеседовании — умей написать selection/bubble сам и объяснить их сложность</b>.</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Сложность сортировки выбором?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], a: 2, explain: 'n раз ищем минимум за O(n) — итого O(n²).' },
    { q: 'Что делает <code>sorted(words, key=len)</code>?', options: ['Сортирует по алфавиту', 'Сортирует по длине строк', 'Считает длины', 'Ошибку'], a: 1, explain: '<code>key</code> задаёт признак сортировки — здесь длину строки.' },
    { q: 'Идея сортировки выбором?', options: ['Менять соседей местами', 'Каждый раз находить минимум и переносить в результат', 'Делить список пополам', 'Случайно перемешивать'], a: 1, explain: 'Выбор = «выбираем минимум из остатка», повторяем n раз.' },
    { q: 'Что делает <code>a, b = b, a</code>?', options: ['Ошибку', 'Меняет значения переменных местами', 'Создаёт кортеж навсегда', 'Удаляет переменные'], a: 1, explain: 'Питоновский обмен значений — основа пузырьковой сортировки.' },
    { q: 'Сложность встроенного sorted()?', options: ['O(n²)', 'O(n·log n)', 'O(n)', 'O(log n)'], a: 1, explain: 'Timsort — O(n·log n), поэтому в реальном коде используем его.' },
    { q: 'Отсортировать от больших к меньшим встроенно?', options: ['sorted(x, reverse=True)', 'sorted(x, desc=True)', 'x.sort_desc()', 'reverse(sorted(x))'], a: 0, explain: '<code>reverse=True</code> — сортировка по убыванию.' },
  ],

  tasks: [
    {
      id: 't1', title: 'Индекс минимума', brief: 'Первый кирпичик',
      desc: '<p>Напиши функцию <code>find_smallest_index(items)</code> — вернуть <b>индекс</b> наименьшего элемента. Без <code>min()</code> и <code>.index()</code> — только цикл!</p>',
      starter: 'def find_smallest_index(items):\n    smallest = 0\n    # сравнивай items[i] с items[smallest]\n    pass\n\nprint(find_smallest_index([29, 5, 71, 34]))\n',
      tests: "assert find_smallest_index([29, 5, 71, 34]) == 1, 'Минимум 5 стоит на индексе 1'\nassert find_smallest_index([1, 2, 3]) == 0, 'Минимум в начале - индекс 0'\nassert find_smallest_index([9, 8, 7, 0]) == 3, 'Минимум в конце - индекс 3'\nassert find_smallest_index([5]) == 0, 'Один элемент - индекс 0'",
      hint: 'for i in range(1, len(items)): if items[i] < items[smallest]: smallest = i. В конце return smallest.',
    },
    {
      id: 't2', title: 'Сортировка выбором', brief: 'Алгоритм из книги',
      desc: '<p>Напиши функцию <code>selection_sort(items)</code>, возвращающую НОВЫЙ отсортированный список (по возрастанию). Используй свою логику поиска минимума. <code>sorted()</code> и <code>.sort()</code> запрещены!</p>',
      starter: 'def selection_sort(items):\n    src = list(items)\n    result = []\n    # пока src не пуст: найди индекс минимума, pop его в result\n    pass\n\nprint(selection_sort([29, 5, 71, 34, 10]))\n',
      tests: "assert selection_sort([29, 5, 71, 34, 10]) == [5, 10, 29, 34, 71], 'Список должен отсортироваться по возрастанию'\nassert selection_sort([]) == [], 'Пустой список - пустой результат'\nassert selection_sort([3, 3, 1]) == [1, 3, 3], 'Дубликаты должны сохраниться'\nimport random\n_r = [random.randint(0, 100) for _ in range(30)]\nassert selection_sort(_r) == sorted(_r), 'Проверка на случайном списке провалилась'",
      hint: 'while src: idx = индекс минимума src; result.append(src.pop(idx)). Верни result.',
    },
    {
      id: 't3', title: 'Топ студентов', brief: 'Сортировка с key',
      desc: '<p>Дан список кортежей (имя, балл). Напиши функцию <code>top_students(students)</code>, возвращающую список <b>имён</b>, отсортированных по баллу от большего к меньшему. Тут можно (и нужно!) использовать <code>sorted()</code> с <code>key</code>.</p>',
      starter: "def top_students(students):\n    # sorted(students, key=..., reverse=True)\n    pass\n\ndata = [('Азиз', 87), ('Тимур', 92), ('Сара', 78)]\nprint(top_students(data))\n",
      tests: "assert top_students([('Азиз', 87), ('Тимур', 92), ('Сара', 78)]) == ['Тимур', 'Азиз', 'Сара'], 'Порядок: Тимур(92), Азиз(87), Сара(78)'\nassert top_students([]) == [], 'Пустой список'\nassert top_students([('X', 1)]) == ['X'], 'Один студент'",
      hint: 'ordered = sorted(students, key=lambda s: s[1], reverse=True), потом собери имена: [s[0] for s in ordered] или циклом.',
    },
  ],

  exam: {
    time: 540,
    questions: [
      { q: 'Сколько операций selection sort на 1000 элементов (порядок)?', options: ['~1000', '~10 000', '~1 000 000', '~10'], a: 2, explain: '' },
      { q: 'Bubble sort меняет местами…', options: ['Первый и последний', 'Соседние элементы, стоящие неправильно', 'Случайные', 'Минимум и максимум'], a: 1, explain: '' },
      { q: 'Что вернёт <code>sorted([3, 1, 2])[0]</code>?', options: ['3', '1', '2', 'Ошибку'], a: 1, explain: '' },
      { q: 'Когда писать сортировку руками, а не sorted()?', options: ['Всегда', 'В учёбе и на собеседовании', 'Для больших данных', 'Никогда'], a: 1, explain: '' },
      { q: 'O(n·log n) против O(n²) на больших n…', options: ['Одинаково', 'n·log n намного быстрее', 'n² быстрее', 'Зависит от языка'], a: 1, explain: '' },
    ],
    task: {
      title: 'Сортировка по убыванию',
      desc: '<p>Напиши функцию <code>sort_desc(items)</code>, возвращающую новый список по убыванию, — своим алгоритмом (selection или bubble), без <code>sorted()</code> и <code>.sort()</code>.</p>',
      starter: 'def sort_desc(items):\n    pass\n\nprint(sort_desc([5, 1, 9, 3]))\n',
      tests: "assert sort_desc([5, 1, 9, 3]) == [9, 5, 3, 1], 'Ожидалось [9, 5, 3, 1]'\nassert sort_desc([]) == [], 'Пустой список'\nassert sort_desc([2, 2, 1]) == [2, 2, 1], 'Дубликаты сохраняются'\n_src = 'sort_desc'\nimport random\n_r = [random.randint(0, 50) for _ in range(20)]\nassert sort_desc(_r) == sorted(_r, reverse=True), 'Случайный список отсортирован неверно'",
    },
  },
};
