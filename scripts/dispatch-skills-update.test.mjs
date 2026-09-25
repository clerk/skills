import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { dispatchSkillsUpdate } from './dispatch-skills-update.mjs'

const sha = 'a'.repeat(40)

test('sends the exact skills SHA to all three receivers', async () => {
  const requests = []
  const results = await dispatchSkillsUpdate({
    sha,
    token: 'test-token',
    fetchImpl: async (url, options) => {
      requests.push({ url, options })
      return { status: 204 }
    }
  })

  assert.deepEqual(
    requests.map(({ url }) => url),
    ['clerk', 'dashboard', 'clerk-evals'].map((repo) => `https://api.github.com/repos/clerk/${repo}/dispatches`)
  )
  for (const { options } of requests) {
    assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), {
      event_type: 'clerk_skills_updated',
      client_payload: { sha }
    })
  }
  assert.ok(results.every(({ error }) => error === null))
})

test('attempts every receiver even when one rejects the dispatch', async () => {
  const attempted = []
  const results = await dispatchSkillsUpdate({
    sha,
    token: 'test-token',
    fetchImpl: async (url) => {
      attempted.push(url)
      return { status: url.includes('/dashboard/') ? 403 : 204 }
    }
  })

  assert.equal(attempted.length, 3)
  assert.deepEqual(results, [
    { repository: 'clerk', error: null },
    { repository: 'dashboard', error: 'GitHub returned HTTP 403' },
    { repository: 'clerk-evals', error: null }
  ])
})

test('records a network error and still attempts the remaining receivers', async () => {
  let attempts = 0
  const results = await dispatchSkillsUpdate({
    sha,
    token: 'test-token',
    fetchImpl: async () => {
      attempts += 1
      if (attempts === 1) throw new Error('network unavailable')
      return { status: 204 }
    }
  })

  assert.equal(attempts, 3)
  assert.equal(results[0].error, 'network unavailable')
  assert.equal(results[1].error, null)
  assert.equal(results[2].error, null)
})

test('refuses to send without a full SHA and automation token', async () => {
  let attempts = 0
  const fetchImpl = async () => {
    attempts += 1
    return { status: 204 }
  }

  await assert.rejects(dispatchSkillsUpdate({ sha: 'main', token: 'test-token', fetchImpl }), /full clerk\/skills commit SHA/)
  await assert.rejects(dispatchSkillsUpdate({ sha, token: '', fetchImpl }), /CLERK_AUTOMATION_TOKEN/)
  assert.equal(attempts, 0)
})

test('exits unsuccessfully when GitHub rejects a dispatch', () => {
  const preload = `data:text/javascript,${encodeURIComponent('globalThis.fetch = async () => ({ status: 403 })')}`
  const script = fileURLToPath(new URL('./dispatch-skills-update.mjs', import.meta.url))
  const result = spawnSync(process.execPath, ['--import', preload, script], {
    encoding: 'utf8',
    env: { SKILLS_SHA: sha, CLERK_AUTOMATION_TOKEN: 'test-token' }
  })

  assert.equal(result.status, 1, result.error?.message ?? result.stderr)
  assert.match(result.stderr, /Dispatch to clerk\/dashboard failed: GitHub returned HTTP 403/)
  assert.doesNotMatch(result.stderr, /test-token/)
})
