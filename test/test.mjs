import '../KiZooNa.js'
import assert from 'assert'


describe('DATABASE', () => {
  let db
  before(() => {
    db = new DB({
      url: 'http://localhost/sql-injection.php',
      dsn: 'mysql:host=127.0.0.1;dbname=mariadb',
      username: 'mariadb',
      password: 'mariadb'
    })
  })

  it('Create table', async () => {
    await db.createTable('users', table => {
      table.increments('id')
      table.string('name', 255).nullable().default(null)
      table.integer('age').nullable().default(null)
      table.timestamp('created_at').useCurrent()
      table.timestamp('updated_at').useCurrent().useCurrentOnUpdate()
      table.softDeletes()
    })
  })

  it('Insert', async () => {
    await db.table('users').insert({ name: 'Jake', age: 29 })
  })

  it('Multiple insert', async () => {
    await db.table('users').insert([
      { name: 'Alice', age: 29 },
      { name: 'Bond', age: db.raw('ROUND( RAND() * 50 + 100 )') },
      { name: 'Cargo', age: 31 }
    ])
  })

  it('Update', async () => {
    await db.table('users').where('name', 'Jake').update({ age: 31 })
  })

  it('Delete', async () => {
    await db.table('users').where('name', 'Jake').delete()
  })

  it('Drop table', async () => {
    await db.dropTable('users')
  })
})
