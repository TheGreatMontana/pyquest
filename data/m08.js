/* Модуль 8 — Функции */
COURSE_DATA.m08 = {
  theory: [
    {
      title: '🧩 Функция — свой собственный кирпичик',
      blocks: [
        '<p><b>Функция</b> — именованный кусок кода, который можно вызывать сколько угодно раз. Ты уже пользуешься чужими: <code>print()</code>, <code>len()</code>, <code>input()</code>. Пора писать свои!</p>',
        { run: "def greet():\n    print('Привет, боец!')\n    print('Добро пожаловать в игру')\n\ngreet()\ngreet()  # вызвал дважды - выполнилось дважды" },
        '<p><code>def имя():</code> — объявление, тело с отступом. Важно: код функции выполняется только при <b>вызове</b> <code>имя()</code>, а не при объявлении.</p>',
      ],
    },
    {
      title: '📥 Параметры — вход функции',
      blocks: [
        '<p>В скобках объявляют <b>параметры</b> — данные, которые функция принимает:</p>',
        { run: "def greet(name, level):\n    print(f'Привет, {name}! Твой уровень: {level}')\n\ngreet('Азиз', 7)\ngreet('Тимур', 3)" },
        '<p>Параметрам можно давать значения по умолчанию — тогда их можно не передавать:</p>',
        { run: "def attack(damage=10):\n    print(f'Удар на {damage}!')\n\nattack()      # возьмётся 10\nattack(50)    # передали своё" },
      ],
    },
    {
      title: '📤 return — выход функции',
      blocks: [
        '<p><code>return</code> возвращает результат наружу — его можно сохранить в переменную и использовать дальше:</p>',
        { run: "def add(a, b):\n    return a + b\n\nresult = add(3, 4)\nprint(result)\nprint(add(10, 20) * 2)  # результат можно сразу использовать" },
        '<p>⚠️ Разница, которую путают ВСЕ новички: <code>print</code> просто показывает на экране, а <code>return</code> отдаёт значение программе. После <code>return</code> функция сразу завершается:</p>',
        { run: "def check(n):\n    if n > 0:\n        return 'плюс'\n    return 'минус или ноль'\n\nprint(check(5))\nprint(check(-3))" },
      ],
    },
    {
      title: '🏠 Области видимости',
      blocks: [
        '<p>Переменные, созданные <b>внутри</b> функции, — локальные: снаружи их не видно:</p>',
        { run: "def calc():\n    secret = 42   # локальная переменная\n    return secret * 2\n\nprint(calc())\n# print(secret) - тут была бы ошибка: снаружи secret не существует" },
        '<p>Хорошая привычка: функция берёт всё через параметры и отдаёт через <code>return</code>. Так код легко читать и тестировать.</p>',
      ],
    },
    {
      title: '🏗️ Собираем программу из функций',
      blocks: [
        '<p>Большая программа — это набор маленьких функций, каждая делает одно дело:</p>',
        { run: "def get_discount(total):\n    if total >= 5000:\n        return 0.25\n    if total >= 1000:\n        return 0.1\n    return 0\n\ndef final_price(total):\n    return total * (1 - get_discount(total))\n\nprint(final_price(6000))\nprint(final_price(500))" },
        '<p>Функция может вызывать другую функцию — так из кирпичиков собирается дом. Это главный навык программиста!</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Каким словом объявляется функция?', options: ['function', 'def', 'func', 'lambda'], a: 1, explain: 'Функции объявляются через <code>def имя():</code>.' },
    { q: 'Что выведет код?', code: "def f():\n    print('привет')\n\nf()\nf()", options: ['привет (один раз)', 'привет привет', 'Ничего', 'Ошибку'], a: 1, explain: 'Функция вызвана дважды — тело выполнилось два раза.' },
    { q: 'В чём разница print и return?', options: ['Никакой', 'print показывает на экране, return отдаёт значение программе', 'return быстрее', 'print только для строк'], a: 1, explain: '<code>return</code> возвращает значение, чтобы код мог его использовать; <code>print</code> лишь выводит на экран.' },
    { q: 'Что выведет код?', code: "def double(x):\n    return x * 2\n\ny = double(double(3))\nprint(y)", options: ['6', '9', '12', '36'], a: 2, explain: 'double(3) = 6, double(6) = 12. Функции можно вкладывать.' },
    { q: 'Что вернёт функция без return?', options: ['0', 'Пустую строку', 'None', 'Ошибку'], a: 2, explain: 'Если <code>return</code> нет, функция возвращает <code>None</code>.' },
    { q: 'Что выведет код?', code: "def hi(name='гость'):\n    return f'Привет, {name}'\n\nprint(hi())", options: ['Привет, name', 'Привет, гость', 'Ошибку', 'Привет,'], a: 1, explain: 'Аргумент не передан — используется значение по умолчанию «гость».' },
    { q: 'Что выведет код?', code: "def f(n):\n    return n\n    print('после')\n\nprint(f(5))", options: ['5 и после', '5', 'после', 'Ошибку'], a: 1, explain: 'После <code>return</code> функция сразу завершается — <code>print(\'после\')</code> недостижим.' },
  ],

  tasks: [
    {
      id: 't1', title: 'Приветствие уровня', brief: 'def + параметры',
      desc: '<p>Напиши функцию <code>welcome(name, level)</code>, которая <b>возвращает</b> (return!) строку: <code>name [уровень level] вошёл в игру</code>.</p><p>Например, <code>welcome("Азиз", 5)</code> → <code>Азиз [уровень 5] вошёл в игру</code></p>',
      starter: 'def welcome(name, level):\n    # верни f-строку\n    pass\n\nprint(welcome("Азиз", 5))\n',
      tests: "assert welcome('Азиз', 5) == 'Азиз [уровень 5] вошёл в игру', 'welcome(\\'Азиз\\', 5) должно вернуть: Азиз [уровень 5] вошёл в игру. Вернулось: ' + repr(welcome('Азиз', 5))\nassert welcome('Bob', 1) == 'Bob [уровень 1] вошёл в игру', 'Функция должна работать с ЛЮБЫМ именем, не только Азиз'",
      hint: "return f'{name} [уровень {level}] вошёл в игру' — и убери pass.",
    },
    {
      id: 't2', title: 'Максимум из трёх', brief: 'return + сравнения',
      desc: '<p>Напиши функцию <code>max3(a, b, c)</code>, которая возвращает наибольшее из трёх чисел. Встроенной функцией <code>max()</code> пользоваться нельзя — только if!</p>',
      starter: 'def max3(a, b, c):\n    # сравни и верни наибольшее (без max()!)\n    pass\n\nprint(max3(3, 9, 5))\n',
      tests: "assert max3(3, 9, 5) == 9, 'max3(3, 9, 5) должно вернуть 9'\nassert max3(10, 2, 3) == 10, 'max3(10, 2, 3) должно вернуть 10'\nassert max3(1, 2, 30) == 30, 'max3(1, 2, 30) должно вернуть 30'\nassert max3(7, 7, 7) == 7, 'max3(7, 7, 7) должно вернуть 7'",
      hint: 'if a >= b and a >= c: return a — и так для каждого. Или сравнивай по очереди с переменной best.',
    },
    {
      id: 't3', title: 'Калькулятор XP', brief: 'Функции вызывают функции',
      desc: '<p>Напиши две функции:</p><ul><li><code>xp_for_level(level)</code> — возвращает <code>level * 100</code></li><li><code>total_xp(levels)</code> — принимает список уровней и возвращает сумму XP за все, используя первую функцию</li></ul><p><code>total_xp([1, 2, 3])</code> → <code>600</code></p>',
      starter: 'def xp_for_level(level):\n    pass\n\ndef total_xp(levels):\n    # цикл + вызов xp_for_level\n    pass\n\nprint(total_xp([1, 2, 3]))\n',
      tests: "assert xp_for_level(5) == 500, 'xp_for_level(5) должно вернуть 500'\nassert total_xp([1, 2, 3]) == 600, 'total_xp([1, 2, 3]) должно вернуть 600 (100+200+300)'\nassert total_xp([10]) == 1000, 'total_xp([10]) должно вернуть 1000'\nassert total_xp([]) == 0, 'total_xp([]) должно вернуть 0 для пустого списка'",
      hint: 'total = 0, потом for lvl in levels: total += xp_for_level(lvl), в конце return total.',
    },
  ],

  exam: {
    time: 600,
    questions: [
      { q: 'Что выведет код?', code: "def sq(x):\n    return x * x\n\nprint(sq(4))", options: ['8', '16', '44', 'None'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "def f(a, b=10):\n    return a + b\n\nprint(f(5))", options: ['5', '10', '15', 'Ошибку'], a: 2, explain: '' },
      { q: 'Что выведет код?', code: "def test():\n    x = 5\n\ntest()\nprint(x)", options: ['5', 'None', 'Ошибку NameError', '0'], a: 2, explain: '' },
      { q: 'Что выведет код?', code: "def m(n):\n    if n % 2 == 0:\n        return 'чёт'\n    return 'нечет'\n\nprint(m(7))", options: ['чёт', 'нечет', 'None', '7'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "def add(a, b):\n    print(a + b)\n\nx = add(2, 3)\nprint(x)", options: ['5 и 5', '5 и None', 'None и 5', 'Ошибку'], a: 1, explain: '' },
      { q: 'Сколько параметров у функции <code>def f(a, b, c=1):</code> можно НЕ передавать?', options: ['Ни одного', 'Один (c)', 'Два', 'Все'], a: 1, explain: '' },
    ],
    task: {
      title: 'Оценка по баллам',
      desc: '<p>Напиши функцию <code>grade(score)</code>: 90+ → <code>"A"</code>, 70–89 → <code>"B"</code>, 50–69 → <code>"C"</code>, меньше 50 → <code>"F"</code>. Выведи <code>grade(95)</code>, <code>grade(71)</code>, <code>grade(30)</code> — каждый с новой строки.</p>',
      starter: 'def grade(score):\n    pass\n\nprint(grade(95))\nprint(grade(71))\nprint(grade(30))\n',
      tests: "assert grade(95) == 'A', 'grade(95) должно вернуть A'\nassert grade(90) == 'A', 'grade(90) - это уже A (90+)'\nassert grade(71) == 'B', 'grade(71) должно вернуть B'\nassert grade(50) == 'C', 'grade(50) - это C'\nassert grade(30) == 'F', 'grade(30) должно вернуть F'",
    },
  },
};
