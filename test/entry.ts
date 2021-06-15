import assert from 'assert'
import { test } from 'uvu'
import execa from 'execa'

test('register', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    `${process.cwd()}/loader.mjs`,
    `${process.cwd()}/test/fixture.ts`,
  ])
  assert(stdout === 'text')
})

test('register2', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    `${process.cwd()}/loader.mjs`,
    `${process.cwd()}/test/fixture.arrowFunction.ts`,
  ])
  assert(stdout === 'hello from ts')
})

test('register3', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    `${process.cwd()}/loader.mjs`,
    `${process.cwd()}/test/fixture.import.ts`,
  ])
  assert(stdout === 'export')
})

test('register cjs', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    `${process.cwd()}/loader.mjs`,
    `${process.cwd()}/test/fixture.cjs.ts`,
  ])
  assert(stdout === 'fs imported')
})

test('package type module', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    `${process.cwd()}/loader.mjs`,
    `${process.cwd()}/test/fixture-type-module/index.js`,
  ])
  assert(stdout === 'foo')
})

test('import type module', async() => {
  const { stdout } = await execa('node', [
    '--experimental-loader',
    `${process.cwd()}/loader.mjs`,
    `${process.cwd()}/test/import-mjs/index.js`,
  ])
  assert(stdout === 'foo')
})

test.run()
