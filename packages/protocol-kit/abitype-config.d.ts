// see docs: https://abitype.dev/config
// This override is intentionally kept out of index.ts so it does NOT leak
// into consumers' type environments. TypeScript does not re-emit .d.ts input
// files, so this file is only active during the SDK's own compilation.
import 'abitype'
declare module 'abitype' {
  export interface Register {
    AddressType: string
  }
}
