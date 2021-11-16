import { URL, pathToFileURL, fileURLToPath } from 'url'
import fs from 'fs'
import { dirname } from 'path'
import { transformSync, build } from 'esbuild'

const isWindows = process.platform === 'win32'

const extensionsRegex = /\.m?(tsx?|json)$/

async function esbuildResolve(id, dir) {
  let result

  await build({
    stdin: {
      contents: `import ${JSON.stringify(id)}`,
      resolveDir: dir,
    },
    write: false,
    bundle: true,
    treeShaking: false,
    ignoreAnnotations: true,
    platform: 'node',
    plugins: [{
      name: 'resolve',
      setup({ onLoad }) {
        onLoad({ filter: /.*/ }, (args) => {
          result = args.path
          return { contents: '' }
        })
      },
    }],
  })
  return result
}

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

function getTsCompatSpecifier(parentURL, specifier) {
  let tsSpecifier
  let search

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    // Relative import
    const url = new URL(specifier, parentURL)
    tsSpecifier = fileURLToPath(url).replace(/\.tsx?$/, '')
    search = url.search
  }
  else {
    // Bare import
    tsSpecifier = specifier
    search = ''
  }

  return {
    tsSpecifier,
    search,
  }
}

function isValidURL(s) {
  try {
    return !!new URL(s)
  }
  catch (e) {
    if (e instanceof TypeError)
      return false

    throw e
  }
}

export async function resolve(specifier, context, defaultResolve) {
  const {
    parentURL,
  } = context

  let url

  // According to Node's algorithm, we first check if it is a valid URL.
  // When the module is the entry point, node will provides a file URL to it.
  if (isValidURL(specifier)) {
    url = new URL(specifier)
  }
  else {
    // Try to resolve the module according to typescript's algorithm,
    // and construct a valid url.

    const parsed = getTsCompatSpecifier(parentURL, specifier)
    const path = await esbuildResolve(parsed.tsSpecifier, dirname(fileURLToPath(parentURL)))
    if (path) {
      url = pathToFileURL(path)
      url.search = parsed.search
    }
  }

  if (url) {
    // If the resolved file is typescript
    if (extensionsRegex.test(url.pathname)) {
      return {
        url: url.href,
        format: 'module',
      }
    }
    // Else, for other types, use default resolve with the valid path
    return defaultResolve(url.href, context, defaultResolve)
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
