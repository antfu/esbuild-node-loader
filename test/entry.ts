import assert from 'assert'
import { relative } from 'path'
import { test } from 'uvu'
import { execa } from 'execa'

const cwd = process.cwd()
function relativize(path: string, curCwd = cwd) {
  return `./${relative(curCwd, path)}`
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

test('register mts', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.mts.mts`),
  ])
  assert(stdout === 'hello from mts')
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
    relativize(`${cwd}/test/import-mjs/index.ts`),
  ])
  assert(stdout === 'foo\nnot index\nexport\nhello from d.ts')
})

test('import with query', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.importWithQuery.ts`),
  ])
  assert(stdout === '1\n2')
})

test('import tsx', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.tsxStyle.tsx`),
  ])
  assert(stdout === 'foo:bar')
})

test('import tsx2', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.query2.ts`),
  ])
  assert(stdout === 'foo:bar')
})

test('import json', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`),
    relativize(`${cwd}/test/fixture.json.ts`),
  ])
  assert(stdout === 'esbuild-node-loader')
})

test('tsconfig-paths', async() => {
  const cwd2 = `${cwd}/test/tsconfig-paths`
  const { stdout } = await execa('node', [
    '--experimental-loader',
    relativize(`${cwd}/loader.mjs`, cwd2),
    relativize(`${cwd}/test/tsconfig-paths/src/utils/fixture.ts`, cwd2),
  ], {
    cwd: cwd2,
  })
  assert.equal(stdout, 'foo\nfoo')
})

test.run()
