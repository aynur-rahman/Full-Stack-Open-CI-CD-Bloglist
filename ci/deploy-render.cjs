const { checkHealth } = require('./health-check.cjs')

const deploy = async ({ hookUrl, appUrl, revision, attempts = 60, interval = 10000 }) => {
  if (!/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('A complete commit SHA is required')
  const hook = new URL(hookUrl)
  const app = new URL(appUrl)
  if (hook.protocol !== 'https:' || app.protocol !== 'https:') throw new Error('Deployment requires HTTPS URLs')
  hook.searchParams.set('ref', revision)
  const response = await fetch(hook, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000) })
  if (![200, 202].includes(response.status)) throw new Error(`Deploy hook failed with status ${response.status}`)
  await checkHealth({ baseUrl: app.href, expectedRevision: revision, attempts, interval })
}

if (require.main === module) {
  deploy({ hookUrl: process.env.RENDER_DEPLOY_HOOK, appUrl: process.env.APP_URL, revision: process.env.GITHUB_SHA })
    .then(() => console.log('Deployment is healthy at the requested commit'))
    .catch(() => { console.error('Deployment failed; inspect the provider logs and configuration.'); process.exitCode = 1 })
}
module.exports = { deploy }
