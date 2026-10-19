---
'@safe-global/sdk-starter-kit': major
---

Use the Safe Queue Service through the API Kit.

- `txServiceUrl` is renamed to `queueServiceUrl` in the `createSafeClient` config.
- The `safeOperations` extension is removed, since the Safe Queue Service does not store ERC-4337 SafeOperations. Use the `Safe4337Pack` of the Relay Kit directly to send user operations.
- `confirm` checks the threshold of the Safe on-chain to decide whether the transaction can be executed.
