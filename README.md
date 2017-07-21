Convenient way (for me) to test PostgreSQL code.

Instead of

```js
const pg = require('pg')

const pool = new pg.Pool()
...
```

do
```js
const pg = require('pg-scratch')

const pool = new pg.Pool()
```

and you'll get a new, fresh, clean, empty database, every time.

You can pass `{keep: true}` if you want that database left around.

This line will get you in psql looking at the most recent database you left around like this:

```sh
psql -t -c "select concat('psql -d ', datname, '') from pg_database where datname ~ 'scratch_db_.*' order by datname desc limit 1;"
```

This line will drop all those databases:

```psql -t -c "select concat('drop database ', datname, ';') from pg_database where datname ~ 'scratch_db_\d+_\d+';" | psql
```

Hopefully it wont also drop database containing all your important stuff because of some bug in my code.
