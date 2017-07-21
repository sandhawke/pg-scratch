'use strict'
/*
  Behaves like pg, for new pg.Pool(), EXCEPT it does everything in a
  new database it creates just for this.  Good for testing.

  Leaves temp DBs around if .end() doesn't get called and allowed to
  complete, or if you use pgtemp.Pool({keep:true})
*/

const pg = require('pg')
const debug = require('debug')('pg-temp-db')
const EventEmitter = require('eventemitter3')

let dbCounter = 1

class Pool extends EventEmitter {
  // { keep: true }  don't even try to delete during .end()
  constructor (opts) {
    super()
    Object.assign(this, opts)
    this.start() // async, but we ignore when it finishes; it'll emit
  }

  async start () {
    this.dbname = 'scratch_db_' + process.pid + '_' + dbCounter++

    debug('creating temp database', this.dbname)

    this.client = new pg.Client()
    await this.client.connect()
    await this.client.query('CREATE DATABASE ' + this.dbname)
    this.pool = pg.Pool({database: this.dbname})
    this.emit('pool-ready')
  }

  async end () {
    await this.poolReady()
    await this.pool.end()
    if (!this.keep) {
      debug('dropping database', this.dbname)
      await this.client.query('DROP DATABASE ' + this.dbname)
    }
    await this.client.end()
    debug('ended')
  }

  async query (...args) {
    await this.poolReady()
    const res = await this.pool.query(...args)
    return res
  }

  // resolves when this.pool is usable
  poolReady () {
    if (this.pool) return Promise.resolve()
    return new Promise((resolve, reject) => {
      this.on('pool-ready', resolve)
      this.on('fatal-error', reject)
    })
  }

  async connect (...args) {
    await this.poolReady()
    const res = await this.pool.connect(...args)
    return res
  }

  static async cleanupThisProcess () {
    return this.cleanup(process.pid)
  }

  static async cleanup (pid = '') {
    const client = new pg.Client()
    await client.connect()
    const res = await client.query('SELECT datname FROM pg_database')
    for (let {datname: dbname} of res.rows) {
      if (dbname.startsWith('scratch_db_' + pid)) {
        debug('DROP DATABASE ' + dbname)
        await client.query('DROP DATABASE ' + dbname)
      }
    }
    await client.end()
  }
}

module.exports.cleanup = Pool.cleanup.bind(Pool)
module.exports.cleanupThisProcess = Pool.cleanupThisProcess.bind(Pool)
module.exports.Pool = Pool
/*

function tempDB () {
  const client = new pg.Client()
  const dbname = 'socdb_temp_' + process.pid + '_' + dbCounter++
  let open = false

  function close () {
    debug('tempDB close called')
    if (open) {
      open = false
      debug('shutting down; dropping database', dbname)
      client.query('DROP DATABASE ' + dbname)
        .then(() => {
          client.end()
          debug('dropped temp database', dbname)
        })
    }
  }

  // can't use process.on('exit', ...) because that's only for sync stuff
  // process.on('SIGINT', close)
  //    eh, postgres complains because pool is using it.

*/
