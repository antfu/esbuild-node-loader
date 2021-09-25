import assert from 'assert'
import { test } from 'uvu'
import execa from 'execa'
import { relative } from 'path'

const cwd = process.cwd()
function relativize(path: string) {
  return `./${relative(cwd, path)}`
}

test('register', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.ts`),
  ])
  assert(stdout === 'text')
})

test('register2', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.arrowFunction.ts`),
  ])
  assert(stdout === 'hello from ts')
})

test('register3', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.import.ts`),
  ])
  assert(stdout === 'export')
})

test('register4', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.optionalChaining.ts`),
  ])
  assert(stdout === 'hello from ts')
})

test('register cjs', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.cjs.ts`),
  ])
  assert(stdout === 'fs imported')
})

test('package type module', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture-type-module/index.js`),
  ])
  assert(stdout === 'foo')
})

test('import type module', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/import-mjs/index.js`),
  ])
  assert(stdout === 'foo')
})

test.run()
