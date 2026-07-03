import type { ProtocolWithReturn } from 'webext-bridge'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'get-page-global-config': ProtocolWithReturn<void, GlobalConfig>
    'get-page-rules': ProtocolWithReturn<void, Rule[]>
  }
}
