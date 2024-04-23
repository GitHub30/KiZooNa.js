import { readFileSync } from 'node:fs';
import assert from 'assert';


console.log(eval(readFileSync(import.meta.dirname + '/../KiZooNa.js').toString()))

console.log(global)

describe('DATABASE', function () {
  let db
  before(function () {
    // db = new DB({
    //   url: 'http://localhost/sql-injection.php',
    //   dsn: 'mysql:host=127.0.0.1;dbname=mariadb',
    //   username: 'mariadb',
    //   password: 'mariadb',
    //   debug: true
    // })
  });

  it('Create table', function () {
    assert.equal([1, 2, 3].indexOf(4), -1);
  });
  it('Insert', function () {
    assert.equal([1, 2, 3].indexOf(4), -1);
  });
  it('Update', function () {
    assert.equal([1, 2, 3].indexOf(4), -1);
  });
  it('Delete', function () {
    assert.equal([1, 2, 3].indexOf(4), -1);
  });
  it('Drop table', function () {
    assert.equal([1, 2, 3].indexOf(4), -1);
  });
});