import { type UserConfig, defineConfig } from 'vite'
import { sharedConfig } from '../vite.config.mjs'
import packageJson from '../package.json'
import { isDev, r } from './utils'

export interface ContentScriptEntry {
  output: string
  input: string
  name: string
}

export const contentScriptEntries: ContentScriptEntry[] = [
  {
    output: 'index.global.js',
    input: r('src/contentScripts/index.ts'),
    name: packageJson.name,
  },
  {
    output: 'req-proxy.js',
    input: r('src/contentScripts/req-proxy.ts'),
    name: 'reqProxy',
  },
]

export function createContentConfig(entry: ContentScriptEntry, watch?: boolean): UserConfig {
  return defineConfig({
    root: sharedConfig.root,
    resolve: sharedConfig.resolve,
    plugins: [],
    define: {
      '__DEV__': isDev,
      '__NAME__': JSON.stringify(packageJson.name),
      // https://github.com/vitejs/vite/issues/9320
      // https://github.com/vitejs/vite/issues/9186
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
    build: {
      watch: watch
        ? {}
        : undefined,
      outDir: r('extension/dist/contentScripts'),
      cssCodeSplit: false,
      emptyOutDir: false,
      sourcemap: isDev ? 'inline' : false,
      lib: {
        entry: entry.input,
        name: entry.name,
        formats: ['iife'],
      },
      rollupOptions: {
        output: {
          entryFileNames: entry.output,
          extend: true,
        },
      },
    },
  })
}
