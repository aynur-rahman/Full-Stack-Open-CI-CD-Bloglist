process.env.NODE_ENV = 'test'

const { before, after, test } = require('node:test')
const assert = require('node:assert/strict')
const supertest = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const database = require('../utils/database')

const api = supertest(app)
let mongo

before(async () => {
  mongo = await MongoMemoryServer.create()
  await database.connect(mongo.getUri('bloglist_health_test'))
})
after(async () => {
  await database.disconnect()
  if (mongo) await mongo.stop()
})

test('health reports a connected and reachable database without allowing caching', async () => {
  const response = await api
    .get('/health')
    .expect(200)
    .expect('Content-Type', /text\/plain/)
    .expect('Cache-Control', 'no-store')
  assert.equal(response.text, 'ok')
})

test('health probes the database and reports ping failure despite connected state', async (t) => {
  assert.equal(mongoose.connection.readyState, 1)
  const ping = t.mock.fn(async () => {
    throw new Error('database probe failed with private connection details')
  })
  t.mock.method(mongoose.connection.db, 'admin', () => ({ ping }))
  const response = await api.get('/health').expect(503)
  assert.equal(ping.mock.callCount(), 1)
  assert.deepEqual(ping.mock.calls[0].arguments, [{ timeoutMS: 3000 }])
  assert.equal(response.text, 'unavailable')
  assert(!response.text.includes('private'))
})

test('version exposes the deployed revision and prevents stale cache responses', async (t) => {
  const renderRevision = process.env.RENDER_GIT_COMMIT
  const appRevision = process.env.APP_REVISION
  t.after(() => {
    if (renderRevision === undefined) delete process.env.RENDER_GIT_COMMIT
    else process.env.RENDER_GIT_COMMIT = renderRevision
    if (appRevision === undefined) delete process.env.APP_REVISION
    else process.env.APP_REVISION = appRevision
  })
  process.env.RENDER_GIT_COMMIT = 'deployed-revision'
  process.env.APP_REVISION = 'fallback-revision'
  const deployed = await api
    .get('/version')
    .expect(200)
    .expect('Cache-Control', 'no-store')
    .expect('Content-Type', /text\/plain/)
  assert.equal(deployed.text, 'deployed-revision')
  delete process.env.RENDER_GIT_COMMIT
  assert.equal((await api.get('/version').expect(200)).text, 'fallback-revision')
  delete process.env.APP_REVISION
  assert.equal((await api.get('/version').expect(200)).text, 'local')
})

test('the normal application has no test database reset route', async () => {
  const response = await api.post('/api/testing/reset').expect(404)
  assert.equal(response.body.error, 'unknown endpoint')
})

test('health reports 503 when the database is disconnected', async () => {
  await database.disconnect()
  const response = await api
    .get('/health')
    .expect(503)
    .expect('Cache-Control', 'no-store')
  assert.equal(response.text, 'unavailable')
})
