import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const NPM_CACHE_DIR = path.join(ROOT, '.npm-cache')
const packageJsonPath = path.join(ROOT, 'package.json')
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
const tag = `v${packageJson.version}`
const sharedEnv = {
  ...process.env,
  npm_config_cache: NPM_CACHE_DIR,
}

const run = (command, args) => {
  execFileSync(command, args, {
    cwd: ROOT,
    env: sharedEnv,
    stdio: 'inherit',
  })
}

const output = (command, args) => {
  return execFileSync(command, args, {
    cwd: ROOT,
    env: sharedEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
  }).trim()
}

const worktree = output('git', ['status', '--short'])

if (worktree) {
  console.error('Working tree is not clean. Commit or stash changes before publishing.')
  process.exit(1)
}

const existingTag = output('git', ['tag', '--list', tag])

if (existingTag) {
  console.error(`Tag ${tag} already exists. Bump the version before publishing again.`)
  process.exit(1)
}

await fs.mkdir(NPM_CACHE_DIR, { recursive: true })

console.log(`Publishing ${packageJson.name}@${packageJson.version}`)

run('npm', ['publish'])
run('git', ['tag', tag])
run('git', ['push', 'origin', tag])
