const { test } = require('node:test')
const assert = require('node:assert/strict')
const { deploy } = require('./deploy-render.cjs')
const revision = 'd'.repeat(40)
const options = { hookUrl: 'https://api.render.com/deploy/srv-example?key=example', appUrl: 'https://app.example', revision, attempts: 1, interval: 0 }

test('deploys exactly the tested SHA and then checks its health and version', async t => {
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, settings) => {
    requests.push(url.pathname)
    if (url.hostname === 'api.render.com') {
      assert.equal(settings.method, 'POST')
      assert.equal(settings.redirect, 'error')
      assert.equal(url.searchParams.get('key'), 'example')
      assert.equal(url.searchParams.get('ref'), revision)
      return new Response('{}', { status: 200 })
    }
    return new Response(url.pathname === '/health' ? 'ok' : revision)
  })
  await deploy(options)
  assert.deepEqual(requests, ['/deploy/srv-example', '/health', '/version'])
})

test('queued Render deployment is accepted but must still serve the requested revision', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.hostname === 'api.render.com') return new Response('{}', { status: 202 })
    return new Response(url.pathname === '/health' ? 'ok' : revision)
  })
  await deploy(options)
})

test('failed hook does not run health polling', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 401 }))
  await assert.rejects(deploy(options), /Deploy hook failed with status 401/)
  assert.equal(fetch.mock.callCount(), 1)
})

test('successful hook with unhealthy app or wrong revision does not count as deployment success', async t => {
  for (const healthy of [false, true]) {
    t.mock.method(globalThis, 'fetch', async url => {
      if (url.hostname === 'api.render.com') return new Response('{}')
      if (url.pathname === '/health') return new Response(healthy ? 'ok' : 'offline')
      return new Response('old-commit')
    })
    await assert.rejects(deploy(options), /did not become healthy/)
    t.mock.restoreAll()
  }
})

test('invalid revision or insecure URL is rejected before any deploy request', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('No deployment request expected'))
  for (const overrides of [{ revision: '' }, { revision: 'main' }, { revision: '123abc' }, { hookUrl: undefined }, { appUrl: undefined }, { hookUrl: 'invalid' }, { appUrl: '' }, { hookUrl: 'http://api.render.com/deploy/example' }, { appUrl: 'http://app.example' }]) {
    await assert.rejects(deploy({ ...options, ...overrides }))
  }
})
