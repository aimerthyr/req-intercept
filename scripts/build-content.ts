import process from 'node:process'
import { build } from 'vite'
import { contentScriptEntries, createContentConfig } from './content-build-config'

const watch = process.argv.includes('--watch')

async function buildAll() {
  if (watch) {
    await Promise.all(
      contentScriptEntries.map(entry =>
        build(createContentConfig(entry, true)),
      ),
    )
    return
  }

  for (const entry of contentScriptEntries) {
    await build(createContentConfig(entry))
  }
}

buildAll().catch((err) => {
  console.error(err)
  process.exit(1)
})
