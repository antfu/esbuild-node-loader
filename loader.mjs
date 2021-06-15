import { URL, pathToFileURL, fileURLToPath } from 'url'
import { transformSync } from 'esbuild'
import fs from 'fs'

const baseURL = pathToFileURL(`${process.cwd()}/`).href

const extensionsRegex = /\.ts$/

export function resolve(specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context

  if (extensionsRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href,
    }
  }

  // try resolve `.ts` extension
  let url = new URL(specifier + '.ts', parentURL).href 
  const path = fileURLToPath(url)
  if (fs.existsSync(path)) {
    return {url}
  }

  // Let Node.js handle all other specifiers.
  return defaultResolve(specifier, context, defaultResolve)
}

export function getFormat(url, context, defaultGetFormat) {
  if (extensionsRegex.test(url)) {
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
    const filename = fileURLToPath(url)
    const { code: js, warnings, map: jsSourceMap } = transformSync(source.toString(), {
      sourcefile: filename,
      sourcemap: 'both',
      loader: 'ts',
      target: 'esnext',
      format: format === 'module' ? 'esm' : 'cjs',
    })

    if (warnings && warnings.length > 0) {
      for (const warning of warnings) {
        console.log(warning.location)
        console.log(warning.text)
      }
    }

    return {
      source: js,
    }
  }

  // Let Node.js handle all other sources.
  return defaultTransformSource(source, context, defaultTransformSource)
}
