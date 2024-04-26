class DB {
    constructor(config) {
        this.config = config;
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
        sql +=  ` ${this.select_list ? this.select_list.join(', ') : '*'}`
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

        this.select_list = null
        this.table_name = null
        this.where_list = null
        this.group_by_list = null
        this.order_by_list = null
        this._limit = null
        this._offset = null

        return this.query(sql)
    }

    async first() {
        this.limit(1)
        return this.get().then(rows => rows[0])
    }

    async value(column) {
        return this.first().then(row => row[column])
    }

    async insert($data) {
        const values = Object.values($data)
        this.query(`INSERT INTO ${this.table_name} (${Object.keys($data).join(', ')}) VALUES (${new Array(values.length).fill('?').join(', ')})`, values)
        this.table_name = null
        return this
    }

    async insertGetId($data) {
        const values = Object.values($data)
        await this.query(`INSERT INTO ${this.table_name} (${Object.keys($data).join(', ')}) VALUES (${new Array(values.length).fill('?').join(', ')})`, values)
        this.table_name = null
        return this
    }

    async update($data) {
        const where_string = this.where_list ? ` WHERE ` + this.where_list.map(({ column, operator, value }) => `${column} ${operator} ${JSON.stringify(value).replaceAll("\"", "'")}`).join(' AND ') : ''
        await this.query(`UPDATE ${this.table_name} SET ${Object.keys($data).map(column => column + ' = ?').join(', ')}${where_string}`, Object.values($data))
        this.table_name = null
        this.where_list = null
        return this
    }

    async delete() {
        const where_string = this.where_list ? ` WHERE ` + this.where_list.map(({ column, operator, value }) => `${column} ${operator} ${JSON.stringify(value).replaceAll("\"", "'")}`).join(' AND ') : ''
        await this.query(`DELETE FROM ${this.table_name}${where_string}`)
        this.table_name = null
        this.where_list = null
        return this
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
        const response = await fetch(url)
        const result = await response.json()
        if (!response.ok) {
            console.log(result)
        }
        return result
    }

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
        for(const column of this.columns) {
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
        for(const column of this.columns.filter(({autoIncrement}) => autoIncrement)) {
            columns.push(`  PRIMARY KEY (${column.name})`)
        }
        return `CREATE TABLE IF NOT EXISTS ${this.name} (\n${columns.join(',\n')}\n)`
    }
}

if (typeof global === 'object') global.DB = DB
if (typeof global === 'object') global.Table = Table
