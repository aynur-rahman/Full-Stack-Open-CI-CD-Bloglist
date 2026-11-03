import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '..', 'client', 'src')
const persistentUserPath = path.join(srcDir, 'services', 'persistentUser.js')

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    if (/\.jsx?$/.test(entry.name)) return [full]
    return []
  })

// exported as either `export const NAME` / `export function NAME`,
// or bundled into an `export default { ... }` / `export { ... }` block
const isExported = (name, source) => {
  if (new RegExp(`export\\s+(?:const|function)\\s+${name}\\b`).test(source)) return true
  const exportBlocks = source.match(/export\s+default\s*\{[\s\S]*?\}|export\s*\{[\s\S]*?\}/g) || []
  return exportBlocks.some(block => new RegExp(`\\b${name}\\b`).test(block))
}

test.describe('logged-in user is persisted through a dedicated service module', () => {
  test('src/services/persistentUser.js exists', () => {
    expect(fs.existsSync(persistentUserPath)).toBe(true)
  })

  test('persistentUser exports getUser, saveUser and removeUser', () => {
    const source = fs.readFileSync(persistentUserPath, 'utf-8')

    expect(isExported('getUser', source)).toBe(true)
    expect(isExported('saveUser', source)).toBe(true)
    expect(isExported('removeUser', source)).toBe(true)
  })

  test('no other file talks to window.localStorage directly - it stays inside persistentUser.js', () => {
    const otherFiles = walk(srcDir)
      .filter(file => file !== persistentUserPath)
      .map(file => ({
        file: path.relative(srcDir, file),
        source: fs.readFileSync(file, 'utf-8'),
      }))

    for (const { file, source } of otherFiles) {
      expect(source, `${file} should not access localStorage directly`).not.toMatch(/localStorage/)
    }
  })

  test('some part of the app reads the logged-in user through getUser', () => {
    const otherFiles = walk(srcDir).filter(file => file !== persistentUserPath)
    const callers = otherFiles.filter(file => /\bgetUser\s*\(/.test(fs.readFileSync(file, 'utf-8')))
    expect(callers.length).toBeGreaterThan(0)
  })

  test('some part of the app saves the logged-in user through saveUser', () => {
    const otherFiles = walk(srcDir).filter(file => file !== persistentUserPath)
    const callers = otherFiles.filter(file => /\bsaveUser\s*\(/.test(fs.readFileSync(file, 'utf-8')))
    expect(callers.length).toBeGreaterThan(0)
  })

  test('some part of the app clears the logged-in user through removeUser on logout', () => {
    const otherFiles = walk(srcDir).filter(file => file !== persistentUserPath)
    const callers = otherFiles.filter(file => /\bremoveUser\s*\(/.test(fs.readFileSync(file, 'utf-8')))
    expect(callers.length).toBeGreaterThan(0)
  })
})
