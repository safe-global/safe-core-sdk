# @safe-global/types-kit

## 4.0.1

### Patch Changes

- deploy resolving pnpm workspace

## 4.0.0

### Major Changes

- 69d6047: Remove the `declare module 'abitype'` augmentations that widened `AddressType` to `string`. Consumers that relied on the widened typing will now see the default `0x${string}` `Address` type from `viem`/`abitype` and may need to add their own `abitype` register configuration or narrow address values explicitly.

### Minor Changes

- 69d6047: Migrate the repository from Yarn v1 to pnpm 10.16+. Each package now declares `engines: { node: ">=20", pnpm: ">=10.16" }`, which tightens the supported install matrix: consumers on Node < 20 will see install warnings (or hard failures under `engine-strict`). Internal `semver` and `@types/semver` ranges were bumped to `^7.8.0` / `^7.7.1`, and `testing-kit` now declares `glob` as a direct dependency. Because pnpm no longer hoists transitive dependencies, downstream projects relying on packages that were previously reachable through the Safe SDK's hoisted tree must now declare them explicitly.
- 614242e: Upgrade `viem` from `2.21.8` to `2.52.2` and keep `chainId` as a `bigint` end-to-end.
  - The EIP-712 hashing helpers (`calculateSafeTransactionHash`, `calculateSafeMessageHash`, `preimageSafe*`), the signing path (`SafeProvider`/`generateTypedData`), the relay-kit Safe4337 SafeOperation hashing/signing, and the api-kit delegate signing no longer cast `chainId` to `number`, which lost precision for chain IDs above `Number.MAX_SAFE_INTEGER`. viem 2.23+ accepts a `bigint` `chainId` in the EIP-712 domain, so no workaround is needed.
  - **Type change (`types-kit`):** the `chainId` field on the exported `EIP712TypedDataTx.domain` (was `string`) and `EIP712TypedDataMessage.domain` (was `number`) is now `bigint`, and `TypedDataDomain.chainId` is now `number | bigint`. TypeScript consumers that read or construct these objects expecting `number`/`string` will need to adjust. Hence the `minor` bump for `types-kit` and `protocol-kit`. At runtime, `generateTypedData()` now returns `domain.chainId` as a `bigint`; consumers serializing its output with `JSON.stringify` (e.g. for `eth_signTypedData_v4`) must convert it first.
  - viem 2.52 bundles `abitype` `>=1.2`, so `abitype` is bumped to `^1.2.3` across the affected packages to match viem's version. The SDK's `AddressType: string` override (in `abitype-config.d.ts`) only governs viem's ABI types when the SDK and viem resolve the same `abitype` instance; keeping them aligned preserves the public API on plain `string`, so the address-typed surface is unchanged for consumers.
  - `protocol-kit`'s declaration build now uses `moduleResolution: "bundler"` (viem's documented requirement) so viem/`ox` resolve to their shipped declarations. This is build-internal: emitted `.d.ts` are unchanged and consumers are unaffected.
