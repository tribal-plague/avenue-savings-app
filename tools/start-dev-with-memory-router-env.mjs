import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const root = process.cwd()
const candidateEnvFiles = [
  path.resolve(root, '../vishwa-os/.env.local'),
  path.resolve(root, '../vishwa-os/.env'),
  path.resolve(root, '.env.local'),
  path.resolve(root, '.env'),
]

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return null
  const [name, ...rest] = trimmed.split('=')
  const key = name.trim()
  const value = rest.join('=').trim().replace(/^["']|["']$/g, '')
  return key ? [key, value] : null
}

for (const file of candidateEnvFiles) {
  if (!fs.existsSync(file)) continue
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue
    const [key, value] = parsed
    if (/^(MR_|VOS_|AVENUE_|JWT_SECRET$)/.test(key) && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

const missing = [
  ['MR_COSMOS_ENDPOINT', 'VOS_COSMOS_ENDPOINT'],
  ['MR_COSMOS_KEY', 'VOS_COSMOS_KEY'],
  ['MR_COSMOS_DATABASE', 'VOS_COSMOS_DATABASE'],
  ['MR_COSMOS_USERS_CONTAINER', 'VOS_COSMOS_USERS_CONTAINER'],
  ['MR_JWT_SECRET', 'VOS_JWT_SECRET', 'AVENUE_JWT_SECRET', 'JWT_SECRET'],
].filter((group) => !group.some((key) => process.env[key]))

if (missing.length) {
  console.error('[avenue] Missing Memory Router env values:')
  for (const group of missing) console.error(`- ${group.join(' or ')}`)
  process.exit(1)
}

const child = spawn('npx', ['next', 'dev', ...process.argv.slice(2)], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code) => process.exit(code ?? 0))
