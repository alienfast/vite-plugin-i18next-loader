# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `vite-plugin-i18next-loader`, a Vite plugin that generates client-bundled i18next locales from JSON/YAML files. The plugin creates a virtual module that provides pre-compiled locale resources, eliminating the need for HTTP requests to load translations.

## Core Architecture

### Main Components

- **`src/index.ts`**: Main plugin factory that implements the Vite plugin interface
  - Handles virtual module resolution (`virtual:i18next-loader`)
  - Manages file watching and HMR for locale files
  - Orchestrates locale loading and bundling
- **`src/utils.ts`**: Core utility functions for file operations
  - File system operations (enumeration, globbing, parsing)
  - Path resolution and validation
  - JSON/YAML content loading and parsing

### Virtual Module System

The plugin creates a virtual Vite module at `virtual:i18next-loader` that:
- Generates both default and named exports for each language
- Handles language code normalization (converts hyphens to underscores for JS identifiers)
- Provides deep-merged locale resources from multiple source directories
- Supports namespace resolution (basename or relative path)

### Key Configuration Options

- **`paths`**: Array of locale directories (ordered least to most specialized for overrides)
- **`namespaceResolution`**: Controls how files are structured in the output ('basename' | 'relativePath')
- **`include`/`ignore`**: Glob patterns for file filtering

## Development Commands

### Build & Development
```bash
yarn build           # Clean and build with tsup (ESM output)
yarn build:ide       # TypeScript compilation for IDE support
yarn clean           # Remove dist directory
yarn test            # Run Vitest test suite
```

### Code Quality
```bash
yarn lint:fix        # Fix ESLint issues with caching
npx @eslint/config-inspector  # View ESLint configuration
```

### Release
```bash
yarn release         # Automated release with auto
```

## Testing

- **Test Framework**: Vitest
- **Test Location**: `src/__tests__/`
- **Test Data**: `src/__tests__/data/` contains sample locale structures
- **Key Test Categories**:
  - Basic locale loading and merging
  - Namespace resolution (basename/relativePath)
  - Path override functionality (library + app locales)

### Running Specific Tests
```bash
yarn test basic.test.ts                    # Single test file
yarn test --reporter=verbose              # Detailed output
yarn test --watch                         # Watch mode
```

## Build Configuration

- **TypeScript**: Uses `@alienfast/tsconfig/nodenext.json` with ESM modules
- **Bundler**: tsup with ESM output, sourcemaps, and minification
- **ESLint**: `@alienfast/eslint-config` with TypeScript ESLint integration
- **Package Manager**: Yarn 4.5.3

## File Structure Patterns

### Locale Directory Structure
```
locales/
├── en/
│   ├── common.json
│   └── feature.yaml
└── de/
    ├── common.json
    └── feature.yaml
```

### Output Pattern (with namespaceResolution: 'basename')
```javascript
export const en = { common: {...}, feature: {...} }
export const de = { common: {...}, feature: {...} }
const resources = { en, de }
export default resources
```

## Hot Module Reloading

The plugin watches locale files (`*.json`, `*.yml`, `*.yaml`) and automatically reloads the virtual module when changes are detected. Files are tracked via `this.addWatchFile()` in the Vite plugin lifecycle.

## Important Implementation Notes

- Uses deep merge strategy for locale overrides (ts-deepmerge)
- Language codes with hyphens are normalized (e.g., `zh-cn` → `zh_cn` for named exports)
- Virtual module ID: `virtual:i18next-loader` → resolved as `\0virtual:i18next-loader`
- Supports both absolute and relative paths in configuration
- File parsing supports both JSON and YAML formats via js-yaml