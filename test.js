'use strict'

const pgtemp = require('.')
const tap = require('tap')
const pg = require('pg')

tap.test('create a table', async function (t) {
  const db = new pgtemp.Pool()
  const r1 = await db.query('create table first (id serial)')
  t.equal(r1.command, 'CREATE')
  t.equal(r1.type, undefined)
  db.end()
})

tap.only('transaction', async function (t) {
  const pool = new pgtemp.Pool()
  const client = await pool.connect()
  try {
    await client.query('CREATE TABLE first (id serial, name text)')
    await client.query('BEGIN')
    await client.query("INSERT INTO first (name) VALUES ('alice')")
    const res = await client.query('SELECT * FROM first')
    t.equal(res.rows[0].name, 'alice')
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
  await pool.end()
})

tap.test('keep db around, then cleanup pid', {timeout: 3000}, async function (t) {
  let name1, name2
  {
    const db = new pgtemp.Pool({keep: true})
    const r1 = await db.query('create table first (id serial)')
    t.equal(r1.command, 'CREATE')
    t.equal(r1.type, undefined)
    name1 = db.dbname
    db.end()
  }
  {
    const db = new pgtemp.Pool({keep: true})
    const r1 = await db.query('create table first (id serial)')
    t.equal(r1.command, 'CREATE')
    t.equal(r1.type, undefined)
    name2 = db.dbname
    db.end()
  }

  t.notEqual(name1, name2)

  // they should both exist
  {
    const client = new pg.Client()
    await client.connect()
    const res = await client.query('SELECT datname FROM pg_database WHERE datname=$1', [name1])
    t.equal(res.rowCount, 1)
    const res2 = await client.query('SELECT datname FROM pg_database WHERE datname=$1', [name2])
    t.equal(res2.rowCount, 1)
    await client.end()
  }

  await pgtemp.cleanupThisProcess()

  // they should both not exist
  {
    const client = new pg.Client()
    await client.connect()
    const res = await client.query('SELECT datname FROM pg_database WHERE datname=$1', [name1])
    t.equal(res.rowCount, 0)
    const res2 = await client.query('SELECT datname FROM pg_database WHERE datname=$1', [name2])
    t.equal(res2.rowCount, 0)
    await client.end()
  }
})

tap.test('cleanup test (partial)', async function (t) {
  const client = new pg.Client()
  await client.connect()
  const res1 = await client.query("SELECT datname FROM pg_database WHERE datname ~ 'scratch_db_.*'")
  if (res1.rowCount > 0) console.log('there were leftover tables to cleanup:', res1.rows)
  await pgtemp.cleanup()
  const res2 = await client.query("SELECT datname FROM pg_database WHERE datname ~ 'scratch_db_.*'")
  t.equal(res2.rowCount, 0)
  await client.end()
})
