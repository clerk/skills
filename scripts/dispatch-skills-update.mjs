import { pathToFileURL } from 'node:url'

const repositories = ['clerk', 'dashboard', 'clerk-evals']
const eventType = 'clerk_skills_updated'

async function githubError(response) {
  const status = `GitHub returned HTTP ${response.status}`
  try {
    const { message } = JSON.parse(await response.text())
    if (typeof message !== 'string') return status
    const safeMessage = message.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
    return safeMessage ? `${status}: ${safeMessage}` : status
  } catch {
    return status
  }
}

export async function dispatchSkillsUpdate({ sha, token, fetchImpl = fetch }) {
  if (!/^[0-9a-f]{40}$/.test(sha ?? '')) {
    throw new Error('SKILLS_SHA must be a full clerk/skills commit SHA')
  }
  if (!token) {
    throw new Error('CLERK_AUTOMATION_TOKEN is required to dispatch to downstream repositories')
  }

  const results = []
  for (const repository of repositories) {
    try {
      const response = await fetchImpl(`https://api.github.com/repos/clerk/${repository}/dispatches`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ event_type: eventType, client_payload: { sha } })
      })

      results.push({ repository, error: response.status === 204 ? null : await githubError(response) })
    } catch (error) {
      results.push({ repository, error: error instanceof Error ? error.message : String(error) })
    }
  }

  return results
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const results = await dispatchSkillsUpdate({
      sha: process.env.SKILLS_SHA,
      token: process.env.CLERK_AUTOMATION_TOKEN
    })
    for (const { repository, error } of results) {
      if (error) {
        console.error(`::error::Dispatch to clerk/${repository} failed: ${error}`)
      } else {
        console.log(`Dispatched skills update to clerk/${repository}`)
      }
    }
    if (results.some(({ error }) => error)) process.exitCode = 1
  } catch (error) {
    console.error(`::error::${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
