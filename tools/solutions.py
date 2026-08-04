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
'python-advanced/pa-02/t1': "with open('diary.txt', 'w') as f:\n    f.write('День 13: изучаю файлы\\n')\n    f.write('Завтра финальный босс\\n')\nwith open('diary.txt') as f:\n    print(f.read())",
'python-advanced/pa-02/t2': "items = ['хлеб', 'молоко', 'плов']\nwith open('shop.txt', 'w') as f:\n    for item in items:\n        f.write(item + '\\n')\nwith open('shop.txt') as f:\n    for i, line in enumerate(f, 1):\n        print(f'{i}. {line.strip()}')",
'python-advanced/pa-02/t3': "with open('results.txt', 'w') as f:\n    f.write('level1 250\\nlevel2 300\\nlevel3 320\\n')\n\ntotal = 0\nwith open('results.txt') as f:\n    for line in f:\n        name, score = line.split()\n        total += int(score)\nprint(f'Общий счёт: {total}')",
'python-advanced/pa-02/exam0': "with open('server.log', 'w') as f:\n    f.write('INFO старт\\nERROR сбой сети\\nINFO работаем\\nERROR диск полон\\nINFO стоп\\n')\n\ncount = 0\nwith open('server.log') as f:\n    for line in f:\n        if 'ERROR' in line:\n            count += 1\nprint(f'Ошибок: {count}')",
'python-advanced/final/task0': "for n in range(1, 16):\n    if n % 15 == 0:\n        print('FizzBuzz')\n    elif n % 3 == 0:\n        print('Fizz')\n    elif n % 5 == 0:\n        print('Buzz')\n    else:\n        print(n)",
'python-advanced/final/task1': "class Player:\n    def __init__(self, name):\n        self.name = name\n        self.xp = 0\n\n    def train(self, points):\n        self.xp += points\n\n    def rank(self):\n        if self.xp >= 100:\n            return 'Мастер'\n        return 'Новичок'\n\np = Player('Азиз')\np.train(60)\np.train(60)\nprint(f'{p.name} - {p.rank()}')",

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

# ===== analytics-intro =====
'analytics-intro/an-01/t1': "def median(values):\n    if not values:\n        return 0\n    s = sorted(values)\n    n = len(s)\n    mid = n // 2\n    if n % 2:\n        return s[mid]\n    return (s[mid - 1] + s[mid]) / 2\n\nprint(median([3, 1, 2]))",
'analytics-intro/an-01/t2': "def revenue_by_city(orders):\n    result = {}\n    for city, amount in orders:\n        result[city] = result.get(city, 0) + amount\n    return result\n\nprint(revenue_by_city([('Ташкент', 100), ('Бухара', 50), ('Ташкент', 200)]))",
'analytics-intro/an-01/t3': "def top_share(data):\n    if not data:\n        return 0\n    total = sum(data.values())\n    return round(max(data.values()) / total * 100, 1)\n\nprint(top_share({'A': 300, 'B': 100}))",
'analytics-intro/an-01/exam0': "def report(orders):\n    totals = {}\n    for name, amount in orders:\n        totals[name] = totals.get(name, 0) + amount\n    ordered = sorted(totals.items(), key=lambda x: -x[1])\n    return [f'{name}: {amount}' for name, amount in ordered]\n\nprint(report([('A', 10), ('B', 30), ('A', 5)]))",

# ===== security-intro =====
'security-intro/se-01/t1': "import hashlib\n\ndef hash_password(password):\n    return hashlib.sha256(password.encode()).hexdigest()\n\nprint(hash_password('python123'))",
'security-intro/se-01/t2': "import hashlib\n\ndef hash_password(password):\n    return hashlib.sha256(password.encode()).hexdigest()\n\ndef verify(password, stored_hash):\n    return hash_password(password) == stored_hash\n\nprint(verify('secret1', hash_password('secret1')))",
'security-intro/se-01/t3': "def is_dangerous(query):\n    q = query.lower()\n    return '--' in q or 'drop' in q or \"or '1'='1'\" in q\n\nprint(is_dangerous(\"SELECT * FROM users WHERE name = 'admin' --'\"))",
'security-intro/se-01/exam0': "def build_query(table, column):\n    def safe(name):\n        return all(ch.isalnum() or ch == '_' for ch in name) and len(name) > 0\n    if not safe(table) or not safe(column):\n        return None\n    return f'SELECT * FROM {table} WHERE {column} = ?'\n\nprint(build_query('users', 'id'))",

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
}
