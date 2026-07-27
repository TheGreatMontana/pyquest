/* Финальный экзамен — по всему курсу */
COURSE_DATA.final = {
  time: 1800,
  questions: [
    { q: 'Что выведет код?', code: "x = '3'\ny = int(x) + 2\nprint(y)", options: ['32', '5', 'Ошибку', "'5'"], a: 1, explain: '' },
    { q: 'Что выведет код?', code: "a = [1, 2, 3, 4, 5]\nprint(a[1:4])", options: ['[1, 2, 3]', '[2, 3, 4]', '[2, 3, 4, 5]', '[1, 2, 3, 4]'], a: 1, explain: '' },
    { q: 'Что выведет код?', code: "s = 0\nfor i in range(1, 5):\n    s += i\nprint(s)", options: ['15', '10', '5', '4'], a: 1, explain: '' },
    { q: 'Что выведет код?', code: "n = 12\nif n % 3 == 0 and n % 4 == 0:\n    print('делится')\nelse:\n    print('нет')", options: ['делится', 'нет', 'Ошибку', 'Ничего'], a: 0, explain: '' },
    { q: 'Что выведет код?', code: "d = {'hp': 100}\nd['hp'] -= 40\nd['mp'] = 50\nprint(d['hp'] + d['mp'])", options: ['150', '110', '90', 'Ошибку'], a: 1, explain: '' },
    { q: 'Что выведет код?', code: "n = 1\nwhile n < 20:\n    n *= 3\nprint(n)", options: ['9', '18', '27', 'Бесконечный цикл'], a: 2, explain: '' },
    { q: 'Что выведет код?', code: "def f(x, y=2):\n    return x ** y\n\nprint(f(3))", options: ['6', '9', '5', 'Ошибку'], a: 1, explain: '' },
    { q: 'Что выведет код?', code: "class P:\n    def __init__(self, n):\n        self.n = n * 10\n\nprint(P(7).n)", options: ['7', '70', 'n', 'Ошибку'], a: 1, explain: '' },
    { q: 'Какой режим open() ДОБАВЛЯЕТ строки в конец файла?', options: ['"r"', '"w"', '"a"', '"x"'], a: 2, explain: '' },
    { q: 'Что выведет код?', code: "words = ['py', 'квест', 'финал']\nprint(len(words), len(words[0]))", options: ['3 2', '2 3', '3 py', 'Ошибку'], a: 0, explain: '' },
    { q: 'Что выведет код?', code: "res = []\nfor n in [5, 12, 8, 20]:\n    if n > 9:\n        res.append(n)\nprint(res)", options: ['[5, 8]', '[12, 20]', '[20]', '[5, 12, 8, 20]'], a: 1, explain: '' },
    { q: 'Что выведет код?', code: "def mystery(lst):\n    return lst[-1] + lst[0]\n\nprint(mystery([10, 50, 30]))", options: ['60', '40', '80', '90'], a: 1, explain: '' },
  ],
  tasks: [
    {
      title: 'FizzBuzz — легендарная задача с собеседований',
      desc: '<p>Выведи числа от 1 до 15, но: если число делится на 3 — вместо него <code>Fizz</code>, если на 5 — <code>Buzz</code>, если и на 3 и на 5 — <code>FizzBuzz</code>.</p><pre class="code">1\n2\nFizz\n4\nBuzz\n...\n14\nFizzBuzz</pre>',
      starter: '# Цикл по range(1, 16). Проверяй сначала деление на 15!\n',
      tests: "lines = [l.strip() for l in _stdout.strip().splitlines()]\nexpected = ['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz']\nassert lines == expected, 'Проверь порядок условий: сначала n % 15 == 0, потом % 3, потом % 5. Получилось: ' + str(lines[:5]) + '...'",
    },
    {
      title: 'Итоговый босс: система игроков',
      desc: '<p>Напиши класс <code>Player</code>: <code>__init__(name)</code> задаёт имя и <code>self.xp = 0</code>; метод <code>train(points)</code> прибавляет XP; метод <code>rank()</code> возвращает <code>"Мастер"</code> при XP ≥ 100, иначе <code>"Новичок"</code>.</p><p>Создай игрока <code>Player("Азиз")</code>, вызови <code>train(60)</code> дважды и выведи: <code>Азиз - Мастер</code></p>',
      starter: 'class Player:\n    pass  # твой код\n\np = Player("Азиз")\np.train(60)\np.train(60)\nprint(f"{p.name} - {p.rank()}")\n',
      tests: "assert p.name == 'Азиз', 'Атрибут name должен быть: Азиз'\nassert p.xp == 120, 'После двух train(60) должно быть 120 XP'\nassert p.rank() == 'Мастер', 'rank() при 120 XP должен вернуть: Мастер'\n_p2 = Player('Тест')\nassert _p2.rank() == 'Новичок', 'rank() при 0 XP должен вернуть: Новичок'\nassert 'Азиз - Мастер' in _stdout, 'Вывод: Азиз - Мастер'",
    },
  ],
};
