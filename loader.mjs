import { URL, pathToFileURL, fileURLToPath } from 'url'
import fs from 'fs'
import { transformSync } from 'esbuild'
import semverGte from 'semver/functions/gte.js'

const baseURL = pathToFileURL(`${process.cwd()}/`).href
const isWindows = process.platform === 'win32'

const extensionsRegex = /\.(tsx?|json)$/
const excludeRegex = /^\w+:/

const HAS_UPDATED_HOOKS = semverGte(process.versions.node, '16.12.0')

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

export function resolve(specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context
  const url = new URL(specifier, parentURL)
  if (extensionsRegex.test(url.pathname))
    return { url: url.href, format: 'module' }

  // ignore `data:` and `node:` prefix etc.
  if (!excludeRegex.test(specifier)) {
    // Try to resolve extension
    const pathname = url.pathname
    for (const ext of ['ts', 'tsx']) {
      url.pathname = `${pathname}.${ext}`
      const path = fileURLToPath(url.href)
      if (fs.existsSync(path))
      return {
        url: url.href,
        format: extensionsRegex.test(url.pathname) && 'module'
      }
    }
  }

  // Let Node.js handle all other specifiers.
  return defaultResolve(specifier, context, defaultResolve)
}

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

export const getFormat = HAS_UPDATED_HOOKS
  ? undefined
  : (url, context, defaultGetFormat) => {
      if (extensionsRegex.test(new URL(url).pathname)) {
        return {
          format: 'module',
        }
      }

      // Let Node.js handle all other URLs.
      return defaultGetFormat(url, context, defaultGetFormat)
    }

export const transformSource = HAS_UPDATED_HOOKS
  ? undefined
  : (source, context, defaultTransformSource) => {
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
