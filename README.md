Convenient way (for me) to test PostgreSQL code.

# Setup

Assumes you've set up the right environment variables to connect to
the PostgreSQL server of your choice.   Something like:

```sh
export PGHOST=localhost PGUSER=alice PGDATABASE=alicedev PGPASSWORD=3e9f98b93350b90dd7ab88c2d94c172b0061c2a8f55b48b1
```

and of course

```sh
npm install --save pg-scratch
```

# Using it

In your test code, instead of

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

and you'll get a new, fresh, clean, empty, pure, and beautiful
database, every time.

# What if I want to look at the scratch database?

You can pass `{keep: true}` if you want that database left around.
Otherwise it'l be dropped when you call pool.end().  Or you can crash
before calling pool.end().

This line will get you in psql looking at the most recent scratch
database you left around:

```sh
$(psql -t -c "select concat('psql -d ', datname, '') from pg_database where datname ~ 'scratch_db_.*' order by datname desc limit 1;")
```

To drop all those databases:

```sh
psql -t -c "select concat('drop database ', datname, ';') from pg_database where datname ~ 'scratch_db_\d+_\d+';" | psql
```

Hopefully it wont also drop database containing all your important
stuff because of some bug in my code.

Or you can do that in JS like this:

```js
 await pgscratch.cleanup()
```

Actually, if you leave a lot of these around, you'll eventually get a
collision, since they're named with the process id.  But you wouldn't
want to be leaving them around like that, I'm pretty sure.