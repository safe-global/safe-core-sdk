# Safe Service Client

[![NPM Version](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-service-client.svg)](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-service-client)
[![GitHub Release](https://img.shields.io/github/release/gnosis/safe-core-sdk.svg?style=flat)](https://github.com/gnosis/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/gnosis/safe-core-sdk)](https://github.com/gnosis/safe-core-sdk/blob/main/LICENSE.md)

Software development kit that facilitates the interaction with the [Safe Transaction Service API](https://github.com/gnosis/safe-transaction-service).

## Installation

Install the package with yarn or npm:

```bash
yarn install
npm install
```

## Build

Build the package with yarn or npm:

```bash
yarn build
npm build
```

## Getting Started

```js
import SafeServiceClient from '@gnosis.pm/safe-service-client'

const safeService = new SafeServiceClient('https://safe-transaction.gnosis.io')
```

## API Reference

### getServiceInfo

Returns the information and configuration of the service.

```js
const serviceInfo: SafeServiceInfoResponse = await safeService.getServiceInfo()
```

### getServiceMasterCopiesInfo

Returns the list of Safe master copies.

```js
const masterCopies: MasterCopyResponse = await safeService.getServiceMasterCopiesInfo()
```

### decodeData

Decodes the specified Safe transaction data.

```js
const decodedData = await safeService.decodeData(data)
```

### getSafesByOwner

Returns the list of Safes where the address provided is an owner.

```js
const safes: OwnerResponse = await safeService.getSafesByOwner(ownerAddress)
```

### getTransaction

Returns all the information of a Safe transaction.

```js
const tx: SafeMultisigTransactionResponse = await safeService.getTransaction(safeTxHash)
```

### getTransactionConfirmations

Returns the list of confirmations for a given a Safe transaction.

```js
const confirmations: SafeMultisigConfirmationListResponse = await safeService.getTransactionConfirmations(safeTxHash)
```

### confirmTransaction

Adds a confirmation for a Safe transaction.

```js
const signature: SignatureResponse = await safeService.confirmTransaction(safeTxHash, signature)
```

### getSafeInfo

Returns the information and configuration of the provided Safe address.

```js
const safeInfo: SafeInfoResponse = await safeService.getSafeInfo(safeAddress)
```

### getSafeDelegates

Returns the list of delegates for a given Safe address.

```js
const delegates: SafeDelegateListResponse = await safeService.getSafeDelegates(safeAddress)
```

### addSafeDelegate

Adds a new delegate for a given Safe address.

```js
const delegateConfig: SafeDelegateConfig = {
  safe,
  delegate,
  label,
  signer
}
await safeService.addSafeDelegate(delegateConfig)
```

### removeAllSafeDelegates

Removes all delegates for a given Safe address.

```js
await safeService.removeAllSafeDelegates(safeAddress, signer)
```

### removeSafeDelegate

Removes a delegate for a given Safe address.

```js
const delegateConfig: SafeDelegateDeleteConfig = {
  safe,
  delegate,
  signer
}
await safeService.removeSafeDelegate(delegateConfig)
```

### getSafeCreationInfo

Returns the creation information of a Safe.

```js
const safeCreationInfo: SafeCreationInfoResponse = await safeService.getSafeCreationInfo(safeAddress)
```

### estimateSafeTransaction

Estimates the safeTxGas for a given Safe multi-signature transaction.

```js
const estimateTx: SafeMultisigTransactionEstimateResponse = await safeService.estimateSafeTransaction(
  safeAddress,
  safeTransaction
)
```

### proposeTransaction

Creates a new multi-signature transaction and stores it in the Safe Transaction Service.

```js
const transactionConfig: ProposeTransactionProps = {
  safeAddress,
  safeTransaction,
  safeTxHash,
  senderAddress
}
await safeService.proposeTransaction(transactionConfig)
```

### getIncomingTransactions

Returns the history of incoming transactions of a Safe account.

```js
const incomingTxs: TransferListResponse = await safeService.getIncomingTransactions(safeAddress)
```

### getModuleTransactions

Returns the history of module transactions of a Safe account.

```js
const moduleTxs: SafeModuleTransactionListResponse = await safeService.getModuleTransactions(safeAddress)
```

### getMultisigTransactions

Returns the history of multi-signature transactions of a Safe account.

```js
const multisigTxs: SafeMultisigTransactionListResponse = await safeService.getMultisigTransactions(safeAddress)
```

### getPendingTransactions

Returns the list of multi-signature transactions that are waiting for the confirmation of the Safe owners.

```js
const pendingTxs: SafeMultisigTransactionListResponse = await safeService.getPendingTransactions(safeAddress)
```

```js
const pendingTxs: SafeMultisigTransactionListResponse = await safeService.getPendingTransactions(
  safeAddress,
  currentNonce
)
```

### getAllTransactions

Returns a list of transactions for a Safe. The list has different structures depending on the transaction type.

```js
const allTxs: SafeMultisigTransactionListResponse = await safeService.getAllTransactions(safeAddress)
```

```js
const allTxsOptions: AllTransactionsOptions = {
  executed,
  queued,
  trusted
}
const allTxs: SafeMultisigTransactionListResponse = await safeService.getAllTransactions(
  safeAddress,
  allTxsOptions
)
```

### getNextNonce

Returns the right nonce to propose a new transaction right after the last pending transaction.

```js
const nextNonce = await safeService.getNextNonce(safeAddress)
```

### getBalances

Returns the balances for Ether and ERC20 tokens of a Safe.

```js
const balances: SafeBalanceResponse[] = await safeService.getBalances(safeAddress)
```

This method can optionally receive the `options` parameter:

```js
const options: SafeBalancesOptions = {
  excludeSpamTokens  // Optional. Default value is `true`.
}
const balances: SafeBalanceResponse[] = await safeService.getBalances(safeAddress, options)
```

### getUsdBalances

Returns the balances for Ether and ERC20 tokens of a Safe with USD fiat conversion.

```js
const usdBalances: SafeBalanceUsdResponse[] = await safeService.getUsdBalances(safeAddress)
```

This method can optionally receive the `options` parameter:

```js
const options: SafeBalancesUsdOptions = {
  excludeSpamTokens // Optional. Default value is `true`.
}
const usdBalances: SafeBalanceUsdResponse[] = await safeService.getUsdBalances(safeAddress, options)
```

### getCollectibles

Returns the collectives (ERC721 tokens) owned by the given Safe and information about them.

```js
const collectibles: SafeCollectibleResponse[] = await safeService.getCollectibles(safeAddress)
```

This method can optionally receive the `options` parameter:

```js
const options: SafeCollectiblesOptions = {
  excludeSpamTokens // Optional. Default value is `true`.
}
const collectibles: SafeCollectibleResponse[] = await safeService.getCollectibles(safeAddress, options)
```

### getTokenList

Returns the list of all the ERC20 tokens handled by the Safe.

```js
const tokens: TokenInfoListResponse = await safeService.getTokenList()
```

### getToken

Returns the information of a given ERC20 token.

```js
const token: TokenInfoResponse = await safeService.getToken(tokenAddress)
```

## License

This library is released under MIT.

## Contributors

- Germán Martínez ([germartinez](https://github.com/germartinez))
