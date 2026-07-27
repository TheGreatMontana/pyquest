/* Модуль 10 — Работа с файлами */
COURSE_DATA.m10 = {
  theory: [
    {
      title: '💾 Зачем программе файлы',
      blocks: [
        '<p>Все переменные исчезают, когда программа завершилась. Чтобы данные жили дальше — их сохраняют в <b>файлы</b>: настройки, сохранения игр, логи, отчёты.</p>',
        '<p>Открывает файл функция <code>open(имя, режим)</code>. Главные режимы:</p>',
        '<ul><li><code>"r"</code> — чтение (read)</li><li><code>"w"</code> — запись с нуля (write, старое стирается!)</li><li><code>"a"</code> — дозапись в конец (append)</li></ul>',
        '<p>👉 Здесь, в браузере, файлы создаются в виртуальном диске — всё работает по-настоящему, пробуй смело!</p>',
      ],
    },
    {
      title: '✍️ Запись: with open',
      blocks: [
        '<p>Файл нужно закрывать после работы. Конструкция <code>with</code> делает это автоматически — всегда пиши только так:</p>',
        { run: "with open('hello.txt', 'w') as f:\n    f.write('Первая строка\\n')\n    f.write('Вторая строка\\n')\nprint('Файл записан!')" },
        '<p><code>as f</code> — переменная файла. <code>\\n</code> — символ переноса строки: <code>write</code> сам переносы не добавляет, в отличие от print.</p>',
      ],
    },
    {
      title: '📖 Чтение файла',
      blocks: [
        '<p>Три способа прочитать:</p>',
        { run: "with open('data.txt', 'w') as f:\n    f.write('яблоко\\nбанан\\nвишня\\n')\n\n# 1) весь файл одной строкой\nwith open('data.txt', 'r') as f:\n    text = f.read()\nprint(text)\n\n# 2) списком строк\nwith open('data.txt', 'r') as f:\n    lines = f.readlines()\nprint(lines)" },
        '<p>Способ 3 — самый ходовой — циклом:</p>',
        { run: "with open('data.txt', 'w') as f:\n    f.write('яблоко\\nбанан\\nвишня\\n')\n\nwith open('data.txt', 'r') as f:\n    for line in f:\n        print('Фрукт:', line.strip())" },
        '<p><code>.strip()</code> обрезает невидимый <code>\\n</code> в конце каждой строки — иначе будут лишние пустые строки.</p>',
      ],
    },
    {
      title: '➕ Дозапись и обработка ошибок',
      blocks: [
        '<p>Режим <code>"a"</code> добавляет в конец, не стирая старое, — так ведут логи:</p>',
        { run: "with open('log.txt', 'w') as f:\n    f.write('игра началась\\n')\nwith open('log.txt', 'a') as f:\n    f.write('уровень пройден\\n')\nwith open('log.txt') as f:\n    print(f.read())" },
        '<p>Чтение несуществующего файла роняет программу. Спасает <code>try/except</code>:</p>',
        { run: "try:\n    with open('net_takogo.txt') as f:\n        print(f.read())\nexcept FileNotFoundError:\n    print('Файла нет - но программа жива!')" },
      ],
    },
    {
      title: '🧮 Обработка данных из файла',
      blocks: [
        '<p>Классическая задача: прочитать данные, разобрать, посчитать:</p>',
        { run: "with open('scores.txt', 'w') as f:\n    f.write('aziz 300\\ntimur 150\\nsara 420\\n')\n\ntotal = 0\nwith open('scores.txt') as f:\n    for line in f:\n        name, score = line.split()   # разбить по пробелу\n        total += int(score)          # строку - в число!\n        print(f'{name}: {score}')\nprint(f'Сумма: {total}')" },
        '<p><code>split()</code> режет строку на список по пробелам. Не забывай <code>int()</code> — из файла всё приходит строками. Это последний модуль теории — дальше финальный босс! 🏆</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Какой режим открывает файл на чтение?', options: ['"w"', '"r"', '"a"', '"x"'], a: 1, explain: '<code>"r"</code> — read, чтение. Он же используется по умолчанию.' },
    { q: 'Чем опасен режим "w"?', options: ['Ничем', 'Он стирает старое содержимое файла', 'Он не создаёт файл', 'Файл нельзя будет открыть'], a: 1, explain: '<code>"w"</code> пишет с нуля: старое содержимое пропадает. Для добавления есть <code>"a"</code>.' },
    { q: 'Зачем нужен with при работе с файлами?', options: ['Для красоты', 'Автоматически закрывает файл', 'Ускоряет чтение', 'Шифрует данные'], a: 1, explain: '<code>with</code> гарантированно закроет файл, даже если случится ошибка.' },
    { q: 'Что вернёт f.read()?', options: ['Список строк', 'Весь файл одной строкой', 'Первую строку', 'Количество строк'], a: 1, explain: '<code>read()</code> — весь файл одной строкой, <code>readlines()</code> — список строк.' },
    { q: 'Зачем .strip() при чтении строк файла?', options: ['Удалить цифры', 'Обрезать \\n и пробелы по краям', 'Разбить на слова', 'Перевести в нижний регистр'], a: 1, explain: 'Каждая строка файла кончается невидимым <code>\\n</code> — <code>strip()</code> его убирает.' },
    { q: 'Какая ошибка возникнет при чтении несуществующего файла?', options: ['KeyError', 'ValueError', 'FileNotFoundError', 'TypeError'], a: 2, explain: 'Нет файла — <code>FileNotFoundError</code>. Ловится через <code>try/except</code>.' },
    { q: 'Что сделает <code>"aziz 300".split()</code>?', options: ["['aziz 300']", "['aziz', '300']", "['a','z','i','z']", 'Ошибку'], a: 1, explain: '<code>split()</code> без аргументов режет строку по пробелам: <code>[\'aziz\', \'300\']</code>.' },
  ],

  tasks: [
    {
      id: 't1', title: 'Дневник героя', brief: 'Запись в файл',
      desc: '<p>Запиши в файл <code>diary.txt</code> две строки:</p><pre class="code">День 13: изучаю файлы\nЗавтра финальный босс</pre><p>Потом прочитай файл и выведи его содержимое.</p>',
      starter: "# запиши через with open('diary.txt', 'w')\n# прочитай и выведи\n",
      tests: "with open('diary.txt') as _f:\n    _content = _f.read()\nassert 'День 13: изучаю файлы' in _content, 'В файле нет строки: День 13: изучаю файлы'\nassert 'Завтра финальный босс' in _content, 'В файле нет строки: Завтра финальный босс'\nassert 'День 13' in _stdout, 'Прочитай файл и выведи через print'",
      hint: "f.write('День 13: изучаю файлы\\n') и f.write('Завтра финальный босс\\n'), потом открой в режиме 'r' и print(f.read()).",
    },
    {
      id: 't2', title: 'Список покупок', brief: 'Запись списка + чтение циклом',
      desc: '<p>Дан список покупок. Запиши каждый элемент в файл <code>shop.txt</code> отдельной строкой. Потом прочитай файл и выведи каждую строку с номером:</p><pre class="code">1. хлеб\n2. молоко\n3. плов</pre>',
      starter: "items = ['хлеб', 'молоко', 'плов']\n# запиши в shop.txt, потом прочитай с номерами\n",
      tests: "with open('shop.txt') as _f:\n    _lines = [l.strip() for l in _f if l.strip()]\nassert _lines == ['хлеб', 'молоко', 'плов'], 'В файле должно быть 3 строки: хлеб, молоко, плов. Сейчас: ' + str(_lines)\nassert '1. хлеб' in _stdout, 'Вывод: 1. хлеб'\nassert '2. молоко' in _stdout, 'Вывод: 2. молоко'\nassert '3. плов' in _stdout, 'Вывод: 3. плов'",
      hint: 'Запись: for item in items: f.write(item + "\\n"). Чтение: for i, line in enumerate(f, 1): print(f"{i}. {line.strip()}")',
    },
    {
      id: 't3', title: 'Подсчёт очков из файла', brief: 'split + int + сумма',
      desc: '<p>В файле <code>results.txt</code> лежат результаты (он уже создан стартовым кодом). Прочитай его и выведи: <code>Общий счёт: 870</code></p>',
      starter: "with open('results.txt', 'w') as f:\n    f.write('level1 250\\nlevel2 300\\nlevel3 320\\n')\n\n# прочитай файл, сложи числа, выведи 'Общий счёт: 870'\n",
      tests: "assert 'Общий счёт: 870' in _stdout, 'Ожидался вывод: Общий счёт: 870. Разбирай строки через split() и складывай int(score)'",
      hint: 'total = 0, потом for line in f: name, score = line.split(), total += int(score). В конце print(f"Общий счёт: {total}")',
    },
  ],

  exam: {
    time: 600,
    questions: [
      { q: 'Как правильно открыть файл на дозапись?', options: ["open('f.txt', 'r')", "open('f.txt', 'w')", "open('f.txt', 'a')", "open('f.txt', 'add')"], a: 2, explain: '' },
      { q: 'Что выведет код?', code: "with open('t.txt', 'w') as f:\n    f.write('A')\nwith open('t.txt', 'w') as f:\n    f.write('B')\nwith open('t.txt') as f:\n    print(f.read())", options: ['AB', 'A', 'B', 'BA'], a: 2, explain: '' },
      { q: 'Файл содержит «5\\n10\\n». Что вернёт readlines()?', options: ["['5', '10']", "['5\\n', '10\\n']", "'5 10'", '[5, 10]'], a: 1, explain: '' },
      { q: 'Что делает f.write(42)?', options: ['Запишет 42', 'Запишет "42"', 'Ошибку — write принимает только строки', 'Ничего'], a: 2, explain: '' },
      { q: 'Как поймать ошибку отсутствующего файла?', options: ['if file.exists:', 'try/except FileNotFoundError', 'with open safe', 'Никак'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "line = 'sara 99'\nname, score = line.split()\nprint(int(score) + 1)", options: ['991', '100', 'Ошибку', 'sara1'], a: 1, explain: '' },
    ],
    task: {
      title: 'Лог сервера',
      desc: '<p>Стартовый код создаёт лог. Прочитай его, посчитай сколько строк содержат слово <code>ERROR</code> и выведи: <code>Ошибок: 2</code></p>',
      starter: "with open('server.log', 'w') as f:\n    f.write('INFO старт\\nERROR сбой сети\\nINFO работаем\\nERROR диск полон\\nINFO стоп\\n')\n\n# посчитай строки с ERROR\n",
      tests: "assert 'Ошибок: 2' in _stdout, 'Ожидался вывод: Ошибок: 2. Считай: if \\'ERROR\\' in line'",
    },
  },
};
