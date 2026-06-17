---
'@safe-global/protocol-kit': patch
'@safe-global/types-kit': patch
---

Keep `chainId` as a `bigint` in the EIP-712 hashing helpers (`calculateSafeTransactionHash`, `calculateSafeMessageHash`, `preimageSafeTransactionHash`, `preimageSafeMessageHash`) instead of casting it to `number`, which lost precision for chain IDs above `Number.MAX_SAFE_INTEGER`. Because the pinned viem version (2.21.8) drops a `bigint` `chainId` from the EIP-712 domain, `encode.ts` now uses a local `getTypesForEIP712Domain` copy that handles `number | bigint`. This shim can be removed once viem is bumped to >= 2.23.0.
