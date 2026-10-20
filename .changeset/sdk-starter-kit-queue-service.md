---
'@safe-global/sdk-starter-kit': major
---

Use the Safe Queue Service through the API Kit.

- New optional `queueServiceUrl` and `decoderServiceUrl` options in the `createSafeClient` config, next to `txServiceUrl`.
- `confirm` checks the threshold of the Safe on-chain to decide whether the transaction can be executed, and reports the transaction as executed when the queue service returns its `txHash`.
- The transactions returned by `getPendingTransactions` follow the Safe Queue Service schema.
