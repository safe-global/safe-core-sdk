---
'@safe-global/api-kit': minor
---

Multi-chain requests. The kit has no chain anymore: the `chainId` of the config is removed and each request carries its own chain, through the `chainId` of the method or the EIP-3770 prefix of the address. When both are set they must match.

- `indexerUrls: [{ chainId, url }]` replaces `indexerServiceUrl` and `txServiceUrl`. It sets the Transaction Service URL of some chains, for example self-hosted services; the other chains use the Safe hosted service, which requires the `apiKey`.
- `apiKit.queue`: `chainId` is required in `proposeTransaction`, `deleteTransaction` and `addMessage`. The delegates (`addDelegate`, `updateDelegate`, `removeDelegate`) take `chainId` or `allChains: true`. `getSafeTransactions`, `getMessages` and `getPendingTransactions` accept `chainId`; without a chain, `getSafeTransactions` and `getMessages` return every chain, and `getPendingTransactions` accepts Safes of several chains through their EIP-3770 prefixes.
- `apiKit.indexer`: `chainId` is required in every method, as the last argument or in the options, to select the service of the chain. An EIP-3770 prefix in the addresses must match it. `addSafeOperation` takes it in the props, or from the `SafeOperation`. `apiKit.getIndexerUrls()` returns the Transaction Service URL of every chain the indexer can be used with. Accessing `apiKit.indexer` no longer throws for a missing configuration; its requests do.
- `apiKit.decoder`: `decodeData(data, to, { chainId })`. Without a chain, the contract is looked up on every chain.
