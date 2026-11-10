// see docs: https://abitype.dev/config
// This override is intentionally kept out of index.ts so it does NOT leak
// into consumers' type environments. TypeScript does not re-emit .d.ts input
// files, so this file is only active during the SDK's own compilation.
//
// COUPLED TO VIEM: keep this package's `abitype` dependency on the same version
// that `viem` bundles. This `AddressType: string` override only governs viem's
// ABI types when both packages resolve a single, shared `abitype` instance. If
// they diverge (e.g. viem bumps abitype but this package doesn't), the override
// stops reaching viem's types, address args silently revert to `0x${string}`,
// and every viem call site needs an `asAddress` cast again. Bump them together.
import 'abitype'
declare module 'abitype' {
  export interface Register {
    AddressType: string
  }
}
