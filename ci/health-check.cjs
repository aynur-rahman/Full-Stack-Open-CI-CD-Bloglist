const { setTimeout: delay } = require('node:timers/promises')

const checkHealth = async ({ baseUrl, expectedRevision, attempts = 3, interval = 10000, timeout = 10000 }) => {
  if (!Number.isInteger(attempts) || attempts < 1) throw new Error('At least one health check attempt is required')
  if (!Number.isFinite(interval) || interval < 0 || !Number.isInteger(timeout) || timeout < 1) {
    throw new Error('Invalid health check timing')
  }
  const base = new URL(baseUrl)
  if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Invalid application URL')
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const health = await fetch(new URL('/health', base), { signal: AbortSignal.timeout(timeout), redirect: 'error', cache: 'no-store' })
      if (health.status !== 200 || (await health.text()).trim() !== 'ok') throw new Error('Unhealthy response')
      if (expectedRevision) {
        const version = await fetch(new URL('/version', base), { signal: AbortSignal.timeout(timeout), redirect: 'error', cache: 'no-store' })
        if (version.status !== 200 || (await version.text()).trim() !== expectedRevision) throw new Error('Revision not ready')
      }
      return
    } catch {
      if (attempt === attempts) throw new Error('Application did not become healthy at the expected revision')
      await delay(interval)
    }
  }
}

if (require.main === module) {
  checkHealth({ baseUrl: process.env.APP_URL, expectedRevision: process.env.EXPECTED_REVISION })
    .then(() => console.log('Application health check passed'))
    .catch(error => { console.error(error.message); process.exitCode = 1 })
}
module.exports = { checkHealth }
