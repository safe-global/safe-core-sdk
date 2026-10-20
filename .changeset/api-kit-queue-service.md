---
'@safe-global/api-kit': major
---

Use the Safe Queue Service for the off-chain queue and the Safe Decoder Service to decode data. The Safe Transaction Service keeps serving the indexed data.

- New optional `queueServiceUrl` and `decoderServiceUrl` config options next to `txServiceUrl`. Both services are multi-chain, so one URL works for every chain; the `chainId` of the kit is sent with each request. Like `txServiceUrl`, they default to the Safe hosted services, which require the `apiKey`.
- Backed by the Safe Queue Service: `getTransaction`, `getTransactionConfirmations`, `confirmTransaction`, `proposeTransaction`, `getMultisigTransactions`, `getPendingTransactions`, `getMessage`, `getMessages`, `addMessage`, `addMessageSignature`, `getSafeDelegates`, `addSafeDelegate` and `removeSafeDelegate`. The rest of the methods (Safe info and creation, history, transfers, tokens, estimations and SafeOperations) keep using the Safe Transaction Service.
- `decodeData` uses the Safe Decoder Service and returns the `accuracy` of the decoding.
- `proposeTransaction` returns the stored transaction. `safeTxHash` is now optional (the service calculates it and the kit checks it when provided), `senderAddress` is deprecated and ignored, and `origin` is split into the new `originName` and `originUrl` fields. `notes` and `nestedTransaction` are added.
- `confirmTransaction` and `addMessageSignature` return the confirmations added by the request. `addMessage` returns the stored message. `addSafeDelegate` returns the delegate created by the queue service plus the signature sent.
- `addSafeDelegate` and `removeSafeDelegate` sign the EIP-712 typed data of the Safe Queue Service, scoped to the chain and the optional Safe. New `updateSafeDelegate` to edit the label of a delegate and new `deleteTransaction` to delete a pending transaction proposed by the signer.
- `getMultisigTransactions` and `getPendingTransactions` take `executed`, `nonceOrder`, `limit` and `offset` options. The queue service applies the nonce rule of the pending transactions, so `currentNonce` is no longer needed.
- Response types of the queue-backed methods follow the Safe Queue Service schema (`SafeMultisigTransactionResponse`, `SafeMultisigConfirmationResponse`, `SafeMessage`, `SafeDelegateResponse`). Addresses are returned lowercased. `AddMessageOptions.safeAppId` is removed in favour of `originName` and `originUrl`.
