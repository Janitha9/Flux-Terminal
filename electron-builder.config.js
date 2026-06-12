/**
 * @type {import('electron-builder').Configuration}
 *
 * Portable Build Strategy:
 * - Builds two portable folders: win-x64 (64-bit) and win-ia32 (32-bit)
 * - No installer (setup.exe) — just raw app folders
 * - Run `npm run build` to build, then `npm run release:zip` to zip for GitHub
 */
const config = {
  appId: 'com.flux.terminal',
  productName: 'Flux Terminal',
  compression: 'maximum',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    // Vite-compiled frontend (single self-contained HTML file)
    'dist/index.html',
    // Electron main process files
    'electron/**/*',
    // Runtime node_modules needed by the electron main process ONLY.
    // electron-store and its full dependency tree:
    'node_modules/electron-store/**/*',
    'node_modules/conf/**/*',
    'node_modules/type-fest/**/*',
    // conf deps:
    'node_modules/ajv/**/*',
    'node_modules/ajv-formats/**/*',
    'node_modules/atomically/**/*',
    'node_modules/debounce-fn/**/*',
    'node_modules/dot-prop/**/*',
    'node_modules/env-paths/**/*',
    'node_modules/json-schema-typed/**/*',
    'node_modules/semver/**/*',
    'node_modules/uint8array-extras/**/*',
    // ajv deps:
    'node_modules/fast-deep-equal/**/*',
    'node_modules/json-schema-traverse/**/*',
    'node_modules/require-from-string/**/*',
    'node_modules/uri-js/**/*',
    // ajv-formats deps:
    'node_modules/fast-uri/**/*',
    // debounce-fn deps:
    'node_modules/mimic-function/**/*',
    // dot-prop / is-obj:
    'node_modules/is-obj/**/*',
    // graceful-fs (used by atomically):
    'node_modules/graceful-fs/**/*',
    // Explicitly exclude everything else
    '!node_modules/**/{test,tests,__tests__,spec,__mocks__}/**/*',
    '!node_modules/**/{*.md,*.MD,*.txt,*.map,CHANGELOG*,README*,LICENSE*,NOTICE*}',
    '!node_modules/**/.bin/**/*',
  ],
  extraResources: [
    {
      from: "bin",
      to: "bin"
    }
  ],
  win: {
    // Build portable folder only — no installer
    target: [
      { target: 'dir', arch: ['x64'] },
      { target: 'dir', arch: ['ia32'] },
    ],
    icon: 'icons/Flux.png',
    signtoolOptions: {
      sign: null
    }
  },
};

module.exports = config;
