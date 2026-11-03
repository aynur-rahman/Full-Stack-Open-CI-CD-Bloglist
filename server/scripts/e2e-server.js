// This standalone harness owns its temporary database; the normal app has no reset route.
if (process.env.NODE_ENV !== 'test')
  throw new Error('E2E server requires NODE_ENV=test')
const { randomBytes } = require('node:crypto')
process.env.SECRET = randomBytes(32).toString('hex')
const express = require('express')
const { MongoMemoryServer } = require('mongodb-memory-server')
const database = require('../utils/database')
const Blog = require('../models/blog')
const User = require('../models/user')
const app = require('../app')
let mongo

const main = async () => {
  mongo = await MongoMemoryServer.create()
  await database.connect(mongo.getUri('bloglist_e2e'))
  const serverApp = express()
  serverApp.post('/api/testing/reset', async (request, response) => {
    await Blog.deleteMany({})
    await User.deleteMany({})
    response.status(204).end()
  })
  serverApp.use(app)
  const server = serverApp.listen(3001, '127.0.0.1', () =>
    console.log('Isolated E2E API ready on 3001'),
  )
  let stopping = false
  const stop = () => {
    if (stopping) return
    stopping = true
    server.close(async () => {
      await database.disconnect()
      await mongo.stop()
    })
    server.closeAllConnections()
  }
  server.on('error', async (error) => {
    console.error('E2E server could not start:', error.code)
    await database.disconnect()
    await mongo.stop()
    process.exitCode = 1
  })
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
}
main().catch(async (error) => {
  console.error('E2E setup failed:', error.name)
  await database.disconnect()
  if (mongo) await mongo.stop()
  process.exitCode = 1
})
