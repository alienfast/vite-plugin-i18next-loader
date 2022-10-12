import fs from 'node:fs'
import path from 'node:path'

import globAll from 'glob-all'
import yaml from 'js-yaml'

export function enumerateLangs(dir: string) {
  return fs.readdirSync(dir).filter(function (file) {
    return fs.statSync(path.join(dir, file)).isDirectory()
  })
}

//https://github.com/jpillora/node-glob-all#usage
export function findAll(globs: string | string[], cwd: string): string[] {
  const globArray = Array.isArray(globs) ? globs : [globs]
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
    parsedContent = JSON.parse(fileContent)
  }
  return parsedContent
}
