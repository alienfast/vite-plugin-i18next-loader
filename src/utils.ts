import * as fs from 'node:fs'
import * as path from 'node:path'

import globAll from 'glob-all'
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

//https://github.com/jpillora/node-glob-all#usage
export function findAll(globs: string | string[], cwd: string): string[] {
  const globArray = Array.isArray(globs) ? globs : [globs]
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  return globAll.sync(globArray, { cwd, realpath: true }) as string[]
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
