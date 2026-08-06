# -*- coding: utf-8 -*-
"""Эталонные решения задач. Ключ: courseId/moduleId/taskId (или /examN)."""

SOLUTIONS = {
# ===== python-basics =====
'python-basics/pb-01/t1': "print('Привет, Python!')",
'python-basics/pb-01/t2': "print('Меня зовут Азиз')\nprint('Я учу Python')\nprint('День 1 из 14')",
'python-basics/pb-01/t3': "print(25 * 4)",
'python-basics/pb-01/exam0': "print('Я сдаю первый экзамен')\nprint('Python - мой')",
'python-basics/pb-02/t1': "name = 'Азиз'\nlevel = 5\nprint(f'Игрок {name}, уровень {level}')",
'python-basics/pb-02/t2': "print(24 * 60 * 60)",
'python-basics/pb-02/t3': "n = input('Введи число: ')\nprint(int(n) * 2)",
'python-basics/pb-02/exam0': "name = input('Имя: ')\nage = input('Возраст: ')\nprint(f'{name}, через 10 лет тебе будет {int(age) + 10}')",
'python-basics/pb-03/t1': "games = ['CS', 'Dota', 'GTA']\nprint(games[0])\nprint(games[-1])",
'python-basics/pb-03/t2': "inventory = ['щит', 'камень', 'верёвка']\ninventory.append('зелье')\ninventory.remove('камень')\ninventory.insert(0, 'меч')\nprint(inventory)",
'python-basics/pb-03/t3': "damage = [12, 45, 70, 25, 22]\nprint(f'Всего: {sum(damage)}')\nprint(f'Макс: {max(damage)}')\nprint(f'Средний: {sum(damage) / len(damage)}')",
'python-basics/pb-03/exam0': "queue = ['Alpha', 'Bravo', 'Cobra']\nqueue.pop(0)\nqueue.append('Zeus')\nprint(queue)",
'python-basics/pb-04/t1': "for i in range(5, 0, -1):\n    print(i)\nprint('Пуск!')",
'python-basics/pb-04/t2': "total = 0\nfor n in range(1, 101):\n    total += n\nprint(total)",
'python-basics/pb-04/t3': "rounds = [30, 45, 25]\nfor i, score in enumerate(rounds, 1):\n    print(f'Раунд {i}: {score} очков')\nprint(f'Итого: {sum(rounds)}')",
'python-basics/pb-04/exam0': "nums = [3, 4, 7, 8, 10, 15]\nevens = []\nfor n in nums:\n    if n % 2 == 0:\n        evens.append(n)\nprint(evens)",
'python-basics/pb-05/t1': "n = int(input('Число: '))\nif n % 2 == 0:\n    print('чётное')\nelse:\n    print('нечётное')",
'python-basics/pb-05/t2': "xp = int(input('XP: '))\nif xp >= 1000:\n    print('Мастер')\nelif xp >= 500:\n    print('Боец')\nelse:\n    print('Новичок')",
'python-basics/pb-05/t3': "age = int(input('Возраст: '))\nticket = input('Билет (да/нет): ')\nif age >= 18 and ticket == 'да':\n    print('Добро пожаловать')\nelse:\n    print('Вход запрещён')",
'python-basics/pb-05/exam0': "total = int(input('Сумма: '))\nif total >= 5000:\n    pay = total * 0.75\nelif total >= 1000:\n    pay = total * 0.9\nelse:\n    pay = total\nprint(f'К оплате: {pay}')",

# ===== python-libraries =====
'python-libraries/pl-01/t1': """from collections import Counter

def top_words(text, n):
    counts = Counter(text.lower().split())
    return [word for word, _ in counts.most_common(n)]

print(top_words('кот пёс кот мышь кот пёс', 2))""",
'python-libraries/pl-01/t2': """from collections import defaultdict

def group_by_city(rows):
    grouped = defaultdict(list)
    for city, amount in rows:
        grouped[city].append(amount)
    return dict(grouped)

print(group_by_city([('Ташкент', 100), ('Бухара', 50), ('Ташкент', 300)]))""",
'python-libraries/pl-01/t3': r"""import re

def error_dates(log):
    return sorted(set(re.findall(r'ERROR (\d{4}-\d{2}-\d{2})', log)))

print(error_dates('ERROR 2026-08-05 диск\nINFO 2026-08-05 ок\nERROR 2026-08-01 сеть'))""",
'python-libraries/pl-01/exam0': r"""import re
from collections import Counter

def report(log):
    pairs = re.findall(r'(\w+) (\d{4}-\d{2}-\d{2})', log)
    if not pairs:
        return {'по_уровням': {}, 'дни_с_ошибками': [], 'первый_день': None, 'последний_день': None}
    levels = Counter(level for level, _ in pairs)
    dates = [day for _, day in pairs]
    errors = sorted({day for level, day in pairs if level == 'ERROR'})
    return {
        'по_уровням': dict(levels),
        'дни_с_ошибками': errors,
        'первый_день': min(dates),
        'последний_день': max(dates),
    }

print(report('ERROR 2026-08-05 диск\nINFO 2026-08-01 ок'))""",

'python-libraries/pl-02/t1': """import numpy as np

def normalize(values):
    a = np.array(values, dtype=float)
    if a.size == 0:
        return a
    lo, hi = a.min(), a.max()
    if hi == lo:
        return np.zeros_like(a)
    return (a - lo) / (hi - lo)

print(normalize([10, 20, 30]))""",
'python-libraries/pl-02/t2': """import numpy as np

def in_range(values, lo, hi):
    a = np.array(values)
    if a.size == 0:
        return a
    return a[(a >= lo) & (a <= hi)]

print(in_range([10, 25, 3, 47, 8], 5, 30))""",
'python-libraries/pl-02/t3': """import numpy as np

def summary(matrix):
    if not matrix:
        return {'по_магазинам': [], 'по_месяцам': [], 'лучший': None}
    m = np.array(matrix)
    by_shop = m.sum(axis=1)
    return {
        'по_магазинам': by_shop.tolist(),
        'по_месяцам': m.sum(axis=0).tolist(),
        'лучший': int(by_shop.argmax()),
    }

print(summary([[100, 120], [200, 180]]))""",
'python-libraries/pl-02/exam0': """import numpy as np

def analyze(scores, passing):
    if not scores:
        return {'средние': [], 'сдали': 0, 'сложный_предмет': None}
    m = np.array(scores, dtype=float)
    means = m.mean(axis=1).round(1)
    return {
        'средние': means.tolist(),
        'сдали': int((means >= passing).sum()),
        'сложный_предмет': int(m.mean(axis=0).argmin()),
    }

print(analyze([[90, 80, 70], [50, 40, 60]], 60))""",

'python-libraries/pl-03/t1': """import pandas as pd

def big_orders(rows, limit):
    if not rows:
        return []
    df = pd.DataFrame(rows)
    picked = df[df['amount'] > limit].sort_values('amount', ascending=False)
    return picked['city'].tolist()

print(big_orders([{'city': 'Ташкент', 'amount': 250}, {'city': 'Бухара', 'amount': 100}], 150))""",
'python-libraries/pl-03/t2': """import pandas as pd

def revenue_by_city(rows):
    if not rows:
        return {}
    df = pd.DataFrame(rows)
    df['amount'] = df['amount'].fillna(0)
    totals = df.groupby('city')['amount'].sum()
    return {city: int(value) for city, value in totals.items()}

print(revenue_by_city([{'city': 'Ташкент', 'amount': 250}, {'city': 'Ташкент', 'amount': 400}]))""",
'python-libraries/pl-03/t3': """import pandas as pd

def join_names(orders, users):
    if not orders:
        return []
    df = pd.DataFrame(orders)
    if users:
        df = df.merge(pd.DataFrame(users), on='user_id', how='left')
    else:
        df['name'] = None
    df['name'] = df['name'].fillna('неизвестно')
    return list(zip(df['name'], df['amount']))

o = [{'user_id': 1, 'amount': 250}, {'user_id': 9, 'amount': 100}]
u = [{'user_id': 1, 'name': 'Азиз'}]
print(join_names(o, u))""",
'python-libraries/pl-03/exam0': """import pandas as pd

def city_report(orders, users):
    if not orders:
        return []
    df = pd.DataFrame(orders)
    if users:
        df = df.merge(pd.DataFrame(users), on='user_id', how='left')
    else:
        df['city'] = None
    df['amount'] = df['amount'].fillna(0)
    df['city'] = df['city'].fillna('неизвестно')
    grouped = df.groupby('city', as_index=False).agg(
        total=('amount', 'sum'),
        orders=('amount', 'count'),
    ).sort_values('total', ascending=False)
    return [
        {'city': row['city'], 'total': int(row['total']), 'orders': int(row['orders'])}
        for _, row in grouped.iterrows()
    ]

o = [{'user_id': 1, 'amount': 250}, {'user_id': 1, 'amount': 100}]
u = [{'user_id': 1, 'name': 'Азиз', 'city': 'Ташкент'}]
print(city_report(o, u))""",

# ===== python-intermediate =====
'python-intermediate/pi-01/t1': "hero = {'name': 'Рыцарь', 'hp': 100}\nhero['gold'] = 50\nhero['hp'] -= 30\nprint(hero)",
'python-intermediate/pi-01/t2': "shop = {'зелье': 30, 'эликсир': 80, 'яд': 45}\nfor name, price in shop.items():\n    print(f'{name} - {price} монет')\nprint(f'Всего: {sum(shop.values())}')",
'python-intermediate/pi-01/t3': "voting = ['aziz', 'timur', 'aziz', 'bek', 'timur', 'aziz']\nvotes = {}\nfor name in voting:\n    votes[name] = votes.get(name, 0) + 1\nprint(votes)",
'python-intermediate/pi-01/exam0': "players = {'aziz': 8, 'sara': 12, 'bek': 5}\nbest_name = ''\nbest_level = 0\nfor name, level in players.items():\n    if level > best_level:\n        best_level = level\n        best_name = name\nprint(f'Чемпион: {best_name} (уровень {best_level})')",
'python-intermediate/pi-02/t1': "n = 1\nwhile n < 100:\n    print(n)\n    n *= 2",
'python-intermediate/pi-02/t2': "height = 1000\nwhile height > 0:\n    print(f'Высота: {height}')\n    height -= 150\nprint('Посадка!')",
'python-intermediate/pi-02/t3': "secret = 7\nwhile True:\n    guess = int(input('Число: '))\n    if guess < secret:\n        print('Больше!')\n    elif guess > secret:\n        print('Меньше!')\n    else:\n        print('Победа!')\n        break",
'python-intermediate/pi-02/exam0': "money = 1000\nyears = 0\nwhile money <= 2000:\n    money *= 1.1\n    years += 1\nprint(f'Лет: {years}')",
'python-intermediate/pi-03/t1': "def welcome(name, level):\n    return f'{name} [уровень {level}] вошёл в игру'\n\nprint(welcome('Азиз', 5))",
'python-intermediate/pi-03/t2': "def max3(a, b, c):\n    best = a\n    if b > best:\n        best = b\n    if c > best:\n        best = c\n    return best\n\nprint(max3(3, 9, 5))",
'python-intermediate/pi-03/t3': "def xp_for_level(level):\n    return level * 100\n\ndef total_xp(levels):\n    total = 0\n    for lvl in levels:\n        total += xp_for_level(lvl)\n    return total\n\nprint(total_xp([1, 2, 3]))",
'python-intermediate/pi-03/exam0': "def grade(score):\n    if score >= 90:\n        return 'A'\n    elif score >= 70:\n        return 'B'\n    elif score >= 50:\n        return 'C'\n    return 'F'\n\nprint(grade(95))\nprint(grade(71))\nprint(grade(30))",

# ===== python-advanced =====
'python-advanced/pa-01/t1': "class Hero:\n    def __init__(self, name, power):\n        self.name = name\n        self.power = power\n\nh = Hero('Азиз', 95)\nprint(f'{h.name}: сила {h.power}')",
'python-advanced/pa-01/t2': "class Bank:\n    def __init__(self):\n        self.balance = 0\n\n    def add(self, amount):\n        self.balance += amount\n\n    def show(self):\n        return f'Баланс: {self.balance}'\n\nb = Bank()\nb.add(150)\nb.add(50)\nprint(b.show())",
'python-advanced/pa-01/t3': "class Unit:\n    def __init__(self, name):\n        self.name = name\n\n    def info(self):\n        print(f'Юнит: {self.name}')\n\nclass Archer(Unit):\n    def shoot(self):\n        return f'{self.name} стреляет!'\n\na = Archer('Леголас')\na.info()\nprint(a.shoot())",
'python-advanced/pa-01/exam0': "class Inventory:\n    def __init__(self):\n        self.items = []\n\n    def add(self, item):\n        self.items.append(item)\n\n    def count(self):\n        return len(self.items)\n\ninv = Inventory()\ninv.add('меч')\ninv.add('щит')\nprint(f'Предметов: {inv.count()}')",
'python-advanced/pa-02/t1': "with open('diary.txt', 'w', encoding='utf-8') as f:\n    f.write('День 13: изучаю файлы\\n')\n    f.write('Завтра финальный босс\\n')\nwith open('diary.txt', encoding='utf-8') as f:\n    print(f.read())",
'python-advanced/pa-02/t2': "items = ['хлеб', 'молоко', 'плов']\nwith open('shop.txt', 'w', encoding='utf-8') as f:\n    for item in items:\n        f.write(item + '\\n')\nwith open('shop.txt', encoding='utf-8') as f:\n    for i, line in enumerate(f, 1):\n        print(f'{i}. {line.strip()}')",
'python-advanced/pa-02/t3': "with open('results.txt', 'w', encoding='utf-8') as f:\n    f.write('level1 250\\nlevel2 300\\nlevel3 320\\n')\n\ntotal = 0\nwith open('results.txt', encoding='utf-8') as f:\n    for line in f:\n        name, score = line.split()\n        total += int(score)\nprint(f'Общий счёт: {total}')",
'python-advanced/pa-02/exam0': "with open('server.log', 'w', encoding='utf-8') as f:\n    f.write('INFO старт\\nERROR сбой сети\\nINFO работаем\\nERROR диск полон\\nINFO стоп\\n')\n\ncount = 0\nwith open('server.log', encoding='utf-8') as f:\n    for line in f:\n        if 'ERROR' in line:\n            count += 1\nprint(f'Ошибок: {count}')",
'python-advanced/final/task0': "for n in range(1, 16):\n    if n % 15 == 0:\n        print('FizzBuzz')\n    elif n % 3 == 0:\n        print('Fizz')\n    elif n % 5 == 0:\n        print('Buzz')\n    else:\n        print(n)",
'python-advanced/final/task1': "class Player:\n    def __init__(self, name):\n        self.name = name\n        self.xp = 0\n\n    def train(self, points):\n        self.xp += points\n\n    def rank(self):\n        if self.xp >= 100:\n            return 'Мастер'\n        return 'Новичок'\n\np = Player('Азиз')\np.train(60)\np.train(60)\nprint(f'{p.name} - {p.rank()}')",

'python-advanced/pa-03/t1': """def evens(limit):
    for n in range(0, limit, 2):
        yield n

print(list(evens(10)))""",
'python-advanced/pa-03/t2': """import functools

def counted(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

@counted
def greet(name):
    return f'привет, {name}'

print(greet('Азиз'))
print(greet.calls)""",
'python-advanced/pa-03/t3': """class NotEnoughMoney(Exception):
    def __init__(self, need, have):
        super().__init__(f'нужно {need}, а есть {have}')
        self.need = need
        self.have = have

def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError('сумма должна быть положительной')
    if amount > balance:
        raise NotEnoughMoney(amount, balance)
    return balance - amount

print(withdraw(100, 30))""",
'python-advanced/pa-03/exam0': """def parse(lines):
    for line in lines:
        parts = line.split(' ', 1)
        if len(parts) < 2:
            continue
        yield (parts[0], parts[1])

def only(pairs, level):
    for name, message in pairs:
        if name == level:
            yield (name, message)

def count_errors(lines):
    return sum(1 for _ in only(parse(lines), 'ERROR'))

log = ['ERROR диск полон', 'INFO старт']
print(count_errors(log))""",

# ===== algorithms =====
'algorithms/alg-01/t1': "def linear_search(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1\n\nprint(linear_search([5, 3, 8, 3], 3))",
'algorithms/alg-01/t2': "def binary_search(items, target):\n    low, high = 0, len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return mid\n        if items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\nprint(binary_search([1, 3, 5, 7, 9, 11], 9))",
'algorithms/alg-01/t3': "def binary_steps(items, target):\n    low, high = 0, len(items) - 1\n    steps = 0\n    while low <= high:\n        steps += 1\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return steps\n        if items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\nprint(binary_steps(list(range(1024)), 777))",
'algorithms/alg-01/exam0': "def contains(sorted_items, target):\n    low, high = 0, len(sorted_items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if sorted_items[mid] == target:\n            return True\n        if sorted_items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return False\n\nprint(contains([2, 4, 6, 8], 6))",
'algorithms/alg-02/t1': "def find_smallest_index(items):\n    smallest = 0\n    for i in range(1, len(items)):\n        if items[i] < items[smallest]:\n            smallest = i\n    return smallest\n\nprint(find_smallest_index([29, 5, 71, 34]))",
'algorithms/alg-02/t2': "def find_smallest_index(items):\n    smallest = 0\n    for i in range(1, len(items)):\n        if items[i] < items[smallest]:\n            smallest = i\n    return smallest\n\ndef selection_sort(items):\n    src = list(items)\n    result = []\n    while src:\n        idx = find_smallest_index(src)\n        result.append(src.pop(idx))\n    return result\n\nprint(selection_sort([29, 5, 71, 34, 10]))",
'algorithms/alg-02/t3': "def top_students(students):\n    ordered = sorted(students, key=lambda s: s[1], reverse=True)\n    return [s[0] for s in ordered]\n\nprint(top_students([('Азиз', 87), ('Тимур', 92), ('Сара', 78)]))",
'algorithms/alg-02/exam0': "def sort_desc(items):\n    src = list(items)\n    result = []\n    while src:\n        big = 0\n        for i in range(1, len(src)):\n            if src[i] > src[big]:\n                big = i\n        result.append(src.pop(big))\n    return result\n\nprint(sort_desc([5, 1, 9, 3]))",
'algorithms/alg-03/t1': "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))",
'algorithms/alg-03/t2': "def rec_sum(items):\n    if not items:\n        return 0\n    return items[0] + rec_sum(items[1:])\n\nprint(rec_sum([1, 2, 3, 4, 5]))",
'algorithms/alg-03/t3': "def power(a, n):\n    if n == 0:\n        return 1\n    return a * power(a, n - 1)\n\nprint(power(2, 10))",
'algorithms/alg-03/exam0': "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(10))",
'algorithms/alg-04/t1': "def first_duplicate(items):\n    seen = set()\n    for x in items:\n        if x in seen:\n            return x\n        seen.add(x)\n    return None\n\nprint(first_duplicate([3, 7, 1, 7, 5]))",
'algorithms/alg-04/t2': "def word_freq(text):\n    counts = {}\n    for word in text.lower().split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts\n\nprint(word_freq('SQL питон sql Питон SQL'))",
'algorithms/alg-04/t3': "from collections import deque\n\ndef path_exists(graph, start, target):\n    queue = deque([start])\n    visited = set()\n    while queue:\n        node = queue.popleft()\n        if node == target:\n            return True\n        if node in visited:\n            continue\n        visited.add(node)\n        queue.extend(graph[node])\n    return False\n\ng = {'A': ['B'], 'B': ['C'], 'C': [], 'D': ['A']}\nprint(path_exists(g, 'A', 'C'))",
'algorithms/alg-04/exam0': "def two_sum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], i]\n        seen[x] = i\n\nprint(two_sum([2, 7, 11, 15], 9))",

# ===== de-tools =====
'de-tools/dt-01/t1': "import csv, io\n\ndef parse_rows(text):\n    reader = csv.DictReader(io.StringIO(text))\n    out = []\n    for row in reader:\n        out.append({'id': int(row['id']), 'city': row['city'], 'amount': float(row['amount'])})\n    return out\n\nprint(parse_rows('id,city,amount\\n1,Ташкент,120.5\\n'))",
'de-tools/dt-01/t2': "def validate(rows):\n    good, bad = [], []\n    for row in rows:\n        if row.get('city') and row.get('amount', 0) > 0:\n            good.append(row)\n        else:\n            bad.append(row)\n    return good, bad\n\nprint(validate([{'city': 'X', 'amount': 1}]))",
'de-tools/dt-01/t3': "def load_report(total, loaded, rejected):\n    quality = round(loaded / total * 100, 1) if total else 0\n    return f'Прочитано: {total} | Загружено: {loaded} | Отклонено: {rejected} | Качество: {quality}%'\n\nprint(load_report(100, 95, 5))",
'de-tools/dt-01/exam0': "def dedupe(rows, key):\n    seen = set()\n    out = []\n    for row in rows:\n        k = row.get(key)\n        if k in seen:\n            continue\n        seen.add(k)\n        out.append(row)\n    return out\n\nprint(dedupe([{'id': 1}, {'id': 1}], 'id'))",
'de-tools/dt-02/t1': "def can_run(dag, done):\n    return sorted(task for task, deps in dag.items()\n                  if task not in done and all(d in done for d in deps))\n\nprint(can_run({'a': [], 'b': ['a']}, set()))",
'de-tools/dt-02/t2': "def has_cycle(dag):\n    visited = set()\n    stack = set()\n\n    def visit(node):\n        if node in stack:\n            return True\n        if node in visited:\n            return False\n        visited.add(node)\n        stack.add(node)\n        for dep in dag.get(node, []):\n            if visit(dep):\n                return True\n        stack.discard(node)\n        return False\n\n    return any(visit(n) for n in dag)\n\nprint(has_cycle({'a': ['b'], 'b': ['a']}))",
'de-tools/dt-02/t3': "def process_events(events):\n    totals = {}\n    for e in events:\n        t = e.get('type')\n        if not t:\n            continue\n        totals[t] = totals.get(t, 0) + e.get('amount', 0)\n    return totals\n\nprint(process_events([{'type': 'order', 'amount': 100}]))",
'de-tools/dt-02/exam0': "def execution_order(dag):\n    done = []\n    done_set = set()\n    while True:\n        ready = sorted(task for task, deps in dag.items()\n                       if task not in done_set and all(d in done_set for d in deps))\n        if not ready:\n            break\n        for task in ready:\n            done.append(task)\n            done_set.add(task)\n    return done if len(done) == len(dag) else []\n\nprint(execution_order({'extract': [], 'transform': ['extract']}))",

# ===== backend-intro =====
'backend-intro/be-01/t1': "import json\n\nresponse = '{\"name\": \"Aziz\", \"skills\": [\"python\", \"sql\"]}'\ndata = json.loads(response)\nprint(f\"{data['name']}: {len(data['skills'])} навыка\")",
'backend-intro/be-01/t2': "def describe(status):\n    group = status // 100\n    if group == 2:\n        return 'успех'\n    if group == 4:\n        return 'ошибка клиента'\n    if group == 5:\n        return 'ошибка сервера'\n    return 'другое'\n\nprint(describe(200))",
'backend-intro/be-01/t3': "import json\n\ndef make_response(name, xp):\n    return json.dumps({'name': name, 'xp': xp, 'status': 'ok'})\n\nprint(make_response('Aziz', 340))",
'backend-intro/be-01/exam0': "def handle(method, path):\n    if method == 'GET' and path == '/api/users':\n        return 200\n    if method == 'POST' and path == '/api/users':\n        return 201\n    return 404\n\nprint(handle('GET', '/api/users'))",
'backend-intro/be-02/t1': """def validate(payload, schema):
    errors = []
    for field, rule in schema.items():
        if field not in payload:
            if rule['required']:
                errors.append(field + ': обязательное')
            continue
        value = payload[field]
        if not isinstance(value, rule['type']) or isinstance(value, bool):
            errors.append(field + ': тип')
            continue
        if 'min' in rule and value < rule['min']:
            errors.append(field + ': мало')
    return errors

schema = {'цена': {'type': int, 'required': True, 'min': 0}}
print(validate({'цена': -5}, schema))""",
'backend-intro/be-02/t2': """def fetch(token, order_id, sessions, orders):
    user = sessions.get(token)
    if user is None:
        return (401, None)
    order = orders.get(order_id)
    if order is None or order['владелец'] != user:
        return (404, None)
    return (200, order)

S = {'tok': 'aziz'}
O = {1: {'владелец': 'aziz', 'сумма': 100}}
print(fetch('tok', 1, S, O))""",
'backend-intro/be-02/t3': """def paginate(items, limit, offset, max_limit):
    limit = max(1, min(int(limit), max_limit))
    offset = max(0, int(offset))
    return {
        'items': items[offset:offset + limit],
        'всего': len(items),
        'есть_ещё': offset + limit < len(items),
    }

print(paginate(list(range(10)), 3, 0, 50))""",
'backend-intro/be-02/exam0': """def handle(token, key, payload, state):
    user = state['sessions'].get(token)
    if user is None:
        return (401, None)
    if key in state['keys']:
        return (200, state['keys'][key])

    amount = payload.get('сумма')
    if not isinstance(amount, (int, float)) or isinstance(amount, bool) or amount <= 0:
        return (400, None)

    order_id = state['next_id']
    state['next_id'] += 1
    state['orders'][order_id] = {'владелец': user, 'сумма': amount}
    state['keys'][key] = order_id
    return (201, order_id)

state = {'sessions': {'tok': 'aziz'}, 'orders': {}, 'keys': {}, 'next_id': 1}
print(handle('tok', 'k1', {'сумма': 100}, state))
print(handle('tok', 'k1', {'сумма': 100}, state))""",

# ===== analytics-intro =====
'analytics-intro/an-01/t1': "def median(values):\n    if not values:\n        return 0\n    s = sorted(values)\n    n = len(s)\n    mid = n // 2\n    if n % 2:\n        return s[mid]\n    return (s[mid - 1] + s[mid]) / 2\n\nprint(median([3, 1, 2]))",
'analytics-intro/an-01/t2': "def revenue_by_city(orders):\n    result = {}\n    for city, amount in orders:\n        result[city] = result.get(city, 0) + amount\n    return result\n\nprint(revenue_by_city([('Ташкент', 100), ('Бухара', 50), ('Ташкент', 200)]))",
'analytics-intro/an-01/t3': "def top_share(data):\n    if not data:\n        return 0\n    total = sum(data.values())\n    return round(max(data.values()) / total * 100, 1)\n\nprint(top_share({'A': 300, 'B': 100}))",
'analytics-intro/an-01/exam0': "def report(orders):\n    totals = {}\n    for name, amount in orders:\n        totals[name] = totals.get(name, 0) + amount\n    ordered = sorted(totals.items(), key=lambda x: -x[1])\n    return [f'{name}: {amount}' for name, amount in ordered]\n\nprint(report([('A', 10), ('B', 30), ('A', 5)]))",
'analytics-intro/an-02/t1': """def conversions(steps):
    out = []
    for i in range(1, len(steps)):
        prev = steps[i - 1]
        out.append(round(steps[i] / prev * 100, 1) if prev else 0.0)
    return out

print(conversions([1000, 300, 270]))""",
'analytics-intro/an-02/t2': """def bottleneck(names, steps):
    if len(steps) < 2:
        return None
    worst_rate = None
    worst_index = 1
    for i in range(1, len(steps)):
        prev = steps[i - 1]
        rate = steps[i] / prev if prev else 0.0
        if worst_rate is None or rate < worst_rate:
            worst_rate = rate
            worst_index = i
    return names[worst_index]

print(bottleneck(['зашли', 'корзина', 'оплата'], [1000, 300, 270]))""",
'analytics-intro/an-02/t3': """def retention(users, month):
    groups = {}
    for u in users:
        groups.setdefault(u['когорта'], []).append(u['месяцы'])
    out = {}
    for name, rows in groups.items():
        alive = sum(1 for months in rows if month in months)
        out[name] = round(alive / len(rows) * 100, 1)
    return out

users = [{'когорта': 'янв', 'месяцы': [0, 1]}, {'когорта': 'янв', 'месяцы': [0]}]
print(retention(users, 1))""",
'analytics-intro/an-02/exam0': """def funnel_report(names, steps):
    if len(steps) < 2:
        return {'общая': 0.0, 'шаги': [], 'узкое': None}

    rates = []
    for i in range(1, len(steps)):
        prev = steps[i - 1]
        rates.append(round(steps[i] / prev * 100, 1) if prev else 0.0)

    worst_index = 1
    worst_rate = None
    for i, rate in enumerate(rates, start=1):
        if worst_rate is None or rate < worst_rate:
            worst_rate = rate
            worst_index = i

    total = round(steps[-1] / steps[0] * 100, 1) if steps[0] else 0.0
    return {'общая': total, 'шаги': rates, 'узкое': names[worst_index]}

print(funnel_report(['зашли', 'корзина', 'оплата'], [1000, 300, 270]))""",

# ===== security-intro =====
'security-intro/se-01/t1': "import hashlib\n\ndef hash_password(password):\n    return hashlib.sha256(password.encode()).hexdigest()\n\nprint(hash_password('python123'))",
'security-intro/se-01/t2': "import hashlib\n\ndef hash_password(password):\n    return hashlib.sha256(password.encode()).hexdigest()\n\ndef verify(password, stored_hash):\n    return hash_password(password) == stored_hash\n\nprint(verify('secret1', hash_password('secret1')))",
'security-intro/se-01/t3': "def is_dangerous(query):\n    q = query.lower()\n    return '--' in q or 'drop' in q or \"or '1'='1'\" in q\n\nprint(is_dangerous(\"SELECT * FROM users WHERE name = 'admin' --'\"))",
'security-intro/se-01/exam0': "def build_query(table, column):\n    def safe(name):\n        return all(ch.isalnum() or ch == '_' for ch in name) and len(name) > 0\n    if not safe(table) or not safe(column):\n        return None\n    return f'SELECT * FROM {table} WHERE {column} = ?'\n\nprint(build_query('users', 'id'))",
'security-intro/se-02/t1': """def escape(text):
    text = str(text)
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;').replace('>', '&gt;')
    text = text.replace('"', '&quot;').replace("'", '&#39;')
    return text

print(escape('<script>alert(1)</script>'))""",
'security-intro/se-02/t2': """def safe_next(path):
    if not path:
        return '/'
    if path.startswith('//') or '://' in path:
        return '/'
    if not path.startswith('/'):
        return '/'
    return path

print(safe_next('/profile'), safe_next('https://zlo.example'))""",
'security-intro/se-02/t3': """def can_read(user, doc_id, users, docs):
    doc = docs.get(doc_id)
    if doc is None:
        return False
    role = users.get(user)
    if role is None:
        return False
    if role == 'admin':
        return True
    return doc['владелец'] == user

U = {'aziz': 'user', 'admin': 'admin'}
D = {1: {'владелец': 'aziz'}}
print(can_read('aziz', 1, U, D), can_read('chuzhoy', 1, U, D))""",
'security-intro/se-02/exam0': """def render(comment, user, users, docs):
    def escape(text):
        text = str(text)
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;').replace('>', '&gt;')
        text = text.replace('"', '&quot;').replace("'", '&#39;')
        return text

    doc = docs.get(comment['doc'])
    if doc is None:
        return (403, '')
    role = users.get(user)
    if role is None:
        return (403, '')
    if role != 'admin' and doc['владелец'] != user:
        return (403, '')

    author = escape(comment['автор'])
    text = escape(comment['текст'])
    return (200, '<p><b>' + author + '</b>: ' + text + '</p>')

U = {'aziz': 'user'}
D = {1: {'владелец': 'aziz'}}
c = {'doc': 1, 'автор': 'aziz', 'текст': '<script>alert(1)</script>'}
print(render(c, 'aziz', U, D))""",

# ===== ml-intro =====
'ml-intro/ml-01/t1': """def mae(actual, predicted):
    if not actual:
        return 0
    total = sum(abs(a - p) for a, p in zip(actual, predicted))
    return total / len(actual)

print(mae([10, 20], [12, 18]))""",
'ml-intro/ml-01/t2': """def fit(xs, ys):
    if not xs:
        return 0
    return sum(y / x for x, y in zip(xs, ys)) / len(xs)

print(fit([1, 2, 3], [2, 4, 6]))""",
'ml-intro/ml-01/t3': """def split(rows, ratio):
    cut = int(len(rows) * ratio)
    return rows[:cut], rows[cut:]

print(split([1, 2, 3, 4, 5], 0.6))""",
'ml-intro/ml-01/exam0': """def evaluate(rows, ratio):
    cut = int(len(rows) * ratio)
    train, test = rows[:cut], rows[cut:]
    if not train or not test:
        return 0.0
    k = sum(y / x for x, y in train) / len(train)
    return float(sum(abs(k * x - y) for x, y in test) / len(test))

print(evaluate([(1, 2), (2, 4), (3, 6), (4, 8)], 0.5))""",
'ml-intro/ml-02/t1': """from math import sqrt

def knn(train, point, k):
    if not train:
        return None
    ranked = sorted(train, key=lambda row: sqrt(sum((a - b) ** 2 for a, b in zip(row[0], point))))
    labels = [label for _, label in ranked[:k]]
    return max(set(labels), key=labels.count)

print(knn([([0], 'A'), ([1], 'A'), ([10], 'B')], [9], 1))""",
'ml-intro/ml-02/t2': """def scores(actual, predicted):
    tp = sum(1 for a, p in zip(actual, predicted) if a == 1 and p == 1)
    fp = sum(1 for a, p in zip(actual, predicted) if a == 0 and p == 1)
    fn = sum(1 for a, p in zip(actual, predicted) if a == 1 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return precision, recall

print(scores([1, 0, 1, 1], [1, 1, 0, 1]))""",
'ml-intro/ml-02/t3': """def normalize(rows):
    if not rows:
        return []
    cols = list(zip(*rows))
    lo = [min(c) for c in cols]
    hi = [max(c) for c in cols]
    out = []
    for row in rows:
        out.append([(v - l) / (h - l) if h > l else 0.0 for v, l, h in zip(row, lo, hi)])
    return out

print(normalize([[10, 100], [20, 300], [30, 200]]))""",
'ml-intro/ml-02/exam0': """from math import sqrt

def run_knn(train, test, k):
    if not test:
        return (0.0, 0.0)
    predicted = []
    for point, _ in test:
        ranked = sorted(train, key=lambda row: sqrt(sum((a - b) ** 2 for a, b in zip(row[0], point))))
        labels = [label for _, label in ranked[:k]]
        predicted.append(max(set(labels), key=labels.count))
    actual = [label for _, label in test]
    tp = sum(1 for a, p in zip(actual, predicted) if a == 1 and p == 1)
    fp = sum(1 for a, p in zip(actual, predicted) if a == 0 and p == 1)
    fn = sum(1 for a, p in zip(actual, predicted) if a == 1 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return precision, recall

train = [([0], 0), ([1], 0), ([10], 1), ([11], 1)]
print(run_knn(train, [([2], 0), ([9], 1)], 1))""",

# ===== dl-intro =====
'dl-intro/dl-01/t1': """def neuron(inputs, weights, bias):
    return sum(x * w for x, w in zip(inputs, weights)) + bias

print(neuron([1, 2], [0.5, -1], 0))""",
'dl-intro/dl-01/t2': """def layer(inputs, weights_list, biases):
    out = []
    for weights, bias in zip(weights_list, biases):
        total = bias + sum(x * w for x, w in zip(inputs, weights))
        out.append(max(0, total))
    return out

print(layer([1, 2], [[0.5, -1], [1, 1]], [0, 0]))""",
'dl-intro/dl-01/t3': """def step(w, data, lr):
    if not data:
        return w
    grad = sum(2 * (w * x - y) * x for x, y in data) / len(data)
    return w - lr * grad

print(step(0.0, [(1, 3), (2, 6)], 0.1))""",
'dl-intro/dl-01/exam0': """def train(data, lr, steps):
    w = 0.0
    for _ in range(steps):
        if not data:
            break
        grad = sum(2 * (w * x - y) * x for x, y in data) / len(data)
        w -= lr * grad
    return w

print(train([(1, 3), (2, 6), (3, 9)], 0.05, 50))""",
'dl-intro/dl-02/t1': """def slope(f, x, h=1e-6):
    return (f(x + h) - f(x)) / h

print(slope(lambda v: v * v, 3))""",
'dl-intro/dl-02/t2': """def descend(f, start, rate, steps):
    h = 1e-6
    x = start
    for _ in range(steps):
        x = x - rate * (f(x + h) - f(x)) / h
    return x

print(descend(lambda x: (x - 3) ** 2, 10.0, 0.1, 50))""",
'dl-intro/dl-02/t3': """def diagnose(losses):
    if len(losses) < 2:
        return 'стоит'
    if losses[-1] < losses[0]:
        return 'сходится'
    if losses[-1] > losses[0]:
        return 'расходится'
    return 'стоит'

print(diagnose([10, 5, 2, 1]))""",
'dl-intro/dl-02/exam0': """def train(xs, ys, rate, epochs):
    if not xs:
        return (0.0, 0.0)
    h = 1e-6
    w, b = 0.0, 0.0

    def mse(w, b):
        return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

    for _ in range(epochs):
        base = mse(w, b)
        gw = (mse(w + h, b) - base) / h
        gb = (mse(w, b + h) - base) / h
        w -= rate * gw
        b -= rate * gb
    return (w, b)

print(train([1, 2, 3, 4, 5], [3, 5, 7, 9, 11], 0.02, 300))""",

# ===== nlp-intro =====
'nlp-intro/nl-01/t1': """def tokenize(text):
    clean = ''.join(ch.lower() if ch.isalnum() else ' ' for ch in text)
    return [w for w in clean.split() if w]

print(tokenize('Привет, мир!'))""",
'nlp-intro/nl-01/t2': """def bag(tokens):
    counts = {}
    for t in tokens:
        counts[t] = counts.get(t, 0) + 1
    return counts

print(bag(['a', 'b', 'a']))""",
'nlp-intro/nl-01/t3': """import math

def cosine(a, b):
    keys = set(a) | set(b)
    dot = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0

print(cosine({'x': 1}, {'x': 2}))""",
'nlp-intro/nl-01/exam0': """import math

def most_similar(query, docs):
    def tokenize(text):
        clean = ''.join(ch.lower() if ch.isalnum() else ' ' for ch in text)
        return [w for w in clean.split() if w]

    def bag(tokens):
        counts = {}
        for t in tokens:
            counts[t] = counts.get(t, 0) + 1
        return counts

    def cosine(a, b):
        keys = set(a) | set(b)
        dot = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
        na = math.sqrt(sum(v * v for v in a.values()))
        nb = math.sqrt(sum(v * v for v in b.values()))
        return dot / (na * nb) if na and nb else 0.0

    if not docs:
        return -1
    q = bag(tokenize(query))
    best, best_score = 0, -1.0
    for i, doc in enumerate(docs):
        score = cosine(q, bag(tokenize(doc)))
        if score > best_score:
            best_score = score
            best = i
    return best

print(most_similar('python код', ['борщ рецепт', 'python простой код']))""",
'nlp-intro/nl-02/t1': """from math import log

def idf(word, docs):
    if not docs:
        return 0.0
    w = word.lower()
    n = sum(1 for d in docs if w in d.lower().split())
    if not n:
        return 0.0
    return log(len(docs) / n)

print(idf('кот', ['кот на окне', 'кот спит', 'курс вырос']))""",
'nlp-intro/nl-02/t2': """def clean(text, stop):
    return [w for w in text.lower().split() if w not in stop and len(w) >= 2]

print(clean('Кот и Пёс в доме', {'и', 'в'}))""",
'nlp-intro/nl-02/t3': """def classify(train, text):
    if not train:
        return None
    counts = {}
    vocab = set()
    for doc, label in train:
        words = doc.lower().split()
        bag = counts.setdefault(label, {})
        for w in words:
            bag[w] = bag.get(w, 0) + 1
            vocab.add(w)

    def score(label):
        bag = counts[label]
        total = sum(bag.values())
        p = 1.0
        for w in text.lower().split():
            p *= (bag.get(w, 0) + 1) / (total + len(vocab))
        return p

    return max(counts, key=score)

data = [('выиграли приз деньги', 'спам'), ('встреча завтра офис', 'обычное')]
print(classify(data, 'приз деньги'))""",
'nlp-intro/nl-02/exam0': """def evaluate(train, test):
    if not train or not test:
        return 0.0
    counts = {}
    vocab = set()
    for doc, label in train:
        bag = counts.setdefault(label, {})
        for w in doc.lower().split():
            bag[w] = bag.get(w, 0) + 1
            vocab.add(w)

    def classify(text):
        def score(label):
            bag = counts[label]
            total = sum(bag.values())
            p = 1.0
            for w in text.lower().split():
                p *= (bag.get(w, 0) + 1) / (total + len(vocab))
            return p
        return max(counts, key=score)

    real = sum(1 for _, label in test if label == 'спам')
    if not real:
        return 0.0
    found = sum(1 for doc, label in test if label == 'спам' and classify(doc) == 'спам')
    return found / real

data = [('приз деньги', 'спам'), ('встреча офис', 'обычное')]
print(evaluate(data, [('деньги приз', 'спам')]))""",

# ===== cv-intro =====
'cv-intro/cv-01/t1': """def invert(image):
    return [[255 - p for p in row] for row in image]

print(invert([[0, 255], [100, 200]]))""",
'cv-intro/cv-01/t2': """def threshold(image, level):
    return [[255 if p >= level else 0 for p in row] for row in image]

print(threshold([[10, 200]], 150))""",
'cv-intro/cv-01/t3': """def edges(image):
    out = []
    for row in image:
        out.append([row[i + 1] - row[i - 1] for i in range(1, len(row) - 1)])
    return out

print(edges([[0, 0, 255, 255]]))""",
'cv-intro/cv-01/exam0': """def bounding_box(image, level):
    points = [(y, x) for y, row in enumerate(image)
                     for x, p in enumerate(row) if p >= level]
    if not points:
        return None
    ys = [p[0] for p in points]
    xs = [p[1] for p in points]
    return {'top': min(ys), 'left': min(xs), 'bottom': max(ys), 'right': max(xs)}

print(bounding_box([[0, 0], [0, 200]], 150))""",
'cv-intro/cv-02/t1': """def pool(img):
    if not img:
        return []
    out = []
    for y in range(0, len(img) - 1, 2):
        row = []
        for x in range(0, len(img[y]) - 1, 2):
            row.append(max(img[y][x], img[y][x + 1], img[y + 1][x], img[y + 1][x + 1]))
        out.append(row)
    return out

print(pool([[1, 2, 8, 9], [3, 4, 7, 6], [5, 0, 1, 2], [1, 1, 3, 4]]))""",
'cv-intro/cv-02/t2': """def histogram(img, bins):
    step = 256 / bins
    counts = [0] * bins
    for row in img:
        for value in row:
            counts[min(int(value / step), bins - 1)] += 1
    return counts

print(histogram([[0, 0], [255, 255]], 2))""",
'cv-intro/cv-02/t3': """def find(scene, tpl):
    if not scene or not tpl:
        return None
    th, tw = len(tpl), len(tpl[0])
    if th > len(scene) or tw > len(scene[0]):
        return None
    best, best_pos = None, None
    for y in range(len(scene) - th + 1):
        for x in range(len(scene[0]) - tw + 1):
            diff = sum(abs(scene[y + dy][x + dx] - tpl[dy][dx])
                       for dy in range(th) for dx in range(tw))
            if best is None or diff < best:
                best, best_pos = diff, (y, x)
    return best_pos

scene = [[0, 0, 0], [0, 9, 9], [0, 9, 9]]
print(find(scene, [[9, 9], [9, 9]]))""",
'cv-intro/cv-02/exam0': """def describe(img, bins):
    small = []
    for y in range(0, len(img) - 1, 2):
        row = []
        for x in range(0, len(img[y]) - 1, 2):
            row.append(max(img[y][x], img[y][x + 1], img[y + 1][x], img[y + 1][x + 1]))
        small.append(row)

    step = 256 / bins
    counts = [0] * bins
    for row in small:
        for value in row:
            counts[min(int(value / step), bins - 1)] += 1
    return counts

print(describe([[0, 0, 255, 255], [0, 0, 255, 255], [0, 0, 0, 0], [0, 0, 0, 0]], 2))""",

# ===== devops-intro =====
'devops-intro/do-01/t1': """def run_pipeline(steps):
    for name, ok in steps:
        if not ok:
            return name
    return None

print(run_pipeline([('сборка', True), ('тесты', False)]))""",
'devops-intro/do-01/t2': """def count_errors(lines):
    return sum(1 for line in lines if 'ERROR' in line)

print(count_errors(['INFO ok', 'ERROR упало']))""",
'devops-intro/do-01/t3': """def last_good(deploys):
    for version, ok in reversed(deploys):
        if ok:
            return version
    return None

print(last_good([('v1', True), ('v2', True), ('v3', False)]))""",
'devops-intro/do-01/exam0': """def should_alert(lines, threshold):
    if not lines:
        return False
    errors = sum(1 for line in lines if 'ERROR' in line)
    return errors / len(lines) > threshold

print(should_alert(['ERROR a', 'INFO b'], 0.4))""",
'devops-intro/do-02/t1': """def canary(stages, base, limit):
    threshold = base * limit
    for i, err in enumerate(stages):
        if err > threshold:
            return i
    return -1

print(canary([0.01, 0.18, 0.0], 0.01, 3))""",
'devops-intro/do-02/t2': """def percentile(values, p):
    if not values:
        return 0
    ordered = sorted(values)
    idx = int(len(ordered) * p / 100)
    return ordered[min(idx, len(ordered) - 1)]

print(percentile([10, 20, 30, 40, 100], 50))""",
'devops-intro/do-02/t3': """def budget(slo, days):
    if days <= 0:
        return 0.0
    return days * 24 * 60 * (100 - slo) / 100

print(budget(99.9, 30))""",
'devops-intro/do-02/exam0': """def release_ok(times, errors, p, max_ms, max_error):
    if times:
        ordered = sorted(times)
        idx = min(int(len(ordered) * p / 100), len(ordered) - 1)
        if ordered[idx] > max_ms:
            return False
    if errors:
        if sum(errors) / len(errors) > max_error:
            return False
    return True

print(release_ok([80, 90, 95, 2100], [0, 0, 0, 1], 50, 200, 0.3))""",

# ===== bigdata-intro =====
'bigdata-intro/bd-01/t1': """def map_step(chunk):
    counts = {}
    for word in chunk.split():
        counts[word] = counts.get(word, 0) + 1
    return counts

print(map_step('a b a'))""",
'bigdata-intro/bd-01/t2': """def reduce_step(partials):
    total = {}
    for part in partials:
        for word, n in part.items():
            total[word] = total.get(word, 0) + n
    return total

print(reduce_step([{'a': 1}, {'a': 2, 'b': 1}]))""",
'bigdata-intro/bd-01/t3': """def skew(sizes):
    if not sizes:
        return 0.0
    average = sum(sizes) / len(sizes)
    if average == 0:
        return 0.0
    return max(sizes) / average

print(skew([10, 10, 10, 10]))""",
'bigdata-intro/bd-01/exam0': """def word_count(chunks):
    total = {}
    for chunk in chunks:
        for word in chunk.split():
            total[word] = total.get(word, 0) + 1
    return total

print(word_count(['a b', 'b c']))""",
'bigdata-intro/bd-02/t1': """def bytes_read(columns, needed, rows):
    width = sum(columns[c] for c in needed if c in columns)
    return width * rows

print(bytes_read({'id': 8, 'сумма': 8, 'текст': 200}, ['сумма'], 1000))""",
'bigdata-intro/bd-02/t2': """def prune(partitions, filters):
    return [p for p in partitions
            if all(p.get(k) == v for k, v in filters.items())]

parts = [{'год': 2024, 'месяц': 1}, {'год': 2025, 'месяц': 1}]
print(prune(parts, {'год': 2025}))""",
'bigdata-intro/bd-02/t3': """def compact(sizes, target):
    batches = []
    acc = 0
    for size in sizes:
        acc += size
        if acc >= target:
            batches.append(acc)
            acc = 0
    if acc:
        batches.append(acc)
    return batches

print(compact([30, 40, 50, 20, 10], 64))""",
'bigdata-intro/bd-02/exam0': """def query_cost(partitions, filters, columns, needed):
    survived = [p for p in partitions
                if all(p.get(k) == v for k, v in filters.items())]
    rows = sum(p['rows'] for p in survived)
    width = sum(columns[c] for c in needed if c in columns)
    return rows * width

parts = [{'год': 2024, 'rows': 1000}, {'год': 2025, 'rows': 2000}]
print(query_cost(parts, {'год': 2025}, {'сумма': 8, 'текст': 200}, ['сумма']))""",

# ===== cloud-intro =====
'cloud-intro/cl-01/t1': """def monthly_cost(machines, price_per_hour):
    return round(machines * price_per_hour * 720, 2)

print(monthly_cost(2, 0.1))""",
'cloud-intro/cl-01/t2': """def needed(rps, per_machine, min_n, max_n):
    raw = -(-rps // per_machine)
    return max(min_n, min(max_n, raw))

print(needed(450, 120, 2, 10))""",
'cloud-intro/cl-01/t3': """def survives(zones, need):
    if not zones:
        return False
    return sum(zones) - max(zones) >= need

print(survives([2, 2, 2], 3))""",
'cloud-intro/cl-01/exam0': """def bill(loads, per_machine, price_per_hour, min_n, max_n):
    total = 0
    for rps in loads:
        raw = -(-rps // per_machine)
        total += max(min_n, min(max_n, raw))
    return round(total * price_per_hour, 2)

print(bill([10, 500, 10], 120, 0.1, 2, 10))""",
'cloud-intro/cl-02/t1': """def biggest_line(usage, prices):
    costs = {k: v * prices[k] for k, v in usage.items() if k in prices}
    if not costs:
        return None
    return max(costs, key=costs.get)

print(biggest_line({'трафик': 20000, 'хранение': 500}, {'трафик': 0.09, 'хранение': 0.02}))""",
'cloud-intro/cl-02/t2': """from math import ceil

def scale(rps, per_machine, low, high):
    need = ceil(rps / per_machine) if rps > 0 else 0
    return max(low, min(need, high))

print(scale(450, 100, 2, 20))""",
'cloud-intro/cl-02/t3': """def survives(layout, needed):
    if not layout:
        return needed <= 0
    return sum(layout.values()) - max(layout.values()) >= needed

print(survives({'a': 4, 'b': 4}, 5))""",
'cloud-intro/cl-02/exam0': """from math import ceil

def day_cost(loads, per_machine, low, high, price):
    total = 0
    for rps in loads:
        need = ceil(rps / per_machine) if rps > 0 else 0
        total += max(low, min(need, high))
    return float(total * price)

print(day_cost([30, 450, 900, 1800], 100, 2, 20, 0.05))""",

# ===== infosec-intro =====
'infosec-intro/is-01/t1': """def top_risk(risks):
    if not risks:
        return None
    return max(risks, key=lambda r: r[1] * r[2])[0]

print(top_risk([('утечка', 0.05, 100), ('фишинг', 0.4, 25)]))""",
'infosec-intro/is-01/t2': """def can(user, action, users, roles):
    role = users.get(user)
    return action in roles.get(role, set())

USERS = {'Азиз': 'редактор'}
ROLES = {'редактор': {'read', 'write'}}
print(can('Азиз', 'write', USERS, ROLES))""",
'infosec-intro/is-01/t3': """def excess(granted, needed):
    return sorted(granted - needed)

print(excess({'read', 'write', 'delete'}, {'read', 'write'}))""",
'infosec-intro/is-01/exam0': """def audit(users, roles, required):
    flagged = []
    for name, role in users.items():
        granted = roles.get(role, set())
        needed = required.get(role, set())
        if granted - needed:
            flagged.append(name)
    return sorted(flagged)

USERS = {'Азиз': 'админ'}
ROLES = {'админ': {'read', 'write', 'delete'}}
NEED = {'админ': {'read', 'write'}}
print(audit(USERS, ROLES, NEED))""",
'infosec-intro/is-02/t1': """def mask(value):
    text = str(value)
    if len(text) <= 4:
        return '*' * len(text)
    return '*' * (len(text) - 4) + text[-4:]

def safe_event(event, secrets):
    return {k: (mask(v) if k in secrets else v) for k, v in event.items()}

print(safe_event({'кто': 'aziz', 'токен': 'abcdefgh'}, {'токен'}))""",
'infosec-intro/is-02/t2': """def bruteforce(log, limit):
    streak = {}
    caught = set()
    for address, success in log:
        if success:
            streak[address] = 0
        else:
            streak[address] = streak.get(address, 0) + 1
            if streak[address] >= limit:
                caught.add(address)
    return sorted(caught)

print(bruteforce([('1.1.1.1', False), ('1.1.1.1', False), ('1.1.1.1', False)], 3))""",
'infosec-intro/is-02/t3': """def is_ours(address, base):
    if '@' not in address:
        return False
    domain = address.rsplit('@', 1)[-1].lower()
    base = base.lower()
    return domain == base or domain.endswith('.' + base)

print(is_ours('support@example.com', 'example.com'))""",
'infosec-intro/is-02/exam0': """def report(log, limit):
    def mask(value):
        text = str(value)
        if len(text) <= 4:
            return '*' * len(text)
        return '*' * (len(text) - 4) + text[-4:]

    streak = {}
    caught = set()
    for event in log:
        address = event['адрес']
        if event['успех']:
            streak[address] = 0
        else:
            streak[address] = streak.get(address, 0) + 1
            if streak[address] >= limit:
                caught.add(address)

    last = None
    if log:
        last = dict(log[-1])
        last['токен'] = mask(last['токен'])

    return {'подозрительные': sorted(caught), 'всего': len(log), 'последнее': last}

log = [{'кто': 'a', 'адрес': '1.1.1.1', 'успех': False, 'токен': 'abcdefgh'}]
print(report(log, 1))""",
# ===== de-tools =====
'de-tools/dt-03/t1': """def upsert(table, rows, key='id'):
    for row in rows:
        if key not in row:
            continue
        table[row[key]] = row
    return table

t = {}
upsert(t, [{'id': 1, 'sum': 100}])
upsert(t, [{'id': 1, 'sum': 100}])
print(len(t))""",
'de-tools/dt-03/t2': """def quality(rows, min_rows):
    problems = []
    if len(rows) < min_rows:
        problems.append('мало строк')
    ids = [r.get('id') for r in rows]
    if len(ids) != len(set(ids)):
        problems.append('дубли')
    if any((r.get('amount') or 0) < 0 for r in rows):
        problems.append('отрицательные')
    return sorted(problems)

print(quality([{'id': 1, 'amount': 100}, {'id': 2, 'amount': 50}], 2))""",
'de-tools/dt-03/t3': """def can_run(deps, state):
    waiting = sorted(d for d in deps if not state.get(d))
    return (not waiting), waiting

print(can_run(['orders', 'customers'], {'orders': True, 'customers': False}))""",
'de-tools/dt-03/exam0': """def run_step(mart, day, rows, deps, state, min_rows):
    waiting = sorted(d for d in deps if not state.get(d))
    if waiting:
        return ('ждём', waiting)

    day_rows = [r for r in rows if r['day'] == day]

    problems = []
    if len(day_rows) < min_rows:
        problems.append('мало строк')
    ids = [r.get('id') for r in day_rows]
    if len(ids) != len(set(ids)):
        problems.append('дубли')
    if any((r.get('amount') or 0) < 0 for r in day_rows):
        problems.append('отрицательные')
    if problems:
        return ('отклонено', sorted(problems))

    mart[day] = {'orders': len(day_rows), 'total': sum(r['amount'] for r in day_rows)}
    return ('готово', [])

mart = {}
rows = [{'day': '2026-08-01', 'id': 1, 'amount': 100},
        {'day': '2026-08-01', 'id': 2, 'amount': 250}]
print(run_step(mart, '2026-08-01', rows, ['orders'], {'orders': True}, 2))
print(mart)""",


# ===== backend-intro be-03 =====
'backend-intro/be-03/t1': """def transfer(accounts, frm, to, amount):
    if amount <= 0:
        return False
    if frm not in accounts or to not in accounts:
        return False
    if accounts[frm] < amount:
        return False
    accounts[frm] -= amount
    accounts[to] += amount
    return True

acc = {'aziz': 500, 'bek': 100}
print(transfer(acc, 'aziz', 'bek', 200), acc)""",
'backend-intro/be-03/t2': """def cached(store, key, now, ttl, compute):
    item = store.get(key)
    if item is not None and now - item[1] < ttl:
        return item[0], True
    value = compute()
    store[key] = (value, now)
    return value, False

s = {}
print(cached(s, 'cats', 0, 10, lambda: 'meow'))
print(cached(s, 'cats', 5, 10, lambda: 'meow'))""",
'backend-intro/be-03/t3': """def work(queue, handler, max_tries):
    done, dead = [], []
    while queue:
        job = queue.pop(0)
        try:
            handler(job)
        except Exception:
            job['tries'] += 1
            if job['tries'] >= max_tries:
                dead.append(job['id'])
            else:
                queue.append(job)
        else:
            done.append(job['id'])
    return done, dead

q = [{'id': 1, 'tries': 0}]
print(work(q, lambda job: None, 3))""",
'backend-intro/be-03/exam0': """def create_order(state, user_id, amount, order_id):
    if order_id in state['orders']:
        return {'status': 200, 'order': order_id}
    if amount <= 0:
        return {'status': 400, 'error': '\u0441\u0443\u043c\u043c\u0430'}
    if state['accounts'].get(user_id, 0) < amount:
        return {'status': 402, 'error': '\u0431\u0430\u043b\u0430\u043d\u0441'}

    state['accounts'][user_id] -= amount
    state['orders'][order_id] = {'user': user_id, 'amount': amount}
    state['queue'].append({'type': 'email', 'order': order_id})
    state['cache'].pop(('orders', user_id), None)
    return {'status': 201, 'order': order_id}

state = {'accounts': {'aziz': 500}, 'orders': {}, 'queue': [], 'cache': {}}
print(create_order(state, 'aziz', 200, 'ord-1'))
print(state)""",

# ===== analytics-intro an-03 =====
'analytics-intro/an-03/t1': """def conversion(events):
    stats = {}
    for e in events:
        g = stats.setdefault(e['group'], [0, 0])
        g[0] += 1
        if e['ordered']:
            g[1] += 1
    return {k: round(v[1] / v[0] * 100, 1) for k, v in stats.items()}

print(conversion([{'group': 'A', 'ordered': True}, {'group': 'A', 'ordered': False}]))""",
'analytics-intro/an-03/t2': """def uplift(a_orders, a_users, b_orders, b_users):
    if a_users == 0 or b_users == 0:
        return None
    ca = a_orders / a_users * 100
    cb = b_orders / b_users * 100
    return {
        'a': round(ca, 1),
        'b': round(cb, 1),
        'diff': round(cb - ca, 1),
        'extra': round(a_users * (cb - ca) / 100),
    }

print(uplift(100, 1000, 120, 1000))""",
'analytics-intro/an-03/t3': """def decide(a_orders, a_users, b_orders, b_users, min_users, min_diff):
    if a_users < min_users or b_users < min_users:
        return '\u043c\u0430\u043b\u043e \u0434\u0430\u043d\u043d\u044b\u0445'
    ca = a_orders / a_users * 100
    cb = b_orders / b_users * 100
    if cb - ca >= min_diff:
        return 'B \u043b\u0443\u0447\u0448\u0435'
    if ca - cb >= min_diff:
        return 'A \u043b\u0443\u0447\u0448\u0435'
    return '\u043d\u0435\u0442 \u0440\u0430\u0437\u043d\u0438\u0446\u044b'

print(decide(100, 1000, 130, 1000, 500, 1.0))""",
'analytics-intro/an-03/exam0': """def report(events, min_users, min_diff):
    stats = {}
    for e in events:
        g = stats.setdefault(e['group'], [0, 0])
        g[0] += 1
        if e['ordered']:
            g[1] += 1

    users = {k: v[0] for k, v in stats.items()}
    conv = {k: round(v[1] / v[0] * 100, 1) for k, v in stats.items()}

    if 'A' not in stats or 'B' not in stats:
        verdict = '\u043c\u0430\u043b\u043e \u0434\u0430\u043d\u043d\u044b\u0445'
    elif users['A'] < min_users or users['B'] < min_users:
        verdict = '\u043c\u0430\u043b\u043e \u0434\u0430\u043d\u043d\u044b\u0445'
    else:
        ca = stats['A'][1] / stats['A'][0] * 100
        cb = stats['B'][1] / stats['B'][0] * 100
        if cb - ca >= min_diff:
            verdict = 'B \u043b\u0443\u0447\u0448\u0435'
        elif ca - cb >= min_diff:
            verdict = 'A \u043b\u0443\u0447\u0448\u0435'
        else:
            verdict = '\u043d\u0435\u0442 \u0440\u0430\u0437\u043d\u0438\u0446\u044b'

    return {'users': users, 'conv': conv, 'verdict': verdict}

e = [{'group': 'A', 'ordered': True}, {'group': 'B', 'ordered': False}]
print(report(e, 1, 1.0))""",

    'security-intro/se-03/t1': """def mask_secret(value, keep=2):
    if keep <= 0 or len(value) <= keep * 2:
        return '*' * len(value)
    return value[:keep] + '*' * (len(value) - keep * 2) + value[-keep:]
""",

    'security-intro/se-03/t2': """def risky_packages(installed, fixed):
    def to_tuple(version):
        return tuple(int(part) for part in version.split('.'))

    names = []
    for name, version in installed.items():
        if name not in fixed:
            continue
        if to_tuple(version) < to_tuple(fixed[name]):
            names.append(name)
    return sorted(names)
""",

    'security-intro/se-03/t3': """def allow_request(log, user, now, limit, window):
    marks = [t for t in log.get(user, []) if now - t < window]
    log[user] = marks
    if len(marks) < limit:
        marks.append(now)
        return True
    return False
""",

    'security-intro/se-03/exam0': """def sanitize(record, secret_fields):
    return {k: ('***' if k.lower() in secret_fields else v) for k, v in record.items()}
""",

    'ml-intro/ml-03/t1': """def gini(labels):
    if not labels:
        return 0.0
    total = len(labels)
    result = 1.0
    for value in set(labels):
        p = labels.count(value) / total
        result -= p * p
    return result
""",

    'ml-intro/ml-03/t2': """def kfold_indices(n, k):
    base = n // k
    rest = n % k
    folds = []
    start = 0
    for i in range(k):
        size = base + 1 if i < rest else base
        folds.append(list(range(start, start + size)))
        start += size
    return folds
""",

    'ml-intro/ml-03/t3': """def best_param(results):
    if not results:
        return None

    def mean(param):
        scores = results[param]
        return sum(scores) / len(scores)

    return sorted(results, key=lambda p: (-mean(p), p))[0]
""",

    'ml-intro/ml-03/exam0': """def pick_model(results, min_folds):
    good = {p: s for p, s in results.items() if len(s) >= min_folds}
    if not good:
        return None

    def mean(param):
        scores = good[param]
        return sum(scores) / len(scores)

    best = sorted(good, key=lambda p: (-mean(p), p))[0]
    return (best, round(mean(best), 3))
""",

    'dl-intro/dl-03/t1': """import math


def activate(values, kind):
    if kind == 'relu':
        return [max(0, x) for x in values]
    if kind == 'step':
        return [1 if x >= 0 else 0 for x in values]
    if kind == 'sigmoid':
        return [1 / (1 + math.exp(-x)) for x in values]
    raise ValueError('unknown activation: ' + str(kind))
""",

    'dl-intro/dl-03/t2': """def forward(x, w1, b1, w2, b2):
    hidden = []
    for weights, bias in zip(w1, b1):
        total = sum(wi * xi for wi, xi in zip(weights, x)) + bias
        hidden.append(max(0.0, total))
    return sum(wo * h for wo, h in zip(w2, hidden)) + b2
""",

    'dl-intro/dl-03/t3': """def grad_step(x, y, w1, w2, lr):
    h = w1 * x
    out = w2 * h
    err = out - y
    grad2 = 2 * err * h
    grad1 = 2 * err * w2 * x
    return (w1 - lr * grad1, w2 - lr * grad2)
""",

    'dl-intro/dl-03/exam0': """def train(samples, w1, w2, lr, epochs):
    for _ in range(epochs):
        for x, y in samples:
            h = w1 * x
            out = w2 * h
            err = out - y
            grad2 = 2 * err * h
            grad1 = 2 * err * w2 * x
            w1 -= lr * grad1
            w2 -= lr * grad2
    loss = sum((w1 * w2 * x - y) ** 2 for x, y in samples) / len(samples)
    return (round(w1, 4), round(w2, 4), round(loss, 6))
""",

    'nlp-intro/nl-03/t1': """def ngrams(tokens, n):
    if n < 1 or n > len(tokens):
        return []
    return [tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]
""",

    'nlp-intro/nl-03/t2': """import math


def nearest(word, vectors, top):
    if word not in vectors or top <= 0:
        return []

    def cosine(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(y * y for y in b))
        return dot / (na * nb)

    base = vectors[word]
    pairs = [(other, cosine(base, vec)) for other, vec in vectors.items() if other != word]
    pairs.sort(key=lambda item: (-item[1], item[0]))
    return [other for other, _ in pairs[:top]]
""",

    'nlp-intro/nl-03/t3': """import math


def attention(query, keys, values):
    scores = [sum(q * k for q, k in zip(query, key)) for key in keys]
    top = max(scores)
    exps = [math.exp(s - top) for s in scores]
    total = sum(exps)
    weights = [e / total for e in exps]

    size = len(values[0])
    result = [0.0] * size
    for weight, value in zip(weights, values):
        for j in range(size):
            result[j] += weight * value[j]
    return result
""",

    'nlp-intro/nl-03/exam0': """def predict_next(tokens, context, n):
    wanted = tuple(context)
    counts = {}
    for i in range(len(tokens) - n + 1):
        if tuple(tokens[i:i + n - 1]) == wanted:
            nxt = tokens[i + n - 1]
            counts[nxt] = counts.get(nxt, 0) + 1
    if not counts:
        return None
    return sorted(counts, key=lambda w: (-counts[w], w))[0]
""",
}
