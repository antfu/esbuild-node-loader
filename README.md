# esbuild-node-loader

[![NPM version](https://img.shields.io/npm/v/esbuild-node-loader?color=a1b858&label=)](https://www.npmjs.com/package/esbuild-node-loader)

Transpile TypeScript to ESM with [Node.js loader hooks](https://nodejs.org/api/esm.html#esm_transpiler_loader) on the fly.

Inspired by [`esbuild-register`](https://github.com/egoist/esbuild-register) but for **Node.js ESM** instead of CJS.

## Features

- Supports `.ts`, `.tsx` and `.json`
- Support extension also resolving (can import modules without extension)

## Usage

```bash
npm i esbuild-node-loader -D
```

```bash
node --experimental-loader esbuild-node-loader file.ts
```

Or use with [esmo](https://github.com/antfu/esno):

```bash
npx esmo file.ts
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021 [Anthony Fu](https://github.com/antfu)
