/* Модуль 5 — Условия if */
COURSE_DATA.m05 = {
  theory: [
    {
      title: '🔀 if — программа принимает решения',
      blocks: [
        '<p>Оператор <code>if</code> выполняет код только если условие истинно (<code>True</code>):</p>',
        { run: "hp = 15\nif hp < 20:\n    print('⚠️ Мало здоровья!')\n    print('Срочно ищи аптечку')\nprint('Игра продолжается')" },
        '<p>Как и в циклах: двоеточие + отступ. Всё с отступом выполняется по условию, а строки без отступа — всегда.</p>',
      ],
    },
    {
      title: '⚖️ Операторы сравнения',
      blocks: [
        '<p>Условия строятся на сравнениях. Их шесть:</p>',
        { run: "a = 10\nprint(a == 10)  # равно (ДВА знака =!)\nprint(a != 5)   # не равно\nprint(a > 15)   # больше\nprint(a < 15)   # меньше\nprint(a >= 10)  # больше или равно\nprint(a <= 9)   # меньше или равно" },
        '<p>⚠️ Самая частая ошибка новичка: <code>=</code> — это присваивание, а <code>==</code> — сравнение. В условии всегда <code>==</code>!</p>',
      ],
    },
    {
      title: '🌳 else и elif',
      blocks: [
        '<p><code>else</code> — «иначе»: выполняется, когда условие ложно. <code>elif</code> — «иначе если»: проверка нескольких вариантов по очереди:</p>',
        { run: "score = 85\nif score >= 90:\n    print('Оценка: 5')\nelif score >= 70:\n    print('Оценка: 4')\nelif score >= 50:\n    print('Оценка: 3')\nelse:\n    print('Пересдача 😢')" },
        '<p>Python идёт сверху вниз и выполняет <b>первую</b> подходящую ветку, остальные пропускает. Поэтому порядок условий важен!</p>',
      ],
    },
    {
      title: '🧠 Логические операторы: and, or, not',
      blocks: [
        '<p>Условия можно комбинировать:</p>',
        { run: "age = 20\nhas_ticket = True\n# and - оба условия должны быть True\nprint(age >= 18 and has_ticket)\n# or - хотя бы одно True\nprint(age < 6 or age > 60)\n# not - переворачивает\nprint(not has_ticket)" },
        { run: "level = 12\ngold = 500\nif level >= 10 and gold >= 300:\n    print('Легендарный меч куплен! ⚔️')\nelse:\n    print('Пока рано...')" },
      ],
    },
    {
      title: '🎯 in в условиях и вложенные if',
      blocks: [
        '<p>Оператор <code>in</code> отлично работает в условиях:</p>',
        { run: "admins = ['aziz', 'timur']\nuser = 'aziz'\nif user in admins:\n    print('Доступ разрешён ✅')\nelse:\n    print('Доступ запрещён ⛔')" },
        '<p>if можно вкладывать внутрь if (ещё один уровень отступа):</p>',
        { run: "hp = 80\nshield = True\nif hp > 50:\n    if shield:\n        print('Ты в отличной форме!')\n    else:\n        print('Найди щит')\nelse:\n    print('Отступай!')" },
      ],
    },
  ],

  quiz: [
    { q: 'Какой оператор проверяет равенство?', options: ['=', '==', '===', 'equals'], a: 1, explain: '<code>==</code> сравнивает. Одинарный <code>=</code> — присваивание переменной.' },
    { q: 'Что выведет код?', code: "x = 7\nif x > 10:\n    print('A')\nelse:\n    print('B')", options: ['A', 'B', 'A и B', 'Ничего'], a: 1, explain: '7 не больше 10 — условие ложно, выполняется ветка <code>else</code>.' },
    { q: 'Когда сработает <code>a and b</code>?', options: ['Когда хотя бы одно True', 'Когда оба True', 'Когда оба False', 'Всегда'], a: 1, explain: '<code>and</code> требует, чтобы ОБА условия были истинны.' },
    { q: 'Что выведет код?', code: "n = 15\nif n >= 20:\n    print('много')\nelif n >= 10:\n    print('средне')\nelif n >= 14:\n    print('почти много')\nelse:\n    print('мало')", options: ['много', 'средне', 'почти много', 'мало'], a: 1, explain: 'Выполняется ПЕРВАЯ истинная ветка: n >= 10 — True, дальше Python не проверяет.' },
    { q: 'Что вернёт <code>not (5 > 3)</code>?', options: ['True', 'False', '5', 'Ошибку'], a: 1, explain: '5 > 3 — это True, а <code>not</code> переворачивает: False.' },
    { q: 'Что выведет код?', code: "word = 'питон'\nif 'ит' in word:\n    print('да')\nelse:\n    print('нет')", options: ['да', 'нет', 'ит', 'Ошибку'], a: 0, explain: '<code>in</code> для строк проверяет подстроку: «ит» есть внутри «питон».' },
    { q: 'Сколько веток elif можно написать?', options: ['Только одну', 'Максимум три', 'Сколько угодно', 'Нельзя вообще'], a: 2, explain: 'Веток <code>elif</code> может быть сколько угодно между <code>if</code> и <code>else</code>.' },
  ],

  tasks: [
    {
      id: 't1', title: 'Чёт или нечет', brief: 'if + остаток %',
      desc: '<p>Программа читает число через <code>input()</code> и выводит <code>чётное</code> или <code>нечётное</code>.</p><p>Проверка запустит твой код с вводом <code>8</code>.</p>',
      starter: "n = int(input('Число: '))\n# если n % 2 == 0 - чётное\n",
      stdin: ['8'],
      tests: "assert 'чётное' in _stdout and 'нечётное' not in _stdout, 'При вводе 8 должно вывестись: чётное'",
      hint: 'if n % 2 == 0: print("чётное") else: print("нечётное")',
    },
    {
      id: 't2', title: 'Система рангов', brief: 'if / elif / else',
      desc: '<p>По количеству XP выведи ранг:</p><ul><li>1000 и больше — <code>Мастер</code></li><li>500–999 — <code>Боец</code></li><li>меньше 500 — <code>Новичок</code></li></ul><p>Проверка запустит код с вводом <code>750</code>.</p>',
      starter: "xp = int(input('XP: '))\n# твой код\n",
      stdin: ['750'],
      tests: "assert 'Боец' in _stdout, 'При 750 XP должен вывестись ранг: Боец'\nassert 'Мастер' not in _stdout and 'Новичок' not in _stdout, 'Должен вывестись ТОЛЬКО один ранг: Боец'",
      hint: 'if xp >= 1000: ... elif xp >= 500: ... else: ... — порядок сверху вниз, от большего к меньшему.',
    },
    {
      id: 't3', title: 'Вход в клуб', brief: 'and / or',
      desc: '<p>В клуб пускают, если возраст 18+ <b>и</b> есть билет. Программа читает возраст и билет (<code>да</code>/<code>нет</code>), выводит <code>Добро пожаловать</code> или <code>Вход запрещён</code>.</p><p>Проверка: возраст <code>19</code>, билет <code>да</code>.</p>',
      starter: "age = int(input('Возраст: '))\nticket = input('Билет (да/нет): ')\n# условие с and\n",
      stdin: ['19', 'да'],
      tests: "assert 'Добро пожаловать' in _stdout, 'При 19 лет и билете \"да\" должно быть: Добро пожаловать'\nassert 'запрещён' not in _stdout, 'Вывелся отказ, а должен быть допуск. Проверь условие: age >= 18 and ticket == \"да\"'",
      hint: "if age >= 18 and ticket == 'да': print('Добро пожаловать') else: print('Вход запрещён')",
    },
  ],

  exam: {
    time: 540,
    questions: [
      { q: 'Что выведет код?', code: "x = 5\nif x != 5:\n    print('A')\nelse:\n    print('B')", options: ['A', 'B', 'Ничего', 'Ошибку'], a: 1, explain: '' },
      { q: 'Что вернёт <code>True or False</code>?', options: ['True', 'False', 'Ошибку', 'None'], a: 0, explain: '' },
      { q: 'Что выведет код?', code: "a = 3\nb = 8\nif a > 2 and b < 5:\n    print('да')\nelse:\n    print('нет')", options: ['да', 'нет', 'Ошибку', 'Ничего'], a: 1, explain: '' },
      { q: 'В чём ошибка?', code: "if x = 10:\n    print('десять')", broken: true, options: ['Нет else', 'Нужно == вместо =', 'Нет скобок', 'Ошибки нет'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "t = 0\nif t:\n    print('раз')\nelse:\n    print('два')", options: ['раз', 'два', 'Ошибку', '0'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "grade = 90\nif grade >= 50:\n    print('сдал')\nif grade >= 90:\n    print('отлично')", options: ['сдал', 'отлично', 'сдал и отлично', 'Ничего'], a: 2, explain: '' },
    ],
    task: {
      title: 'Калькулятор скидки',
      desc: '<p>Магазин даёт скидки: от 1000 сум — 10%, от 5000 сум — 25%. Программа читает сумму покупки и выводит итог: <code>К оплате: X</code> (число может быть дробным).</p><p>Проверка: ввод <code>6000</code> → вывод <code>К оплате: 4500.0</code></p>',
      starter: "total = int(input('Сумма: '))\n# от 5000 скидка 25%, от 1000 - 10%, иначе без скидки\n",
      stdin: ['6000'],
      tests: "assert 'К оплате: 4500' in _stdout, 'При 6000 со скидкой 25% должно быть: К оплате: 4500.0. Считай total * 0.75'",
    },
  },
};
