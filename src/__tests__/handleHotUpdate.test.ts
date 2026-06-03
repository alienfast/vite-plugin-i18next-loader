import * as path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import factory from '../index.js'
import { resolvedVirtualModuleId } from '../utils.js'

const absoluteLocalesDir = path.join(__dirname, './data/basic-app-yaml/locales')

function makeMockServer() {
  const fakeModule = { id: resolvedVirtualModuleId }
  return {
    moduleGraph: {
      getModuleById: vi.fn().mockReturnValue(fakeModule),
    },
    reloadModule: vi.fn().mockResolvedValue(undefined),
  }
}

describe('handleHotUpdate', () => {
  it.concurrent('reloads the virtual module when a locale file is edited and paths are absolute', async () => {
    const plugin = factory({ paths: [absoluteLocalesDir] }) as any
    const server = makeMockServer()
    const changedFile = path.join(absoluteLocalesDir, 'en/main.yaml')

    await plugin.handleHotUpdate({ file: changedFile, server })

    expect(server.reloadModule).toHaveBeenCalledTimes(1)
  })

  it.concurrent('reloads the virtual module when a locale file is edited and paths are relative to cwd', async () => {
    const relativeFromCwd = path.relative(process.cwd(), absoluteLocalesDir)
    const plugin = factory({ paths: [relativeFromCwd] }) as any
    const server = makeMockServer()
    const changedFile = path.join(absoluteLocalesDir, 'en/main.yaml')

    await plugin.handleHotUpdate({ file: changedFile, server })

    expect(server.reloadModule).toHaveBeenCalledTimes(1)
  })

  it.concurrent('ignores files outside the configured paths', async () => {
    const plugin = factory({ paths: [absoluteLocalesDir] }) as any
    const server = makeMockServer()
    const changedFile = '/tmp/some/other/locale.yaml'

    await plugin.handleHotUpdate({ file: changedFile, server })

    expect(server.reloadModule).not.toHaveBeenCalled()
  })

  it.concurrent('ignores files whose extension is not json/yml/yaml', async () => {
    const plugin = factory({ paths: [absoluteLocalesDir] }) as any
    const server = makeMockServer()
    const changedFile = path.join(absoluteLocalesDir, 'en/main.txt')

    await plugin.handleHotUpdate({ file: changedFile, server })

    expect(server.reloadModule).not.toHaveBeenCalled()
  })
})
