# Safe Core SDK

[![NPM Version](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-core-sdk.svg)](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-core-sdk)
[![GitHub Release](https://img.shields.io/github/release/gnosis/safe-core-sdk.svg?style=flat)](https://github.com/gnosis/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/gnosis/safe-core-sdk)](https://github.com/gnosis/safe-core-sdk/blob/main/LICENSE.md)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/safe-core-sdk/badge.svg?branch=main)](https://coveralls.io/github/gnosis/safe-core-sdk?branch=main)

Software development kit that facilitates the interaction with the [Gnosis Safe contracts](https://github.com/gnosis/safe-contracts).

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

### 1. Set up the SDK using `Ethers` or `Web3`

If the app integrating the SDK is using `Ethers` `v5`, create an instance of the `EthersAdapter`. `owner1` is the Ethereum account we are connecting and the one who will sign the transactions.

```js
import { ethers } from 'ethers'
import { EthersAdapter } from '@gnosis.pm/safe-core-sdk'

const web3Provider = // ...
const provider = new ethers.providers.Web3Provider(web3Provider)
const owner1 = provider.getSigner(0)

const ethAdapterOwner1 = new EthersAdapter({
  ethers,
  signer: owner1
})
```

If the app integrating the SDK is using `Web3` `v1`, create an instance of the `Web3Adapter`.

```js
import Web3 from 'web3'
import { Web3Adapter } from '@gnosis.pm/safe-core-sdk'

const ethAdapterOwner1 = new Web3Adapter({
  web3,
  signerAddress: await owner1.getAddress()
})
```

### 2. Deploy a new Safe

To deploy a new Safe account instantiate the `SafeFactory` class and call the method `deploySafe` with the right params to configure the new Safe. This includes defining the list of owners and the threshold of the Safe. A Safe account with three owners and threshold equal three will be used as the starting point for this example but any Safe configuration is valid.

```js
import { Safe, SafeFactory, SafeAccountConfig } from '@gnosis.pm/safe-core-sdk'

const safeFactory = await SafeFactory.create({ ethAdapter })

const owners = ['0x<address>', '0x<address>', '0x<address>']
const threshold = 3
const safeAccountConfig: SafeAccountConfig = { owners, threshold }

const safeSdk: Safe = await safeFactory.deploySafe(safeAccountConfig)
```

The method `deploySafe` executes a transaction from `owner1` account, deploys a new Safe and returns an instance of the Safe Core SDK connected to the new Safe.

Call the method `getAddress`, for example, to check the address of the newly deployed Safe.

```js
const newSafeAddress = safeSdk.getAddress()
```

To instantiate the Safe Core SDK from an existing Safe just pass to it an instance of the `EthAdapter` class and the Safe address. 

```js
import Safe from '@gnosis.pm/safe-core-sdk'

const safeSdk: Safe = await Safe.create({ ethAdapter: ethAdapterOwner1, safeAddress })
```

### 3. Create a Safe transaction

```js
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'

const transactions: SafeTransactionDataPartial[] = [{
  to: '0x<address>',
  value: '<eth_value_in_wei>',
  data: '0x<data>'
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
```

Before executing this transaction, it must be signed by the owners and this can be done off-chain or on-chain. In this example `owner1` will sign it off-chain, `owner2` will sign it on-chain and `owner3` will execute it (the executor also signs the transaction transparently).

### 3.a. Off-chain signatures

The `owner1` account signs the transaction off-chain.

```js
const owner1Signature = await safeSdk.signTransaction(safeTransaction)
```

Because the signature is off-chain, there is no interaction with the contract and the signature becomes available at `safeTransaction.signatures`.

### 3.b. On-chain signatures

To connect `owner2` to the Safe we need to create a new instance of the class `EthAdapter` passing to its constructor the owner we would like to connect. After `owner2` account is connected to the SDK as a signer the transaction hash will be approved on-chain.

```js
const ethAdapterOwner2 = new EthersAdapter({ ethers, signer: owner2 })
const safeSdk2 = await safeSdk.connect({ ethAdapter: ethAdapterOwner2, safeAddress })
const txHash = await safeSdk2.getTransactionHash(safeTransaction)
const approveTxResponse = await safeSdk2.approveTransactionHash(txHash)
await approveTxResponse.transactionResponse?.wait()
```

### 4. Transaction execution

Lastly, `owner3` account is connected to the SDK as a signer and executor of the Safe transaction to execute it.

```js
const ethAdapterOwner3 = new EthersAdapter({ ethers, signer: owner3 })
const safeSdk3 = await safeSdk2.connect({ ethAdapter: ethAdapterOwner3, safeAddress })
const executeTxResponse = await safeSdk3.executeTransaction(safeTransaction)
await executeTxResponse.transactionResponse?.wait()
```

All the signatures used to execute the transaction are now available at `safeTransaction.signatures`.

## API Reference

### create
Returns an instance of the Safe Core SDK connected to the `safeAddress`.

```js
const safeSdk = await Safe.create({ ethAdapter, safeAddress })
```

The property `contractNetworks` can be added to provide the Safe contract addresses in case the SDK is used in a network where the Safe contracts are not deployed.

```js
const contractNetworks: ContractNetworksConfig = {
  [chainId]: {
    multiSendAddress: '0x<multisend_address>'
  }
}
const safeSdk = await Safe.create({ ethAdapter, safeAddress, contractNetworks })
```

### connect

Returns a new instance of the Safe Core SDK connected to the `safeAddress`.

```js
const safeSdk2 = await safeSdk.connect({ ethAdapter, safeAddress })
```

The property `contractNetworks` can be added to provide the Safe contract addresses in case the SDK is used in a network where the Safe contracts are not deployed.

```js
const contractNetworks: ContractNetworksConfig = {
  [chainId]: {
    multiSendAddress: '0x<multisend_address>'
  }
}
const safeSdk = await Safe.create({ ethAdapter, safeAddress, contractNetworks })
```

### getAddress

Returns the address of the current Safe Proxy contract.

```js
const address = safeSdk.getAddress()
```

### getContractVersion

Returns the Safe Master Copy contract version.

```js
const contractVersion = await safeSdk.getContractVersion()
```

### getOwners

Returns the list of Safe owner accounts.

```js
const owners = await safeSdk.getOwners()
```

### getNonce

Returns the Safe nonce.

```js
const nonce = await safeSdk.getNonce()
```

### getThreshold

Returns the Safe threshold.

```js
const threshold = await safeSdk.getThreshold()
```

### getChainId

Returns the chainId of the connected network.

```js
const chainId = await safeSdk.getChainId()
```

### getBalance

Returns the ETH balance of the Safe.

```js
const balance = await safeSdk.getBalance()
```

### getModules

Returns the list of addresses of all the enabled Safe modules.

```js
const modules = await safeSdk.getModules()
```

### isModuleEnabled

Checks if a specific Safe module is enabled for the current Safe.

```js
const isEnabled = await safeSdk.isModuleEnabled(moduleAddress)
```

### isOwner

Checks if a specific address is an owner of the current Safe.

```js
const isOwner = await safeSdk.isOwner(address)
```

### createTransaction

Returns a Safe transaction ready to be signed by the owners and executed.

```js
const transaction: SafeTransactionDataPartial = {
  to,
  data,
  value,
  operation, // Optional
  safeTxGas, // Optional
  baseGas, // Optional
  gasPrice, // Optional
  gasToken, // Optional
  refundReceiver, // Optional
  nonce // Optional
}
const safeTransaction = await safeSdk.createTransaction(transaction)
```

Batched transactions are allowed if more than one transaction are passed as an array of transactions.

```js
const transactions: MetaTransactionData[] = [
  {
    to,
    data,
    value,
    operation // Optional
  },
  // ...
]
const safeTransaction = await safeSdk.createTransaction(transactions)
```

This method can also receive the `options` parameter to set the optional properties in the MultiSend transaction:

```js
const transactions: MetaTransactionData[] = [
  {
    to,
    data,
    value,
    operation
  },
  // ...
]
const options: SafeTransactionOptionalProps = {
  safeTxGas, // Optional
  baseGas, // Optional
  gasPrice, // Optional
  gasToken, // Optional
  refundReceiver, // Optional
  nonce // Optional
}
const safeTransaction = await safeSdk.createTransaction(transactions, options)
```

If the optional properties are not manually set, the Safe transaction returned will have the default value for each one:

* `operation`: `OperationType.Call` (0) is the default value.
* `safeTxGas`: The right gas estimation is the default value.
* `baseGas`: 0 is the default value.
* `gasPrice`: 0 is the default value.
* `gasToken`: 0x address is the default value.
* `refundReceiver`: 0x address is the default value.
* `nonce`: The current Safe nonce is the default value.

Read more about the [Safe transaction properties](https://docs.gnosis.io/safe/docs/contracts_tx_execution/).

### createRejectionTransaction

Returns a Safe transaction ready to be signed by the owners that invalidates the pending Safe transaction/s with a specific nonce.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction =  await safeSdk.createTransaction(...transactions)
const rejectionTransaction = await safeSdk.createRejectionTransaction(safeTransaction.data.nonce)
```

### getTransactionHash

Returns the transaction hash of a Safe transaction.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txHash = await safeSdk.getTransactionHash(safeTransaction)
```

### signTransactionHash

Signs a hash using the current owner account.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const signature = await safeSdk.signTransactionHash(txHash)
```

### signTransaction

Adds the signature of the current owner to the Safe transaction object.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
await safeSdk.signTransaction(safeTransaction)
```

### approveTransactionHash

Approves a hash on-chain using the current owner account.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const txResponse = await safeSdk.approveTransactionHash(txHash)
await txResponse.transactionResponse?.wait()
```

### getOwnersWhoApprovedTx

Returns a list of owners who have approved a specific Safe transaction.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const owners = await safeSdk.getOwnersWhoApprovedTx(txHash)
```

### getEnableModuleTx

Returns a Safe transaction ready to be signed that will enable a Safe module.

```js
const safeTransaction = await safeSdk.getEnableModuleTx(moduleAddress)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = {
  safeTxGas, // Optional
  baseGas, // Optional
  gasPrice, // Optional
  gasToken, // Optional
  refundReceiver, // Optional
  nonce // Optional
}
const safeTransaction = await safeSdk.getEnableModuleTx(moduleAddress, options)
```

### getDisableModuleTx

Returns a Safe transaction ready to be signed that will disable a Safe module.

```js
const safeTransaction = await safeSdk.getDisableModuleTx(moduleAddress)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.getDisableModuleTx(moduleAddress, options)
```

### getAddOwnerTx

Returns the Safe transaction to add an owner and optionally change the threshold.

```js
const params: AddOwnerTxParams = {
  ownerAddress,
  threshold // Optional. If `threshold` is not provided the current threshold will not change.
}
const safeTransaction = await safeSdk.getAddOwnerTx(params)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.getAddOwnerTx(params, options)
```

### getRemoveOwnerTx

Returns the Safe transaction to remove an owner and optionally change the threshold.

```js
const params: RemoveOwnerTxParams = {
  ownerAddress,
  newThreshold // Optional. If `newThreshold` is not provided, the current threshold will be decreased by one.
}
const safeTransaction = await safeSdk.getRemoveOwnerTx(params)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.getRemoveOwnerTx(params, options)
```

### getSwapOwnerTx

Returns the Safe transaction to replace an owner of the Safe with a new one.

```js
const params: SwapOwnerTxParams = {
  oldOwnerAddress,
  newOwnerAddress
}
const safeTransaction = await safeSdk.getSwapOwnerTx(params)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.getSwapOwnerTx(params, options)
```

### getChangeThresholdTx

Returns the Safe transaction to change the threshold.

```js
const safeTransaction = await safeSdk.getChangeThresholdTx(newThreshold)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.getChangeThresholdTx(newThreshold, options)
```

### executeTransaction

Executes a Safe transaction.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

Optionally, `gasLimit` and `gasPrice` values can be passed as execution options, avoiding the gas estimation.

```js
const options: TransactionOptions = {
  gasLimit,
  gasPrice // Optional
}
const txResponse = await safeSdk.executeTransaction(safeTransaction, options)
```

## License

This library is released under MIT.

## Contributors

- Germán Martínez ([germartinez](https://github.com/germartinez))
