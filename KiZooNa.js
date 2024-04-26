class RawString extends String { }

class DB {
    constructor(config) {
        this.config = config;
    }

    raw(string) {
        return new RawString(string)
    }

    select(select) {
        this.select_list = this.select_list ? [...this.select_list, select] : [select]
        return this
    }

    distinct() {
        this._distinct = true
        return this
    }

    table(table) {
        this.table_name = table
        return this
    }

    from(table) {
        return this.table(table)
    }

    where(column, operator, value) {
        if (value === undefined) {
            value = operator
            operator = '='
        }
        this.where_list = this.where_list ? [...this.where_list, { column, operator, value }] : [{ column, operator, value }]
        return this
    }

    groupBy(column) {
        this.group_by_list = this.group_by_list ? [...this.group_by_list, { column }] : [{ column }]
        return this
    }

    orderBy(column) {
        this.order_by_list = this.order_by_list ? [...this.order_by_list, { column }] : [{ column }]
        return this
    }

    orderByDesc(column) {
        this.order_by_list = this.order_by_list ? [...this.order_by_list, { column, direction: 'DESC' }] : [{ column, direction: 'DESC' }]
        return this
    }

    async oldest() {
        this.orderBy('created_at')
        return this
    }

    async latest() {
        this.orderByDesc('created_at')
        return this
    }

    limit(limit) {
        this._limit = limit
        return this
    }

    offset(offset) {
        this._offset = offset
        return this
    }

    async get() {
        let sql = 'SELECT'
        if (this._distinct) {
            sql += ' DISTINCT'
        }
        sql += ` ${this.select_list ? this.select_list.join(', ') : '*'}`
        if (this.table_name) {
            sql += ` FROM  ${this.table_name}`
        }
        if (this.where_list) {
            sql += ` WHERE ` + this.where_list.map(({ column, operator, value }) => `${column} ${operator} ${JSON.stringify(value).replaceAll("\"", "'")}`).join(' AND ')
        }
        if (this.group_by_list) {
            sql += ` GROUP BY ` + this.group_by_list.map(({ column }) => column).join(', ')
        }
        if (this.order_by_list) {
            sql += ` ORDER BY ` + this.order_by_list.map(({ column, direction }) => column + (direction ? ` ${direction}` : '')).join(', ')
        }
        if (this._limit) {
            sql += ` LIMIT ${this._limit}`
        }
        if (this._offset) {
            sql += ` OFFSET ${this._offset}`
        }

        return this.query(sql)
    }

    first() {
        this.fetch = true
        return this.get()
    }

    value(column) {
        this.fetchColumn = true
        if (column && this.select_list) {
            this.fetchColumn_column = this.select_list.indexOf(column)
        }
        return this.get()
    }

    async pluck(value_column, key_column) {
        if (key_column) {
            this.select_list = [key_column, value_column]
            this.fetchAll_mode = 'PDO::FETCH_KEY_PAIR'
        } else {
            this.select_list = [value_column]
            this.fetchAll_mode = 'PDO::FETCH_COLUMN'
        }
        return this.get()
    }

    insert(rows) {
        this.rowCount = true
        if (!Array.isArray(rows)) rows = [rows]
        const placeholder = rows.map(row => `(${Object.values(row).map(value => value instanceof RawString ? value : '?').join(', ')})`).join(', ')
        const values = rows.flatMap(row => Object.values(row).filter(value => !(value instanceof RawString)))
        return this.query(`INSERT INTO ${this.table_name} (${Object.keys(rows[0]).join(', ')}) VALUES ${placeholder}`, values)
    }

    insertGetId(rows) {
        this.lastInsertId = true
        if (!Array.isArray(rows)) rows = [rows]
        const placeholder = rows.map(row => `(${Object.values(row).map(value => value instanceof RawString ? value : '?').join(', ')})`).join(', ')
        const values = rows.flatMap(row => Object.values(row).filter(value => !(value instanceof RawString)))
        return this.query(`INSERT INTO ${this.table_name} (${Object.keys(rows[0]).join(', ')}) VALUES ${placeholder}`, values)
    }

    update($data) {
        this.rowCount = true
        const where_string = this.where_list ? ` WHERE ` + this.where_list.map(({ column, operator, value }) => `${column} ${operator} ${JSON.stringify(value).replaceAll("\"", "'")}`).join(' AND ') : ''
        return this.query(`UPDATE ${this.table_name} SET ${Object.keys($data).map(column => column + ' = ?').join(', ')}${where_string}`, Object.values($data))
    }

    delete() {
        this.rowCount = true
        const where_string = this.where_list ? ` WHERE ` + this.where_list.map(({ column, operator, value }) => `${column} ${operator} ${JSON.stringify(value).replaceAll("\"", "'")}`).join(' AND ') : ''
        return this.query(`DELETE FROM ${this.table_name}${where_string}`)
    }

    async query(query, params) {
        if (this.config.debug) console.log('query:', query, 'params:', params)
        const url = new URL(this.config.url)
        url.searchParams.set('dsn', this.config.dsn)
        url.searchParams.set('username', this.config.username)
        url.searchParams.set('password', this.config.password)
        url.searchParams.set('query', query)
        if (params) {
            url.searchParams.set('params', JSON.stringify(params))
        }
        if (this.lastInsertId) {
            url.searchParams.set('lastInsertId', this.lastInsertId)
        }
        if (this.rowCount) {
            url.searchParams.set('rowCount', this.rowCount)
        }
        if (this.fetch) {
            url.searchParams.set('fetch', this.fetch)
        }
        if (this.fetchColumn) {
            url.searchParams.set('fetchColumn', this.fetchColumn)
        }
        if (this.fetchColumn_column) {
            url.searchParams.set('fetchColumn_column', this.fetchColumn_column)
        }
        if (this.fetchAll_mode) {
            url.searchParams.set('fetchAll_mode', this.fetchAll_mode)
        }
        this.reset()
        const response = await fetch(url)
        const result = await response.json()
        if (!response.ok) {
            console.log(result)
        }
        return result
    }

    reset() {
        this.select_list = null
        this.table_name = null
        this.where_list = null
        this.group_by_list = null
        this.order_by_list = null
        this._limit = null
        this._offset = null
        this.lastInsertId = null
        this.rowCount = null
        this.fetch = null
        this.fetchColumn = null
        this.fetchColumn_column = null
        this.fetchAll_mode = null
    }

    /**
     * @param {string} name 
     * @param {function(Table): void} define_columns 
     * @returns {Promise<Table>}
     */
    async createTable(name, define_columns) {
        const table = new Table(name)
        define_columns(table)
        if (this.config.debug) console.debug({ table })
        await this.query(table.toString())
        return this
    }

    async dropTable(name) {
        await this.query(`DROP TABLE IF EXISTS ${name}`)
        return this
    }
}

class Table {
    columns = []
    constructor(name) {
        this.name = name;
    }
    increments(name) {
        this.columns.push({ name, type: 'INT' })
        this.autoIncrement()
        return this
    }
    string(name, length = 255) {
        this.columns.push({ name, type: `VARCHAR(${length})` })
        return this
    }
    text(name) {
        this.columns.push({ name, type: 'TEXT' })
        return this
    }
    integer(name) {
        this.columns.push({ name, type: 'INT' })
        return this
    }
    timestamp(name) {
        this.columns.push({ name, type: 'TIMESTAMP' })
        return this
    }
    autoIncrement() {
        this.columns.at(-1).autoIncrement = true
        return this
    }
    nullable(nullable = true) {
        this.columns.at(-1).nullable = nullable
        return this
    }
    default(default_value) {
        this.columns.at(-1).default = default_value
        return this
    }
    useCurrent() {
        this.columns.at(-1).default = 'CURRENT_TIMESTAMP'
        return this
    }
    useCurrentOnUpdate() {
        this.columns.at(-1).default_on_update = 'CURRENT_TIMESTAMP'
        return this
    }
    softDeletes() {
        return this
    }
    toString() {
        const columns = []
        for (const column of this.columns) {
            let column_string = `  ${column.name} ${column.type}`
            if (column.nullable === false) {
                column_string += ' NOT NULL'
            }
            if (column.default) {
                column_string += ` DEFAULT ${column.default}`
                if (column.default_on_update) {
                    column_string += ` ON UPDATE ${column.default_on_update}`
                }
            }
            if (column.autoIncrement) {
                column_string += ' AUTO_INCREMENT'
            }
            columns.push(column_string)
        }
        for (const column of this.columns.filter(({ autoIncrement }) => autoIncrement)) {
            columns.push(`  PRIMARY KEY (${column.name})`)
        }
        return `CREATE TABLE IF NOT EXISTS ${this.name} (\n${columns.join(',\n')}\n)`
    }
}

if (typeof global === 'object') global.DB = DB
if (typeof global === 'object') global.Table = Table
