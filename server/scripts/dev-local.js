require('dotenv').config({ quiet: true })
const { MongoMemoryServer } = require('mongodb-memory-server')
const fs = require('node:fs/promises')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { randomBytes } = require('node:crypto')

const main = async () => {
  const dbPath = path.join(__dirname, '..', '.local-mongo')
  await fs.mkdir(dbPath, { recursive: true })
  const mongo = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger', dbName: 'bloglist' },
  })
  const child = spawn(process.execPath, ['--watch', 'index.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      MONGODB_URI: mongo.getUri('bloglist'),
      SECRET: process.env.SECRET || randomBytes(32).toString('hex'),
    },
    stdio: 'inherit',
  })
  const stop = () => child.kill('SIGTERM')
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  child.once('exit', async (code) => {
    await mongo.stop()
    process.exitCode = code || 0
  })
}

main().catch((error) => {
  console.error('Local database could not start:', error.name)
  process.exitCode = 1
})
