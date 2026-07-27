/* Модуль 6 — Словари */
COURSE_DATA.m06 = {
  theory: [
    {
      title: '📖 Словарь — данные с именами',
      blocks: [
        '<p><b>Словарь (dict)</b> хранит пары <code>ключ: значение</code> в фигурных скобках. Это как настоящий словарь: по слову (ключу) находишь перевод (значение):</p>',
        { run: "player = {\n    'name': 'Азиз',\n    'level': 7,\n    'gold': 250\n}\nprint(player)\nprint(player['name'])   # доступ по ключу\nprint(player['gold'])" },
        '<p>В списке элементы достают по номеру, а в словаре — по ключу. Это удобнее, когда у данных есть смысловые имена.</p>',
      ],
    },
    {
      title: '✏️ Изменение словаря',
      blocks: [
        '<p>Добавить или изменить значение — просто присвой по ключу:</p>',
        { run: "player = {'name': 'Азиз', 'gold': 250}\nplayer['gold'] = 300        # изменили\nplayer['weapon'] = 'меч'    # добавили новый ключ\nprint(player)\ndel player['weapon']        # удалили\nprint(player)" },
        '<p>Проверка наличия ключа — оператором <code>in</code>:</p>',
        { run: "player = {'name': 'Азиз'}\nprint('name' in player)\nprint('level' in player)" },
      ],
    },
    {
      title: '🛡️ get() — безопасный доступ',
      blocks: [
        '<p>Если ключа нет, <code>player[\'xp\']</code> уронит программу с ошибкой <code>KeyError</code>. Метод <code>get()</code> вместо ошибки вернёт <code>None</code> или значение по умолчанию:</p>',
        { run: "player = {'name': 'Азиз'}\nprint(player.get('name'))\nprint(player.get('xp'))        # None, а не ошибка\nprint(player.get('xp', 0))     # 0 по умолчанию" },
        '<p>Классика подсчёта чего-либо: <code>counts[x] = counts.get(x, 0) + 1</code></p>',
      ],
    },
    {
      title: '🔁 Перебор словаря циклом',
      blocks: [
        '<p>По словарю можно ходить циклом. Три способа:</p>',
        { run: "prices = {'кофе': 15, 'чай': 10, 'сок': 12}\n# по ключам\nfor item in prices:\n    print(item)\n# по значениям\nprint(sum(prices.values()))\n# по парам сразу\nfor item, price in prices.items():\n    print(f'{item}: {price} тыс сум')" },
        '<p><code>.keys()</code> — все ключи, <code>.values()</code> — все значения, <code>.items()</code> — пары. Чаще всего нужен <code>.items()</code>.</p>',
      ],
    },
    {
      title: '🏗️ Вложенные структуры',
      blocks: [
        '<p>Значением словаря может быть что угодно — даже список или другой словарь. Так строятся сложные данные:</p>',
        { run: "team = {\n    'aziz': {'level': 7, 'items': ['меч', 'щит']},\n    'timur': {'level': 4, 'items': ['лук']}\n}\nprint(team['aziz']['level'])\nprint(team['timur']['items'][0])" },
        '<p>Читай цепочку слева направо: взять <code>team[\'aziz\']</code> (словарь) → из него <code>[\'items\']</code> (список) → из него <code>[0]</code> (элемент). Именно так выглядят данные в реальных API и базах!</p>',
      ],
    },
  ],

  quiz: [
    { q: 'В каких скобках создаётся словарь?', options: ['[ ]', '( )', '{ }', '< >'], a: 2, explain: 'Словари — в фигурных скобках: <code>{\'ключ\': значение}</code>.' },
    { q: 'Что выведет код?', code: "d = {'a': 1, 'b': 2}\nprint(d['b'])", options: ['1', '2', 'b', 'Ошибку'], a: 1, explain: 'По ключу «b» лежит значение 2.' },
    { q: 'Что будет, если обратиться к несуществующему ключу через [ ]?', options: ['Вернётся None', 'Вернётся 0', 'Ошибка KeyError', 'Ключ создастся'], a: 2, explain: 'Квадратные скобки с несуществующим ключом — <code>KeyError</code>. Безопасно — через <code>get()</code>.' },
    { q: 'Что вернёт <code>d.get(\'x\', 99)</code>, если ключа x нет?', options: ['None', '99', 'Ошибку', "'x'"], a: 1, explain: 'Второй аргумент <code>get()</code> — значение по умолчанию, если ключа нет.' },
    { q: 'Как добавить в словарь d ключ «xp» со значением 100?', options: ["d.append('xp', 100)", "d['xp'] = 100", "d.add('xp': 100)", "d + {'xp': 100}"], a: 1, explain: 'Просто присваивание по новому ключу: <code>d[\'xp\'] = 100</code>.' },
    { q: 'Что даёт метод <code>.items()</code>?', options: ['Только ключи', 'Только значения', 'Пары (ключ, значение)', 'Количество элементов'], a: 2, explain: '<code>.items()</code> возвращает пары — удобно для цикла: <code>for k, v in d.items():</code>' },
    { q: 'Что выведет код?', code: "data = {'a': [10, 20]}\nprint(data['a'][1])", options: ['10', '20', '[10, 20]', 'Ошибку'], a: 1, explain: 'Сначала по ключу «a» достаём список [10, 20], потом из него элемент [1] — это 20.' },
  ],

  tasks: [
    {
      id: 't1', title: 'Профиль героя', brief: 'Создание и изменение',
      desc: '<p>Создай словарь <code>hero</code> с ключами: <code>name</code> = <code>"Рыцарь"</code>, <code>hp</code> = <code>100</code>. Потом: добавь ключ <code>gold</code> со значением <code>50</code> и уменьши <code>hp</code> на 30. Выведи словарь.</p>',
      starter: '# создай словарь hero\n# добавь gold, уменьши hp\n',
      tests: "assert 'hero' in dir(), 'Создай словарь hero'\nassert hero.get('name') == 'Рыцарь', 'hero[\\'name\\'] должно быть: Рыцарь'\nassert hero.get('hp') == 70, 'hp должно стать 70 (100 - 30)'\nassert hero.get('gold') == 50, 'Добавь ключ gold = 50'\nassert 'Рыцарь' in _stdout, 'Выведи словарь через print(hero)'",
      hint: "hero = {'name': 'Рыцарь', 'hp': 100}, потом hero['gold'] = 50 и hero['hp'] -= 30",
    },
    {
      id: 't2', title: 'Магазин зелий', brief: 'Перебор .items()',
      desc: '<p>Дан словарь цен. Выведи каждую позицию строкой <code>товар - цена монет</code> и в конце <code>Всего: сумма</code>:</p><pre class="code">зелье - 30 монет\nэликсир - 80 монет\nяд - 45 монет\nВсего: 155</pre>',
      starter: "shop = {'зелье': 30, 'эликсир': 80, 'яд': 45}\n# цикл по shop.items()\n",
      tests: "assert 'зелье - 30 монет' in _stdout, 'Нужна строка: зелье - 30 монет'\nassert 'эликсир - 80 монет' in _stdout, 'Нужна строка: эликсир - 80 монет'\nassert 'яд - 45 монет' in _stdout, 'Нужна строка: яд - 45 монет'\nassert 'Всего: 155' in _stdout, 'В конце: Всего: 155 (это sum(shop.values()))'",
      hint: "for name, price in shop.items(): print(f'{name} - {price} монет'), потом print(f'Всего: {sum(shop.values())}')",
    },
    {
      id: 't3', title: 'Счётчик голосов', brief: 'get() с умолчанием',
      desc: '<p>Дан список голосов за игроков. Посчитай голоса в словарь <code>votes</code> и выведи его. Ожидаемый результат: <code>{\'aziz\': 3, \'timur\': 2, \'bek\': 1}</code></p>',
      starter: "voting = ['aziz', 'timur', 'aziz', 'bek', 'timur', 'aziz']\nvotes = {}\n# для каждого имени: votes[name] = votes.get(name, 0) + 1\n",
      tests: "assert votes == {'aziz': 3, 'timur': 2, 'bek': 1}, 'Ожидалось: aziz=3, timur=2, bek=1. Сейчас: ' + str(votes)\nassert 'aziz' in _stdout, 'Выведи словарь: print(votes)'",
      hint: 'for name in voting: votes[name] = votes.get(name, 0) + 1 — get вернёт 0 для нового имени.',
    },
  ],

  exam: {
    time: 540,
    questions: [
      { q: 'Что выведет код?', code: "d = {'x': 5}\nd['x'] = d['x'] + 10\nprint(d['x'])", options: ['5', '10', '15', 'Ошибку'], a: 2, explain: '' },
      { q: 'Что выведет код?', code: "d = {'a': 1}\nprint('b' in d)", options: ['True', 'False', '1', 'Ошибку'], a: 1, explain: '' },
      { q: 'Как удалить ключ «a» из словаря d?', options: ["d.remove('a')", "del d['a']", "d.delete('a')", "d - 'a'"], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "d = {'a': 1, 'b': 2, 'c': 3}\nprint(len(d))", options: ['6', '3', '2', 'Ошибку'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "d = {'top': {'mid': 7}}\nprint(d['top']['mid'])", options: ['top', 'mid', '7', 'Ошибку'], a: 2, explain: '' },
      { q: 'Что вернёт <code>sum(d.values())</code> для <code>d = {\'a\': 10, \'b\': 5}</code>?', options: ['2', '15', "'ab'", 'Ошибку'], a: 1, explain: '' },
    ],
    task: {
      title: 'База игроков',
      desc: '<p>Дан словарь уровней игроков. Найди игрока с максимальным уровнем и выведи: <code>Чемпион: имя (уровень N)</code></p><p>Ожидаемый вывод: <code>Чемпион: sara (уровень 12)</code></p>',
      starter: "players = {'aziz': 8, 'sara': 12, 'bek': 5}\n# подсказка: цикл по items() и сравнение с максимумом\nbest_name = ''\nbest_level = 0\n",
      tests: "assert 'Чемпион: sara (уровень 12)' in _stdout, 'Ожидалось: Чемпион: sara (уровень 12)'",
    },
  },
};
