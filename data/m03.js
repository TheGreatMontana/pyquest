/* Модуль 3 — Списки */
COURSE_DATA.m03 = {
  theory: [
    {
      title: '📋 Список — коллекция значений',
      blocks: [
        '<p><b>Список (list)</b> — упорядоченный набор значений в квадратных скобках. Хранить можно что угодно:</p>',
        { run: "games = ['CS', 'Dota', 'GTA']\nnumbers = [4, 8, 15, 16, 23, 42]\nmixed = ['текст', 99, True]\nprint(games)\nprint(len(numbers))  # len() - сколько элементов" },
        '<p>Пустой список: <code>items = []</code> — в него потом можно добавлять элементы.</p>',
      ],
    },
    {
      title: '🎯 Индексы: доступ к элементам',
      blocks: [
        '<p>У каждого элемента есть номер — <b>индекс</b>. ⚠️ Отсчёт идёт <b>с нуля</b>!</p>',
        { run: "heroes = ['Марио', 'Соник', 'Линк', 'Кратос']\nprint(heroes[0])   # первый элемент\nprint(heroes[2])   # третий!\nprint(heroes[-1])  # минус - счёт с конца\nprint(heroes[-2])" },
        '<p>Отрицательные индексы идут с конца: <code>[-1]</code> — последний, <code>[-2]</code> — предпоследний. Элемент можно заменить:</p>',
        { run: "heroes = ['Марио', 'Соник', 'Линк']\nheroes[1] = 'Пикачу'\nprint(heroes)" },
      ],
    },
    {
      title: '🔪 Срезы (slices)',
      blocks: [
        '<p><b>Срез</b> вырезает кусок списка: <code>список[от:до]</code>. Правая граница <b>не включается</b>:</p>',
        { run: "nums = [10, 20, 30, 40, 50, 60]\nprint(nums[1:4])   # индексы 1,2,3\nprint(nums[:3])    # первые три\nprint(nums[3:])    # с третьего до конца\nprint(nums[-2:])   # последние два\nprint(nums[::-1])  # весь список задом наперёд!" },
        '<p>Срезы работают и со строками: <code>"Python"[0:2]</code> даст <code>"Py"</code>.</p>',
      ],
    },
    {
      title: '🛠️ Методы списков',
      blocks: [
        '<p>Главные операции — добавить, вставить, удалить:</p>',
        { run: "inv = ['меч', 'щит']\ninv.append('зелье')      # добавить в конец\ninv.insert(0, 'лук')     # вставить по индексу\nprint(inv)\ninv.remove('щит')        # удалить по значению\nlast = inv.pop()         # достать последний\nprint(inv)\nprint('достали:', last)" },
        '<p>Сортировка и разворот:</p>',
        { run: "scores = [50, 10, 99, 5]\nscores.sort()            # по возрастанию\nprint(scores)\nscores.sort(reverse=True)  # по убыванию\nprint(scores)" },
      ],
    },
    {
      title: '🧮 Полезные функции + оператор in',
      blocks: [
        '<p>Python умеет считать сам:</p>',
        { run: 'xp = [120, 250, 80, 400]\nprint(sum(xp))   # сумма\nprint(max(xp))   # максимум\nprint(min(xp))   # минимум\nprint(sum(xp) / len(xp))  # среднее' },
        '<p>Оператор <code>in</code> проверяет, есть ли элемент в списке:</p>',
        { run: "bag = ['ключ', 'карта', 'монета']\nprint('ключ' in bag)\nprint('меч' in bag)\nprint('меч' not in bag)" },
      ],
    },
  ],

  quiz: [
    { q: 'Какой индекс у ПЕРВОГО элемента списка?', options: ['1', '0', '-1', 'first'], a: 1, explain: 'Индексация в Python начинается с нуля: первый элемент — <code>[0]</code>.' },
    { q: 'Что выведет код?', code: "a = ['x', 'y', 'z']\nprint(a[-1])", options: ['x', 'y', 'z', 'Ошибку'], a: 2, explain: '<code>[-1]</code> — последний элемент, то есть «z».' },
    { q: 'Что выведет код?', code: 'nums = [1, 2, 3, 4, 5]\nprint(nums[1:3])', options: ['[1, 2, 3]', '[2, 3]', '[2, 3, 4]', '[1, 2]'], a: 1, explain: 'Срез <code>[1:3]</code> берёт индексы 1 и 2 (правая граница не включается): [2, 3].' },
    { q: 'Как добавить элемент в КОНЕЦ списка?', options: ['list.add(x)', 'list.append(x)', 'list.insert(x)', 'list.push(x)'], a: 1, explain: 'В конец добавляет <code>append()</code>. <code>insert(i, x)</code> — по индексу, а add/push в Python нет.' },
    { q: 'Что вернёт <code>len([10, 20, 30])</code>?', options: ['60', '3', '30', '2'], a: 1, explain: '<code>len()</code> — количество элементов, их три.' },
    { q: 'Что выведет код?', code: "items = ['a', 'b', 'c']\nitems.remove('b')\nprint(items)", options: ["['a', 'c']", "['a', 'b']", "['b']", 'Ошибку'], a: 0, explain: '<code>remove(«b»)</code> удаляет элемент по значению, остаются «a» и «c».' },
    { q: 'Как проверить, есть ли 5 в списке nums?', options: ['nums.has(5)', '5 in nums', 'nums.find(5)', 'exists(5, nums)'], a: 1, explain: 'Оператор <code>in</code>: выражение <code>5 in nums</code> вернёт True или False.' },
  ],

  tasks: [
    {
      id: 't1', title: 'Топ-3 игры', brief: 'Создание списка и индексы',
      desc: '<p>Создай список <code>games</code> из трёх любимых игр (любые строки). Выведи сначала первую игру, потом последнюю (через индексы!).</p>',
      starter: "games = []  # заполни список тремя играми\n# выведи первую и последнюю\n",
      tests: "assert 'games' in dir(), 'Нужен список games'\nassert isinstance(games, list) and len(games) == 3, 'В списке games должно быть ровно 3 элемента'\nlines = _stdout.strip().splitlines()\nassert len(lines) >= 2, 'Выведи две строки: первую и последнюю игру'\nassert lines[0].strip() == str(games[0]), 'Первой должна выводиться games[0]'\nassert lines[-1].strip() == str(games[-1]), 'Последней должна выводиться games[-1]'",
      hint: "games = ['CS', 'Dota', 'GTA'], потом print(games[0]) и print(games[-1]).",
    },
    {
      id: 't2', title: 'Инвентарь героя', brief: 'append, remove, insert',
      desc: '<p>Дан инвентарь. Сделай три действия по порядку:</p><ol><li>добавь в конец <code>"зелье"</code></li><li>удали <code>"камень"</code></li><li>вставь <code>"меч"</code> в начало (индекс 0)</li></ol><p>И выведи итоговый список.</p>',
      starter: "inventory = ['щит', 'камень', 'верёвка']\n# твой код\n",
      tests: "assert inventory == ['меч', 'щит', 'верёвка', 'зелье'], 'Ожидался список: [меч, щит, верёвка, зелье]. Сейчас: ' + str(inventory)\nassert 'меч' in _stdout, 'Не забудь вывести список через print'",
      hint: "inventory.append('зелье'), inventory.remove('камень'), inventory.insert(0, 'меч'), print(inventory)",
    },
    {
      id: 't3', title: 'Статистика урона', brief: 'sum, max, len',
      desc: '<p>Дан список урона за 5 ударов. Выведи три строки:</p><pre class="code">Всего: 174\nМакс: 70\nСредний: 34.8</pre>',
      starter: 'damage = [12, 45, 70, 25, 22]\n# посчитай сумму, максимум и среднее\n',
      tests: "assert 'Всего: 174' in _stdout, 'Нужна строка: Всего: 174 (это sum)'\nassert 'Макс: 70' in _stdout, 'Нужна строка: Макс: 70 (это max)'\nassert 'Средний: 34.8' in _stdout, 'Нужна строка: Средний: 34.8 (сумма делить на len)'",
      hint: "print(f'Всего: {sum(damage)}'), print(f'Макс: {max(damage)}'), print(f'Средний: {sum(damage) / len(damage)}')",
    },
  ],

  exam: {
    time: 480,
    questions: [
      { q: 'Что выведет код?', code: "a = [5, 10, 15, 20]\nprint(a[2])", options: ['10', '15', '20', 'Ошибку'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "b = ['a', 'b', 'c', 'd', 'e']\nprint(b[:2])", options: ["['a', 'b']", "['a', 'b', 'c']", "['c', 'd', 'e']", "['b', 'c']"], a: 0, explain: '' },
      { q: 'Что делает <code>lst.pop()</code>?', options: ['Очищает список', 'Удаляет и возвращает последний элемент', 'Удаляет первый элемент', 'Сортирует список'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: 'n = [3, 1, 2]\nn.sort()\nprint(n)', options: ['[3, 1, 2]', '[1, 2, 3]', '[3, 2, 1]', 'Ошибку'], a: 1, explain: '' },
      { q: 'Что вернёт <code>[1, 2] + [3]</code>?', options: ['[1, 2, 3]', '[6]', '[4, 5]', 'Ошибку'], a: 0, explain: '' },
      { q: 'Что выведет код?', code: "s = [10, 20, 30]\nprint(20 in s, 40 in s)", options: ['True True', 'True False', 'False True', 'False False'], a: 1, explain: '' },
    ],
    task: {
      title: 'Очередь на сервере',
      desc: '<p>Дан список игроков в очереди. Первый игрок зашёл на сервер (удали его через <code>pop(0)</code>), а игрок <code>"Zeus"</code> встал в конец очереди. Выведи итоговый список.</p>',
      starter: "queue = ['Alpha', 'Bravo', 'Cobra']\n# твой код\n",
      tests: "assert queue == ['Bravo', 'Cobra', 'Zeus'], 'Ожидалось: [Bravo, Cobra, Zeus]. Сейчас: ' + str(queue)\nassert 'Zeus' in _stdout, 'Выведи список через print'",
    },
  },
};
