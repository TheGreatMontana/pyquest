/* Модуль 9 — Классы и ООП */
COURSE_DATA.m09 = {
  theory: [
    {
      title: '🏗️ Класс — чертёж, объект — изделие',
      blocks: [
        '<p><b>Класс</b> — это чертёж (шаблон), а <b>объект</b> — конкретная вещь, созданная по чертежу. Один класс «Машина» — тысячи разных машин:</p>',
        { run: "class Dog:\n    def bark(self):\n        print('Гав-гав!')\n\nrex = Dog()    # создали объект\nbobik = Dog()  # и ещё один\nrex.bark()\nbobik.bark()" },
        '<p>Функция внутри класса называется <b>методом</b>. Вызывается через точку: <code>объект.метод()</code>. Ты уже пользовался методами: <code>list.append()</code>, <code>str.upper()</code> — всё это ООП!</p>',
      ],
    },
    {
      title: '⚙️ __init__ и self',
      blocks: [
        '<p><code>__init__</code> — специальный метод, который выполняется при создании объекта. В нём задают <b>атрибуты</b> — переменные объекта:</p>',
        { run: "class Player:\n    def __init__(self, name, level):\n        self.name = name\n        self.level = level\n\np1 = Player('Азиз', 7)\np2 = Player('Тимур', 3)\nprint(p1.name, '-', p1.level)\nprint(p2.name, '-', p2.level)" },
        '<p><code>self</code> — это «я сам», ссылка на конкретный объект. <code>self.name = name</code> означает: «запиши имя в ЭТОТ объект». Поэтому у p1 и p2 разные имена.</p>',
      ],
    },
    {
      title: '🎮 Методы работают с атрибутами',
      blocks: [
        '<p>Методы через <code>self</code> читают и меняют атрибуты своего объекта:</p>',
        { run: "class Player:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\n    def take_damage(self, dmg):\n        self.hp -= dmg\n        if self.hp <= 0:\n            print(f'{self.name} пал в бою 💀')\n        else:\n            print(f'{self.name}: осталось {self.hp} HP')\n\nhero = Player('Азиз')\nhero.take_damage(30)\nhero.take_damage(80)" },
        '<p>Заметь: при вызове <code>hero.take_damage(30)</code> параметр <code>self</code> подставляется автоматически — передаёшь только урон.</p>',
      ],
    },
    {
      title: '👨‍👦 Наследование',
      blocks: [
        '<p>Класс может <b>наследовать</b> другой: взять всё его содержимое и добавить своё. Родитель в скобках:</p>',
        { run: "class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def eat(self):\n        print(f'{self.name} ест')\n\nclass Cat(Animal):  # Cat наследует Animal\n    def meow(self):\n        print(f'{self.name}: мяу!')\n\nbarsik = Cat('Барсик')\nbarsik.eat()   # метод родителя работает!\nbarsik.meow()  # и свой тоже" },
        '<p>Наследование экономит код: общее — в родителе, особенное — в наследниках.</p>',
      ],
    },
    {
      title: '🔁 Переопределение и super()',
      blocks: [
        '<p>Наследник может <b>переопределить</b> метод родителя — заменить своим. А <code>super()</code> вызывает родительскую версию:</p>',
        { run: "class Enemy:\n    def __init__(self, hp):\n        self.hp = hp\n\n    def info(self):\n        print(f'Враг: {self.hp} HP')\n\nclass Boss(Enemy):\n    def __init__(self, hp, phase):\n        super().__init__(hp)   # вызвали __init__ родителя\n        self.phase = phase\n\n    def info(self):           # переопределили\n        print(f'БОСС: {self.hp} HP, фаза {self.phase} 👹')\n\nEnemy(50).info()\nBoss(500, 2).info()" },
        '<p>ООП — это способ держать данные и действия над ними вместе. Большие проекты почти всегда построены на классах.</p>',
      ],
    },
  ],

  quiz: [
    { q: 'Каким словом создаётся класс?', options: ['def', 'class', 'object', 'new'], a: 1, explain: 'Классы объявляются словом <code>class</code>.' },
    { q: 'Когда вызывается __init__?', options: ['При каждом вызове метода', 'При создании объекта', 'При удалении объекта', 'Никогда сам'], a: 1, explain: '<code>__init__</code> срабатывает автоматически в момент создания объекта: <code>Player(...)</code>.' },
    { q: 'Что такое self?', options: ['Название класса', 'Ссылка на сам объект', 'Специальная переменная Python', 'Родительский класс'], a: 1, explain: '<code>self</code> — ссылка на конкретный объект, с которым работает метод.' },
    { q: 'Что выведет код?', code: "class Car:\n    def __init__(self, speed):\n        self.speed = speed\n\na = Car(90)\nb = Car(120)\nprint(a.speed)", options: ['90', '120', '90 120', 'Ошибку'], a: 0, explain: 'У каждого объекта свои атрибуты: у <code>a</code> скорость 90.' },
    { q: 'Как создать класс Cat, наследующий Animal?', options: ['class Cat -> Animal:', 'class Cat(Animal):', 'class Animal(Cat):', 'class Cat extends Animal:'], a: 1, explain: 'Родитель указывается в скобках: <code>class Cat(Animal):</code>.' },
    { q: 'Что делает super()?', options: ['Создаёт супер-объект', 'Обращается к родительскому классу', 'Ускоряет код', 'Удаляет класс'], a: 1, explain: '<code>super()</code> даёт доступ к методам родителя, например <code>super().__init__()</code>.' },
    { q: 'Что выведет код?', code: "class A:\n    def hi(self):\n        print('A')\n\nclass B(A):\n    def hi(self):\n        print('B')\n\nB().hi()", options: ['A', 'B', 'A и B', 'Ошибку'], a: 1, explain: 'Метод переопределён в наследнике — выполняется версия класса B.' },
  ],

  tasks: [
    {
      id: 't1', title: 'Класс Hero', brief: '__init__ и атрибуты',
      desc: '<p>Создай класс <code>Hero</code>: в <code>__init__</code> принимает <code>name</code> и <code>power</code>, сохраняет их в атрибуты. Создай героя <code>Hero("Азиз", 95)</code> и выведи: <code>Азиз: сила 95</code></p>',
      starter: 'class Hero:\n    def __init__(self, name, power):\n        # сохрани в self\n        pass\n\nh = Hero("Азиз", 95)\n# выведи f-строку с атрибутами\n',
      tests: "assert h.name == 'Азиз', 'Атрибут h.name должен быть: Азиз (self.name = name)'\nassert h.power == 95, 'Атрибут h.power должен быть 95'\nassert 'Азиз: сила 95' in _stdout, 'Выведи: Азиз: сила 95'",
      hint: 'self.name = name и self.power = power, потом print(f"{h.name}: сила {h.power}")',
    },
    {
      id: 't2', title: 'Копилка', brief: 'Методы меняют состояние',
      desc: '<p>Создай класс <code>Bank</code>: начальный баланс 0, метод <code>add(amount)</code> увеличивает баланс, метод <code>show()</code> возвращает строку <code>Баланс: X</code>. Добавь 150 и 50, выведи результат <code>show()</code>.</p>',
      starter: 'class Bank:\n    def __init__(self):\n        self.balance = 0\n\n    def add(self, amount):\n        pass\n\n    def show(self):\n        pass\n\nb = Bank()\nb.add(150)\nb.add(50)\nprint(b.show())\n',
      tests: "assert b.balance == 200, 'После add(150) и add(50) баланс должен быть 200'\nassert b.show() == 'Баланс: 200', 'show() должен ВОЗВРАЩАТЬ строку: Баланс: 200'\nassert 'Баланс: 200' in _stdout, 'Выведи print(b.show())'",
      hint: 'В add: self.balance += amount. В show: return f"Баланс: {self.balance}"',
    },
    {
      id: 't3', title: 'Боевые классы', brief: 'Наследование',
      desc: '<p>Дан класс <code>Unit</code>. Создай класс <code>Archer</code> (наследует Unit) с методом <code>shoot()</code>, который возвращает <code>name стреляет!</code>. Создай лучника <code>Archer("Леголас")</code>, вызови <code>info()</code> (родительский!) и выведи <code>shoot()</code>.</p>',
      starter: 'class Unit:\n    def __init__(self, name):\n        self.name = name\n\n    def info(self):\n        print(f"Юнит: {self.name}")\n\n# создай класс Archer(Unit) с методом shoot\n\na = Archer("Леголас")\na.info()\nprint(a.shoot())\n',
      tests: "assert isinstance(a, Unit), 'Archer должен наследовать Unit: class Archer(Unit):'\nassert a.shoot() == 'Леголас стреляет!', 'shoot() должен вернуть: Леголас стреляет!'\nassert 'Юнит: Леголас' in _stdout, 'Вызови a.info() - метод достанется от родителя'",
      hint: 'class Archer(Unit): и внутри def shoot(self): return f"{self.name} стреляет!" — __init__ писать не надо, он унаследуется.',
    },
  ],

  exam: {
    time: 600,
    questions: [
      { q: 'Что выведет код?', code: "class Box:\n    def __init__(self, size):\n        self.size = size * 2\n\nb = Box(5)\nprint(b.size)", options: ['5', '10', 'size', 'Ошибку'], a: 1, explain: '' },
      { q: 'Первый параметр любого метода?', options: ['this', 'self', 'obj', 'me'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "class Counter:\n    def __init__(self):\n        self.n = 0\n\n    def up(self):\n        self.n += 1\n\nc = Counter()\nc.up()\nc.up()\nc.up()\nprint(c.n)", options: ['0', '1', '3', 'Ошибку'], a: 2, explain: '' },
      { q: 'Объекты p1 = Player("A") и p2 = Player("B") имеют…', options: ['Общие атрибуты', 'Каждый свои атрибуты', 'Только p1 имеет атрибуты', 'Ошибка — нельзя два объекта'], a: 1, explain: '' },
      { q: 'Что выведет код?', code: "class A:\n    def go(self):\n        return 'едет'\n\nclass B(A):\n    pass\n\nprint(B().go())", options: ['Ошибку', 'None', 'едет', 'go'], a: 2, explain: '' },
      { q: 'Зачем нужен super().__init__(...)?', options: ['Создать новый класс', 'Вызвать конструктор родителя', 'Удалить родителя', 'Это синтаксическая ошибка'], a: 1, explain: '' },
    ],
    task: {
      title: 'RPG-инвентарь',
      desc: '<p>Создай класс <code>Inventory</code>: в <code>__init__</code> — пустой список <code>self.items</code>; метод <code>add(item)</code> добавляет предмет; метод <code>count()</code> возвращает количество. Добавь «меч» и «щит», выведи: <code>Предметов: 2</code></p>',
      starter: 'class Inventory:\n    pass  # напиши класс\n\ninv = Inventory()\ninv.add("меч")\ninv.add("щит")\nprint(f"Предметов: {inv.count()}")\n',
      tests: "assert inv.items == ['меч', 'щит'], 'В items должны быть меч и щит. Сейчас: ' + str(getattr(inv, 'items', 'нет атрибута'))\nassert inv.count() == 2, 'count() должен вернуть 2'\nassert 'Предметов: 2' in _stdout, 'Вывод должен быть: Предметов: 2'",
    },
  },
};
