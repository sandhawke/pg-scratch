Convenient way (for me) to test PostgreSQL code.

Instead of

```js
const pg = require('pg')

const pool = new pg.Pool()
...
await pool.end()
```

do
```js
const pgscr = require('pg-scratch')

const pool = new pgscr.Pool()
...
await pool.end()
```

and you'll get a new, fresh, clean, empty, pure, and beautiful database, every time.

You can pass `{keep: true}` if you want that database left around.  Otherwise it'l be dropped when you call pgscr.end().

This line will get you in psql looking at the most recent scratch database you left around:

```sh
psql -t -c "select concat('psql -d ', datname, '') from pg_database where datname ~ 'scratch_db_.*' order by datname desc limit 1;"
```

To drop all those databases:

```psql -t -c "select concat('drop database ', datname, ';') from pg_database where datname ~ 'scratch_db_\d+_\d+';" | psql
```

Hopefully it wont also drop database containing all your important stuff because of some bug in my code.

Or you can do that in JS like this:

```js
 await pgscratch.cleanup()
```