import { URL, pathToFileURL, fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'
import { transformSync } from 'esbuild'
import typescript from '@rollup/plugin-typescript'
import JoyCon from 'joycon'

const isWindows = process.platform === 'win32'

const extensionsRegex = /\.(m?tsx?|json)$/
const tsconfigPath = new JoyCon({ parseJSON: () => {} }).loadSync(['tsconfig.json']).path
const pluginTypescript = typescript({
  tsconfig: tsconfigPath,
})

function esbuildTransformSync(rawSource, filename, url, format) {
  const {
    code: js,
    warnings,
    map: jsSourceMap,
  } = transformSync(rawSource.toString(), {
    sourcefile: filename,
    sourcemap: 'both',
    loader: new URL(url).pathname.match(extensionsRegex)[1],
    target: `node${process.versions.node}`,
    format: format === 'module' ? 'esm' : 'cjs',
  })

  if (warnings && warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(warning.location)
      console.warn(warning.text)
    }
  }

  return { js, jsSourceMap }
}

function getTsCompatSpecifier(parentPath, specifier) {
  let s

  const url = new URL(`file://${path.join(path.dirname(parentPath), specifier)}`)
  // Relative import
  if (specifier.startsWith('./'))
    s = url.pathname
  else
    s = specifier

  s = s.replace(/\.tsx?$/, '')

  return {
    tsSpecifier: s,
    search: url.search,
  }
}

export async function resolve(specifier, context, defaultResolve) {
  const {
    parentURL,
  } = context

  if (!parentURL) {
    return {
      ...await defaultResolve(specifier, context, defaultResolve),
      format: 'module',
    }
  }

  const parentPath = new URL(parentURL).pathname
  const { tsSpecifier, search } = getTsCompatSpecifier(parentPath, specifier)
  const result = pluginTypescript.resolveId(tsSpecifier, parentPath)
  if (result && extensionsRegex.test(result)) {
    return {
      url: `${pathToFileURL(result).href}${search}`,
      format: 'module',
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
}

// New hook starting from Node v16.12.0
// See: https://github.com/nodejs/node/pull/37468
export function load(url, context, defaultLoad) {
  if (extensionsRegex.test(new URL(url).pathname)) {
    const { format } = context

    let filename = url
    if (!isWindows) filename = fileURLToPath(url)

    const rawSource = fs.readFileSync(new URL(url), { encoding: 'utf8' })
    const { js } = esbuildTransformSync(rawSource, filename, url, format)

    return {
      format: 'module',
      source: js,
    }
  }

  // Let Node.js handle all other format / sources.
  return defaultLoad(url, context, defaultLoad)
}

export function getFormat(url, context, defaultGetFormat) {
  if (extensionsRegex.test(new URL(url).pathname)) {
    return {
      format: 'module',
    }
  }

  // Let Node.js handle all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat)
}

export function transformSource(source, context, defaultTransformSource) {
  const { url, format } = context

  if (extensionsRegex.test(new URL(url).pathname)) {
    let filename = url
    if (!isWindows) filename = fileURLToPath(url)

    const { js } = esbuildTransformSync(source, filename, url, format)

    return {
      source: js,
    }
  }

  // Let Node.js handle all other sources.
  return defaultTransformSource(source, context, defaultTransformSource)
}
