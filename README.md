# KiZooNa.js
HTTP MySQL/SQLite Proxy

```html
<html>

<body>
  <script src="https://github30.github.io/KiZooNa.js/KiZooNa.js"></script>
  <script type=module>
    const db = new DB({
      url: '/sql-injection.php',
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