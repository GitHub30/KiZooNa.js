import '../KiZooNa.js'
import assert from 'assert'


describe('DATABASE', function () {
  let db
  before(function () {
    db = new DB({
      url: 'http://localhost/sql-injection.php',
      dsn: 'mysql:host=127.0.0.1;dbname=mariadb',
      username: 'mariadb',
      password: 'mariadb'
    })
  });

  it('Create table', async function () {
    await db.createTable('users', table => {
      table.increments('id')
      table.string('name', 255).nullable().default(null)
      table.integer('age').nullable().default(null)
      table.timestamp('created_at').useCurrent()
      table.timestamp('updated_at').useCurrent().useCurrentOnUpdate()
      table.softDeletes()
    })
  });
  it('Insert', async function () {
    await db.table('users').insert({ name: 'Jake', age: 29 })
  });
  it('Update', async function () {
    await db.table('users').where('name', 'Jake').update({ age: 31 })
  });
  it('Delete', async function () {
    await db.table('users').where('name', 'Jake').delete()
  });
  it('Drop table', async function () {
    await db.dropTable('users')
  });
});
