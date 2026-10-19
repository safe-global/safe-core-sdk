---
'@safe-global/api-kit': major
---

Migrate the API Kit from the Safe Transaction Service to the Safe Queue Service.

- `SafeApiKitConfig.txServiceUrl` is renamed to `queueServiceUrl`. The service is multi-chain, so the same URL (`https://api.safe.global/queue` by default) is used for every chain and the `chainId` is sent with each request.
- `proposeTransaction` no longer takes `safeTxHash`, `senderAddress` and `origin`: the service computes the hash and derives the proposer from the signature. It takes `originName`, `originUrl`, `notes` and `nestedTransaction` instead and returns the stored `SafeMultisigTransactionResponse`.
- `confirmTransaction` and `addMessageSignature` return the confirmations added by the request.
- `addMessage` takes `originName`/`originUrl` instead of `safeAppId` and returns the stored message.
- `addSafeDelegate` and `removeSafeDelegate` sign the new EIP-712 typed data of the service, scoped to the chain and the optional Safe. `updateSafeDelegate` is added to edit the label of a delegate.
- `deleteTransaction` is added to delete a pending transaction proposed by the signer.
- `getMultisigTransactions` and `getPendingTransactions` take `executed`, `nonceOrder`, `limit` and `offset` options. `getPendingTransactions` uses the queue endpoint of the service, so the nonce of the Safe is no longer needed.
- Response types follow the Safe Queue Service schema (`SafeMultisigTransactionResponse`, `SafeMultisigConfirmationResponse`, `SafeMessage`, `SafeDelegateResponse`, `SafeServiceInfoResponse`).
- Removed methods without an equivalent in the Safe Queue Service: `getServiceSingletonsInfo`, `decodeData`, `getSafesByOwner`, `getSafesByModule`, `getTransactionConfirmations`, `getSafeInfo`, `getSafeCreationInfo`, `estimateSafeTransaction`, `getIncomingTransactions`, `getModuleTransactions`, `getAllTransactions`, `getNextNonce`, `getTokenList`, `getToken`, `getSafeOperationsByAddress`, `getPendingSafeOperations`, `getSafeOperation`, `addSafeOperation`, `getSafeOperationConfirmations` and `confirmSafeOperation`.
