---
'@safe-global/relay-kit': major
---

Remove the Gelato relay integration, deprecated in the previous minor release.

**Breaking changes**

- `GelatoRelayPack` has been deleted and is no longer exported from `@safe-global/relay-kit`.
- The `GelatoOptions`, `GelatoEstimateFeeProps`, `GelatoEstimateFeeResult`, `GelatoCreateTransactionProps` and `GelatoExecuteTransactionProps` types have been removed.
- The `@gelatonetwork/relay-sdk` dependency has been dropped, so installing `@safe-global/relay-kit` no longer pulls it (or its transitive dependencies) into your tree.

**Migration**

Use `Safe4337Pack`, which covers both flows previously served by `GelatoRelayPack`:

- Fees paid from the Safe balance (`GelatoRelayPack` with `options.isSponsored: false`) → `Safe4337Pack` with an ERC-20 paymaster.
- Sponsored transactions (`GelatoRelayPack` with `options.isSponsored: true` and a 1Balance API key) → `Safe4337Pack` with a verifying paymaster.

The execution model changes from a relayed Safe transaction to an ERC-4337 user operation: instead of calling `getEstimateFee()`, `createTransaction()` and `executeTransaction()` around a `SafeTransaction`, you call `createTransaction()`, `signSafeOperation()` and `executeTransaction()` around a `SafeOperation`, and you configure a bundler (plus an optional paymaster) rather than a relay API key. See https://docs.safe.global/sdk/relay-kit for the guides.

If you still need Gelato relaying, call `@gelatonetwork/relay-sdk` directly or stay on `@safe-global/relay-kit@6`.

`MetaTransactionOptions` and `RelayTransaction` are still exported from `@safe-global/types-kit`, unchanged.
