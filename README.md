> [!WARNING]
> Do not use in production environment

# KiZooNa.js
HTTP MySQL/SQLite Proxy

```html
<html>

<body>
  <script src="https://github30.github.io/KiZooNa.js/KiZooNa.js"></script>
  <script type=module>
    const db = new DB({
      url: 'http://localhost/sql-injection.php',
      dsn: 'mysql:host=127.0.0.1;dbname=mariadb',
      username: 'mariadb',
      password: 'mariadb'
    })
    
    await db.createTable('users', table => {
      table.increments('id')
      table.string('name', 255).nullable().default(null)
      table.integer('age').nullable().default(null)
      table.timestamp('created_at').useCurrent()
    })
    
    await db.table('users').insert({ name: 'Jake', age: 29 })
    console.table(await db.table('users').get())

    await db.table('users').where('name', 'Jake').update({ age: 31 })

    await db.table('users').where('name', 'Jake').delete()
  </script>
</body>

</html>
```

# TEST

```bash
node --run test
```

# Usage

```html
<html>

<body>
  <script src="https://github30.github.io/KiZooNa.js/KiZooNa.js"></script>
  <script type=module>
    const db = new DB({
      url: 'http://localhost/sql-injection.php',
      dsn: 'mysql:host=127.0.0.1;dbname=mariadb',
      username: 'mariadb',
      password: 'mariadb'
    })
    console.log(await db.query('SHOW DATABASES'))
    console.log(await db.query('SHOW TABLES'))
    
    await db.createTable('users', table => {
      table.increments('id')
      table.string('name', 255).nullable().default(null)
      table.integer('age').nullable().default(null)
      table.timestamp('created_at').useCurrent()
    })
    
    var lastInsertId = await db.table('users').insertGetId({ name: 'Jake', age: 29 })
    console.table(await db.table('users').get())

    // Multiple insert
    var affectedRows = await db.table('users').insert([
      { name: 'Alice', age: 29 },
      { name: 'Bond', age: db.raw('ROUND( RAND() * 50 + 100 )') },
      { name: 'Cargo', age: 31 }
    ])

    // ['Jake', 'Alice', 'Bond', 'Cargo']
    console.log(await db.table('users').pluck('name'))
    // { 1: 'Jake', 2: 'Alice', 3: 'Bond', 4: 'Cargo' }
    console.log(await db.table('users').pluck('name', 'id'))

    console.log(await db.table('users').count())
    console.log(await db.table('users').max('age'))
    console.log(await db.table('users').min('age'))
    console.log(await db.table('users').avg('age'))
    console.log(await db.table('users').sum('age'))

    console.table(await db.table('users').select('name').get())
    console.table(await db.table('users').limit(3).get())
    console.table(await db.table('users').where('name', 'Cargo').orderBy('age').get())
    console.table(await db.table('users').orderByDesc('name').offset(2).limit(3).get())
    console.table(await db.table('users').groupBy('name').get())

    console.log(await db.table('users').find(3))

    console.log(await db.table('users').first())
    console.log(await db.table('users').where('id', 2).value('age'))
    console.log(await db.table('users').oldest().get())
    console.log(await db.table('users').latest().get())

    var affectedRows = await db.table('users').where('name', 'Jake').update({ age: 31 })

    var affectedRows = await db.table('users').where('name', 'Jake').delete()
    await db.dropTable('users')
  </script>
</body>

</html>
```
