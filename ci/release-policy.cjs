const fs = require('node:fs')
const { execFileSync } = require('node:child_process')

const shouldRelease = (eventName, ref, messages) =>
  eventName === 'push' && ref === 'refs/heads/main' &&
  !messages.some(message => message.includes('#skip'))

const releaseForEvent = (event, eventName, ref, readMessages = range =>
  execFileSync('git', ['log', '--format=%B', range], { encoding: 'utf8' })) => {
  if (event.deleted || eventName !== 'push' || ref !== 'refs/heads/main') return false
  const messages = (event.commits || []).map(commit => commit.message)
  if (event.head_commit) messages.push(event.head_commit.message)
  if (![event.before, event.after].every(sha => /^[a-f0-9]{40}$/.test(sha || ''))) {
    throw new Error('The push event must include complete before and after commit SHAs')
  }
  const range = /^0+$/.test(event.before) ? event.after : `${event.before}..${event.after}`
  messages.push(readMessages(range))
  return shouldRelease(eventName, ref, messages)
}

if (require.main === module) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  const deploy = releaseForEvent(event, process.env.GITHUB_EVENT_NAME, process.env.GITHUB_REF)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `deploy=${deploy}\n`)
}
module.exports = { shouldRelease, releaseForEvent }
