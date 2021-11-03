import { URL, pathToFileURL, fileURLToPath } from 'url'
import fs from 'fs'
import { transformSync } from 'esbuild'
import { createMatchPath, loadConfig } from 'tsconfig-paths'

const baseURL = pathToFileURL(`${process.cwd()}/`).href
const isWindows = process.platform === 'win32'

const extensionsRegex = /\.(m?tsx?|json)$/
const excludeRegex = /^\w+:/
const tsExtensions = ['.mts', '.ts', '.cts', '.tsx'] // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html
const jsExtensions = ['.mjs', '.js', '.cjs', '.jsx']
const extensions = [...tsExtensions, ...jsExtensions]

const tsconfig = loadConfig()

const matchPath = tsconfig.resultType === 'success' ? createMatchPath(tsconfig.absoluteBaseUrl, tsconfig.paths) : undefined

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

export const tryPathWithExtensions = (path) => {
  for (const ext of extensions) {
    const p = `${path}${ext}`
    if (fs.existsSync(p))
      return p
  }
  return null
}

export function resolve(specifier, context, defaultResolve) {
  // baseUrl & paths takes the highest precedence, as TypeScript behaves.
  if (matchPath) {
    const nodePath = matchPath(specifier, undefined, undefined, extensions)

    if (nodePath) {
      const foundPath = tryPathWithExtensions(nodePath)
      return {
        url: pathToFileURL(foundPath).href,
        format: extensionsRegex.test(foundPath) && 'module',
      }
    }
  }

  const { parentURL = baseURL } = context
  const url = new URL(specifier, parentURL)
  if (extensionsRegex.test(url.pathname))
    return { url: url.href, format: 'module' }

  // ignore `data:` and `node:` prefix etc.
  if (!excludeRegex.test(specifier)) {
    // Try to resolve extension
    const path = fileURLToPath(url.href)
    const foundPath = tryPathWithExtensions(path)
    if (foundPath) {
      url.pathname = foundPath
      return {
        url: url.href,
        format: extensionsRegex.test(url.pathname) && 'module',
      }
    }
  }

  // Let Node.js handle all other specifiers.
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
