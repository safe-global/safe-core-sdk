---
'@safe-global/sdk-starter-kit': major
---

Use the new API Kit clients: the transaction and message flows go through `apiKit.queue` (Safe Queue Service) and the SafeOperations through `apiKit.indexer` (Safe Transaction Service).

- `txServiceUrl` is replaced by `indexerUrls` in the `createSafeClient` config, and the optional `queueServiceUrl` and `decoderServiceUrl` are added. They are the API Kit options, passed through.
- `confirm` checks the threshold of the Safe on-chain to decide whether the transaction can be executed, and reports the transaction as executed when the queue service returns its `txHash`.
- The transactions and messages returned by `getPendingTransactions` and `getPendingMessages` follow the Safe Queue Service schema.
