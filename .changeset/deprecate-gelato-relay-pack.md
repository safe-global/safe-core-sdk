---
'@safe-global/relay-kit': minor
---

Deprecate the Gelato relay integration. `GelatoRelayPack` will be removed in the next major version of `@safe-global/relay-kit`.

- `GelatoRelayPack` and the `GelatoOptions`, `GelatoEstimateFeeProps`, `GelatoEstimateFeeResult`, `GelatoCreateTransactionProps` and `GelatoExecuteTransactionProps` types are now marked `@deprecated`.
- The `GelatoRelayPack` constructor logs a deprecation notice through `console.warn` once per process. Nothing throws and no behavior changes, so existing code keeps working.
- Migrate to `Safe4337Pack`, which supports both sponsored and ERC-20-paid transaction execution: https://docs.safe.global/sdk/relay-kit/guides/gelato-relay
