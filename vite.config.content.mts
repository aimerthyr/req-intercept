import { contentScriptEntries, createContentConfig } from './scripts/content-build-config'

export { contentScriptEntries, createContentConfig } from './scripts/content-build-config'
export type { ContentScriptEntry } from './scripts/content-build-config'

export default createContentConfig(contentScriptEntries[0])
