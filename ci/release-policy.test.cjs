const { test } = require('node:test')
const assert = require('node:assert/strict')
const { shouldRelease, releaseForEvent } = require('./release-policy.cjs')
const before = 'a'.repeat(40)
const after = 'b'.repeat(40)
const event = { before, after, commits: [{ message: 'Improve search' }], head_commit: { message: 'Merge feature' } }

test('only main branch pushes may release', () => {
  assert.equal(shouldRelease('push', 'refs/heads/main', ['Improve search']), true)
  for (const [name, ref] of [['pull_request', 'refs/pull/1/merge'], ['workflow_dispatch', 'refs/heads/main'], ['push', 'refs/heads/feature'], ['push', 'refs/tags/v1.0.0']]) {
    assert.equal(shouldRelease(name, ref, ['Improve search']), false)
  }
})

test('#skip in any commit or multiline commit body prevents release', () => {
  assert.equal(shouldRelease('push', 'refs/heads/main', ['Update app', 'Docs\n\n#skip', 'Merge feature']), false)
  assert.equal(shouldRelease('push', 'refs/heads/main', ['Update app', 'skip without marker']), true)
})

test('complete pushed Git history is checked even when the webhook commit list is truncated', () => {
  let receivedRange
  const release = releaseForEvent(event, 'push', 'refs/heads/main', range => {
    receivedRange = range
    return 'Older commit\n\n#skip\nMerge feature\n'
  })
  assert.equal(receivedRange, `${before}..${after}`)
  assert.equal(release, false)
})

test('normal push releases and initial push does not use a zero SHA range', () => {
  assert.equal(releaseForEvent(event, 'push', 'refs/heads/main', () => 'Improve search'), true)
  const firstPush = { ...event, before: '0'.repeat(40) }
  assert.equal(releaseForEvent(firstPush, 'push', 'refs/heads/main', range => {
    assert.equal(range, after)
    return 'Initial application'
  }), true)
})

test('head commit #skip is honored even without event.commits', () => {
  assert.equal(releaseForEvent({ before, after, head_commit: { message: 'Docs #skip' } }, 'push', 'refs/heads/main', () => ''), false)
})

test('deleted branches and PRs never inspect Git history or release', () => {
  const unexpectedRead = () => assert.fail('Git history must not be inspected')
  assert.equal(releaseForEvent({ deleted: true }, 'push', 'refs/heads/main', unexpectedRead), false)
  assert.equal(releaseForEvent({}, 'pull_request', 'refs/heads/main', unexpectedRead), false)
  assert.equal(releaseForEvent({}, 'push', 'refs/heads/feature', unexpectedRead), false)
})

test('missing Git history and malformed push SHAs fail closed', () => {
  assert.throws(() => releaseForEvent({}, 'push', 'refs/heads/main', () => ''), /complete before and after/)
  assert.throws(() => releaseForEvent(event, 'push', 'refs/heads/main', () => { throw new Error('Git history unavailable') }), /Git history unavailable/)
})
