---
'@safe-global/sdk-starter-kit': major
---

Use the new API Kit clients: the transaction and message flows go through `apiKit.queue` (Safe Queue Service) and the SafeOperations through `apiKit.indexer` (Safe Transaction Service).

- New optional `queueServiceUrl` and `decoderServiceUrl` options in the `createSafeClient` config, next to `txServiceUrl`.
- `confirm` checks the threshold of the Safe on-chain to decide whether the transaction can be executed, and reports the transaction as executed when the queue service returns its `txHash`.
- The transactions and messages returned by `getPendingTransactions` and `getPendingMessages` follow the Safe Queue Service schema.
