const { test } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { checkHealth } = require('./health-check.cjs')
const revision = 'c'.repeat(40)
const options = { baseUrl: 'https://app.example', expectedRevision: revision, attempts: 1, interval: 0, timeout: 100 }
const response = (status, body) => new Response(body, { status })

test('health check verifies both health body and exact deployed commit', async t => {
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, settings) => {
    requests.push(url.pathname)
    assert.equal(settings.redirect, 'error')
    assert.equal(settings.cache, 'no-store')
    assert.ok(settings.signal instanceof AbortSignal)
    return response(200, url.pathname === '/health' ? 'ok\n' : revision)
  })
  await checkHealth(options)
  assert.deepEqual(requests, ['/health', '/version'])
})

test('scheduled check only needs a healthy app, not a particular revision', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url.pathname, '/health')
    return response(200, 'ok')
  })
  await checkHealth({ ...options, expectedRevision: undefined })
  assert.equal(fetch.mock.callCount(), 1)
})

test('old deployment is retried until the expected commit is served', async t => {
  let versions = 0
  const fetch = t.mock.method(globalThis, 'fetch', async url => response(200,
    url.pathname === '/health' ? 'ok' : ++versions === 1 ? 'old-revision' : revision))
  await checkHealth({ ...options, attempts: 2 })
  assert.equal(fetch.mock.callCount(), 4)
})

test('HTTP failures, wrong bodies and wrong revisions fail health verification', async t => {
  for (const [status, healthBody, deployedRevision] of [[503, 'ok', revision], [200, '<html>offline</html>', revision], [200, 'ok', 'old-revision']]) {
    t.mock.method(globalThis, 'fetch', async url => response(url.pathname === '/health' ? status : 200,
      url.pathname === '/health' ? healthBody : deployedRevision))
    await assert.rejects(checkHealth(options), /did not become healthy/)
    t.mock.restoreAll()
  }
})

test('network errors exhaust retries and then fail', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Connection refused') })
  await assert.rejects(checkHealth({ ...options, attempts: 2 }), /did not become healthy/)
  assert.equal(fetch.mock.callCount(), 2)
})

test('invalid URLs or retry settings cannot produce a false success', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('No network call expected'))
  for (const overrides of [{ baseUrl: undefined }, { baseUrl: '' }, { baseUrl: 'not a URL' }, { baseUrl: 'file:///tmp/app' }, { attempts: 0 }, { attempts: -1 }, { attempts: 1.5 }, { interval: -1 }, { timeout: 0 }]) {
    await assert.rejects(checkHealth({ ...options, ...overrides }))
  }
})

test('a real local HTTP outage and redirect are detected', async t => {
  let unhealthy = false
  let redirect = false
  const server = http.createServer((request, result) => {
    if (redirect) result.writeHead(302, { Location: '/healthy-elsewhere' }).end()
    else result.writeHead(unhealthy ? 503 : 200).end('ok')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }))
  const local = { ...options, baseUrl: `http://127.0.0.1:${server.address().port}`, expectedRevision: undefined, timeout: 1000 }
  await checkHealth(local)
  unhealthy = true
  await assert.rejects(checkHealth(local), /did not become healthy/)
  unhealthy = false
  redirect = true
  await assert.rejects(checkHealth(local), /did not become healthy/)
})

test('a hanging local response is bounded by the request timeout', async t => {
  const server = http.createServer(() => {})
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }))
  await assert.rejects(checkHealth({ ...options, baseUrl: `http://127.0.0.1:${server.address().port}`, timeout: 20 }), /did not become healthy/)
})
