const db = new DB({
    url: 'http://localhost/sql-injection.php',
    dsn: 'mysql:host=127.0.0.1;dbname=mariadb',
    username: 'mariadb',
    password: 'mariadb',
    debug: true
})

await db.dropTable('users')
await db.createTable('users', table => {
    table.increments('id')
    table.string('name', 255).nullable().default(null)
    table.integer('age').nullable().default(null)
    table.timestamp('created_at').useCurrent()
    table.timestamp('updated_at').useCurrent().useCurrentOnUpdate()
    table.softDeletes()
})

await db.table('users').insert({ name: 'Jake', age: 29 })
await db.table('users').insert({ name: 'Joey', age: 25 })

console.table(await db.table('users').get())

await new Promise(resolve => setTimeout(resolve, 3000))

await db.table('users').where('name', 'Jake').update({ age: 31 })

console.table(await db.table('users').get())

await db.table('users').where('name', 'Jake').delete()

console.table(await db.table('users').get())


console.table(await db.query('SHOW TABLES'))
console.table(await db.table('aaa').first())

console.table(await db.table('mysql.user').select('Host').select('User').where('User', 'root').where('max_questions', '<', 30).orderByDesc('Password').offset(1).limit(10).get())
console.table(await db.table('mysql.user').distinct().get())
console.log(await db.table('mysql.user').where('User', 'root').value('Host'))
await db.table('users').where('name', 'John').orWhere('name', 'Mike').get()
await db.table('users').whereIn('name', ['John', 'Mike']).get()
await db.table('users').whereNotIn('name', ['John', 'Mike']).get()
await db.table('users').whereNull('name').get()
await db.table('users').whereNotNull('name').get()
await db.table('users').whereBetween('age', [10, 30]).get()
await db.table('users').find(3)
await db.table('users').pluck('title')
await db.table('users').pluck('title', 'name')
await db.table('users').count()
await db.table('orders').max('price')
await db.table('orders').avg('price')
await db.table('users').where('name', 'John').exists()
await db.table('users').where('name', 'John').doesntExist()
await db.table('users').insert({ name: 'Jake', age: 25 })
await db.table('users').where('name', 'John').update({ age: 27 })
await db.table('users').where('name', 'John').delete()