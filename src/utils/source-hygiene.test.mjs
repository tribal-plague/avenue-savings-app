import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('src')
const MOJIBAKE_PATTERNS = [
  new RegExp(`${String.fromCharCode(0x00e2)}[^\\s'")}]*`, 'u'),
  new RegExp(`${String.fromCharCode(0x00c2)}[^\\s'")}]*`, 'u'),
  new RegExp(`${String.fromCharCode(0x00f0)}${String.fromCharCode(0x0178)}[^\\s'")}]*`, 'u'),
]

function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(fullPath)
    return /\.(js|jsx|mjs|css)$/.test(entry.name) ? [fullPath] : []
  })
}

for (const file of listSourceFiles(ROOT)) {
  const content = fs.readFileSync(file, 'utf8')
  for (const pattern of MOJIBAKE_PATTERNS) {
    assert.doesNotMatch(content, pattern, `${path.relative('.', file)} contains mojibake text`)
  }
}

console.log('source hygiene tests passed')
