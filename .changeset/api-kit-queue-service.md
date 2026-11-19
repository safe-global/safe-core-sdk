---
'@safe-global/api-kit': major
---

Split the API Kit into one client per Safe service, with one method per endpoint, and make it multi-chain: the kit has no chain anymore, each request carries its own.

```ts
// Before
const apiKit = new SafeApiKit({ chainId: 1n, apiKey })
await apiKit.proposeTransaction({
  safeAddress,
  safeTransactionData,
  safeTxHash,
  senderAddress,
  senderSignature
})
await apiKit.getSafeInfo(safeAddress)

// After
const apiKit = new SafeApiKit({ apiKey })
await apiKit.queue.proposeTransaction({ safeAddress, safeTransactionData, signatures, chainId: 1n })
await apiKit.indexer.getSafeInfo(safeAddress, { chainId: 1n })
```

The chain of a request is the `chainId` passed to the method. An EIP-3770 prefix in an address (`eth:0x…`) is only accepted together with `chainId`, and must match it; without `chainId` the addresses are plain.

The Queue Service and the Decoder Service are new dependencies. Proposals, confirmations, messages and delegates went to the Transaction Service and now go to the Queue Service, `decodeData` goes to the Decoder Service. A self-hosted Transaction Service alone only serves `apiKit.indexer`. `apiKit.queue` and `apiKit.decoder` need the `apiKey` of the Safe hosted services or a self-hosted service in `queueServiceUrl` and `decoderServiceUrl`, and throw when accessed otherwise.

- `apiKit.queue`: Safe Queue Service (`https://api.safe.global/queue/api`, `queueServiceUrl`), the off-chain queue: `proposeTransaction`, `getTransaction`, `getTransactions` (several Safes), `getPendingTransactions`, `getTransactionsBatch`, `getSafeTransactions`, `confirmTransaction`, `deleteTransaction`, `addMessage`, `getMessages`, `getMessage`, `confirmMessage`, `getDelegates`, `addDelegate`, `updateDelegate`, `removeDelegate`, `getServiceInfo`.
  - `chainId` is required in `proposeTransaction`, `deleteTransaction` and `addMessage`. The delegates (`addDelegate`, `updateDelegate`, `removeDelegate`) take `chainId` or `allChains: true`.
  - `getSafeTransactions`, `getMessages`, `getDelegates` and `getTransactions` accept `chainId` (or `chainIds` per Safe in `getTransactions`); without it they return every chain. `getPendingTransactions` requires `chainId`, as the service needs the chain of every Safe; to mix chains use `getTransactions` with `executed: false`.
  - The requests by hash (`getTransaction`, `confirmTransaction`, `getMessage`, `confirmMessage`) don't take a chain.
  - Delegate and deletion requests sign the EIP-712 typed data of the service. Responses follow the queue schema and return addresses lowercased.
- `apiKit.indexer`: Safe Transaction Service, the data indexed from the chain and the ERC-4337 SafeOperations: `getServiceInfo`, `getServiceSingletonsInfo`, `getSafeInfo`, `getSafeCreationInfo`, `getSafesByOwner`, `getSafesByModule`, `estimateSafeTransaction`, `getAllTransactions`, `getIncomingTransactions`, `getModuleTransactions`, `getTokenList`, `getToken` and the six SafeOperation methods.
  - Same endpoints and responses as before, but `chainId` is required in every method, as the last argument or in the options, to select the Transaction Service of the chain. An EIP-3770 prefix in the addresses must match it. `addSafeOperation` takes it in the props, or from the `SafeOperation`.
- `apiKit.decoder`: Safe Decoder Service (`https://api.safe.global/decoder/api`, `decoderServiceUrl`): `decodeData(data, to, { chainId })` (now with the `accuracy` of the decoding; without a chain, the contract is looked up on every chain), `getContracts`, `getContract`, `getServiceInfo`.

Configuration:

- The `chainId` of the config is removed.
- `indexerUrls: [{ chainId, url }]` replaces `txServiceUrl`. It sets the Transaction Service URL of some chains, for example self-hosted services; the other chains use the Safe hosted service, which requires the `apiKey`. More than one URL for the same chain throws. The `chainId` can be a number or a string, as in a JSON config.
- The `apiKey` is only sent to the Safe hosted services. A custom URL in `indexerUrls`, `queueServiceUrl` or `decoderServiceUrl` never receives it.
- `apiKit.getIndexerUrls()` returns the Transaction Service URL of every chain the indexer can be used with: the `indexerUrls` entries and, with an `apiKey`, the Safe hosted service of the other chains.
- Like the Transaction Service URLs, the new `queueServiceUrl` and `decoderServiceUrl` include the `/api` path and default to the Safe hosted services, which require the `apiKey`.
- Each client is created the first time it is used and only checks its own service, so `new SafeApiKit()` no longer throws. A missing API key or service URL throws when `apiKit.queue` or `apiKit.decoder` is accessed, or when `apiKit.indexer` sends a request for a chain without a configured service; the other clients keep working.

Other breaking changes:

- Every method moves under its client.
- `proposeTransaction` takes `signatures` instead of `safeTxHash`, `senderAddress`, `senderSignature` and `origin` (`originName`, `originUrl`, `notes` and `nestedTransaction` are added) and returns the stored transaction.
- `getNextNonce` and `getTransactionConfirmations`, which combined or derived from other calls, are removed.
- `SafeMultisigTransactionResponse` and `SafeMultisigConfirmationResponse` (types-kit) follow the queue schema; the shape indexed by the Transaction Service is now `IndexerMultisigTransactionResponse`.
