import { URL, pathToFileURL, fileURLToPath } from 'url'
import fs from 'fs'
import { transformSync } from 'esbuild'

const baseURL = pathToFileURL(`${process.cwd()}/`).href
const isWindows = process.platform === 'win32'

const extensionsRegex = /\.(tsx?|json)$/;
const excludeRegex = /^\w+:/

export function resolve(specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context
  const url = new URL(specifier, parentURL)
  if (extensionsRegex.test(url.pathname))
    return { url: url.href }

  // ignore `data:` and `node:` prefix etc.
  if (!excludeRegex.test(specifier)) {
    // Try to resolve extension
    const pathname = url.pathname
    for (const ext of ['ts', 'tsx']) {
      url.pathname = `${pathname}.${ext}`
      const path = fileURLToPath(url.href)
      if (fs.existsSync(path))
        return { url: url.href }
    }
  }

  // Let Node.js handle all other specifiers.
  return defaultResolve(specifier, context, defaultResolve)
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

  if (extensionsRegex.test(url)) {
    let filename = url
    if (!isWindows)
      filename = fileURLToPath(url)

    const { code: js, warnings, map: jsSourceMap } = transformSync(source.toString(), {
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

    return {
      source: js,
    }
  }

  // Let Node.js handle all other sources.
  return defaultTransformSource(source, context, defaultTransformSource)
}
