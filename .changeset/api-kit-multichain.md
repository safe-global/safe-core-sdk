---
'@safe-global/api-kit': minor
---

Multi-chain requests. The `chainId` of the config is now optional and only sets the default chain of the requests. Every method that depends on the chain accepts its own `chainId`, which takes precedence over the EIP-3770 prefix of the address and over the `chainId` of the kit. `forChain(chainId)` returns a kit with the same configuration and another default chain.

- `apiKit.queue`: `chainId` in `proposeTransaction`, `deleteTransaction`, `addMessage`, `addDelegate`, `updateDelegate`, `removeDelegate`, `getPendingTransactions`, `getSafeTransactions` and `getMessages`. Without a chain, `getSafeTransactions` and `getMessages` return every chain and the other methods throw. `getPendingTransactions` accepts Safes of several chains through their EIP-3770 prefixes.
- `apiKit.indexer`: every method accepts `{ chainId }` as its last argument. Without `indexerServiceUrl`, each request uses the Safe hosted Transaction Service of its chain. A custom `indexerServiceUrl` serves only the `chainId` of the kit and rejects requests for another chain. `addSafeOperation` takes the chain of the `SafeOperation`. Accessing `apiKit.indexer` on a chain without hosted Transaction Service no longer throws; its requests do.
- `apiKit.decoder`: `decodeData(data, to, { chainId })`. Without a chain, the contract is looked up on every chain.

An EIP-3770 prefix now selects the chain of the request instead of having to match the `chainId` of the kit.
