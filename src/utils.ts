import * as fs from 'node:fs'
import * as path from 'node:path'

import { globSync, IgnoreLike } from 'glob'
import * as yaml from 'js-yaml'

// don't export these from index so the external types are cleaner
export const virtualModuleId = 'virtual:i18next-loader'
export const resolvedVirtualModuleId = '\0' + virtualModuleId

export function jsNormalizedLang(lang: string) {
  return lang.replace(/-/g, '_')
}

export function enumerateLangs(dir: string) {
  return fs.readdirSync(dir).filter(function (file) {
    return fs.statSync(path.join(dir, file)).isDirectory()
  })
}

// https://github.com/isaacs/node-glob
export function findAll(
  pattern: string | string[],
  cwd: string,
  ignore?: string | string[] | IgnoreLike,
): string[] {
  // remove this exclusion check late, say 12/2025, but need to remind users of the change to glob and exclusions
  if (typeof pattern === 'string' && pattern.includes('!')) {
    throw new Error('Exclusions are not supported in pattern. Use the `ignore` option instead.')
  }
  // now throw error for arrays
  if (Array.isArray(pattern)) {
    for (const p of pattern) {
      if (p.includes('!')) {
        throw new Error('Exclusions are not supported in pattern. Use the `ignore` option instead.')
      }
    }
  }

  const result = globSync(pattern, { cwd, absolute: true, realpath: true, ignore })
  return result
}

export function resolvePaths(paths: string[], cwd: string) {
  return paths.map((override) => {
    if (path.isAbsolute(override)) {
      return override
    } else {
      return path.join(cwd, override)
    }
  })
}

export function assertExistence(paths: string[]) {
  for (const dir of paths) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Directory does not exist: ${dir}`)
    }
  }
}

export function loadAndParse(langFile: string) {
  const fileContent = String(fs.readFileSync(langFile))
  const extname = path.extname(langFile)
  let parsedContent: string
  if (extname === '.yaml' || extname === '.yml') {
    parsedContent = yaml.load(fileContent) as string
  } else {
    parsedContent = JSON.parse(fileContent) as string
  }
  return parsedContent
}
