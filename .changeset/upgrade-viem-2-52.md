---
'@safe-global/protocol-kit': minor
'@safe-global/types-kit': minor
'@safe-global/relay-kit': patch
'@safe-global/api-kit': patch
'@safe-global/sdk-starter-kit': patch
'@safe-global/testing-kit': patch
---

Upgrade `viem` from `2.21.8` to `2.52.2` and keep `chainId` as a `bigint` end-to-end.

- The EIP-712 hashing helpers (`calculateSafeTransactionHash`, `calculateSafeMessageHash`, `preimageSafe*`), the signing path (`SafeProvider`/`generateTypedData`), the relay-kit Safe4337 SafeOperation hashing/signing, and the api-kit delegate signing no longer cast `chainId` to `number`, which lost precision for chain IDs above `Number.MAX_SAFE_INTEGER`. viem 2.23+ accepts a `bigint` `chainId` in the EIP-712 domain, so no workaround is needed.
- **Type change (`types-kit`):** the `chainId` field on the exported `EIP712TypedDataTx.domain` (was `string`) and `EIP712TypedDataMessage.domain` (was `number`) is now `bigint`, and `TypedDataDomain.chainId` is now `number | bigint`. TypeScript consumers that read or construct these objects expecting `number`/`string` will need to adjust. Hence the `minor` bump for `types-kit` and `protocol-kit`.
- viem 2.52 bundles `abitype` `>=1.2`, so `abitype` is bumped to `^1.2.3` in `protocol-kit` and `types-kit` to match viem's version. The SDK's `AddressType: string` override (in `abitype-config.d.ts`) only governs viem's ABI types when the SDK and viem resolve the same `abitype` instance; keeping them aligned preserves the public API on plain `string`, so the address-typed surface is unchanged for consumers.
- `protocol-kit`'s declaration build now uses `moduleResolution: "bundler"` (viem's documented requirement) so viem/`ox` resolve to their shipped declarations. This is build-internal: emitted `.d.ts` are unchanged and consumers are unaffected.
