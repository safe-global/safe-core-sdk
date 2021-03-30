# Safe Core SDK

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

A Safe account with three owners and threshold equal three will be used as the starting point for this example but any Safe configuration is valid.

```js
import { ethers } from 'ethers'
import EthersSafe, { SafeTransaction } from 'safe-core-sdk'

const provider = ethers.getDefaultProvider('homestead')
const wallet1 = ethers.Wallet.createRandom().connect(provider)
const wallet2 = ethers.Wallet.createRandom().connect(provider)
const wallet3 = ethers.Wallet.createRandom().connect(provider)

// Existing Safe address (e.g. Safe created via https://app.gnosis-safe.io)
// Where wallet1.address, wallet2.address and wallet3.address are the Safe owners
const safeAddress = "0x<safe_address>"
const safeNonce = <safe_nonce>
```

Create an instance of the Safe Core SDK with wallet1 connected as the signer.

```js
const safeSdk1 = new EthersSafe(ethers, safeAddress, wallet1)
```

### 1. Create a Safe transaction

```js
const tx = new SafeTransaction({
  to: safeAddress,
  value: '0',
  data: '0x',
  nonce: safeNonce
})
```

Before executing this transaction, it must be signed by the owners and this can be done off-chain or on-chain. In this example the owner `wallet1` will sign it off-chain and the owner `wallet2` will sign it on-chain. It is not needed that `wallet3` signs the transaction explicitly because it will be the one executing the transaction. If an account that is not an owner executes the transaction, `wallet3` would have to explicitly sign it too.

### 2.a. Off-chain signatures

The owner `wallet1` signs the transaction off-chain.

```js
const wallet1Signature = await safeSdk1.signTransaction(tx)
```

Because the signature is off-chain, there is no interaction with the contract and the signature is available at `tx.signatures`.

### 2.b. On-chain signatures

After `wallet2` account is connected to the SDK as the signer the transaction hash is approved on-chain.

```js
const safeSdk2 = safeSdk1.connect(wallet2)
const txHash = await safeSdk2.getTransactionHash(tx)
const wallet2Signature = await safeSdk2.approveTransactionHash(txHash)
```

### 3. Transaction execution

Lastly, `wallet3` account is connected to the SDK as the signer and executor of the Safe transaction to execute it.

```js
const safeSdk3 = safeSdk2.connect(wallet3)
const txResponse = await safeSdk3.executeTransaction(tx)
```

All the signatures used to execute the transaction are available at `tx.signatures`.

## API Reference

### constructor

Returns an instance of the Safe Core SDK with the `providerOrSigner` connected to the `safeAddress`.

```js
const safeSdk = new EthersSafe(ethers, safeAddress, providerOrSigner)
```

If `providerOrSigner` is not provided, `ethers` default provider will be used.

```js
const safeSdk = new EthersSafe(ethers, safeAddress)
```

### connect

Returns a new instance of the Safe Core SDK with the `providerOrSigner` connected to the `safeAddress`.

```js
const safeSdk2 = safeSdk.connect(providerOrSigner, safeAddress)
```

If `safeAddress` is not provided, the `providerOrSigner` will be connected to the previous Safe.

```js
const safeSdk2 = safeSdk.connect(providerOrSigner)
```

### getProvider

Returns the connected provider.

```js
const provider = safeSdk.getProvider()
```

### getSigner

Returns the connected signer.

```js
const signer = safeSdk.getSigner()
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

### getTransactionHash

Returns the transaction hash of a Safe transaction.

```js
const tx = new SafeTransaction({
  // ...
})
const txHash = await safeSdk.getTransactionHash(tx)
```

### signTransactionHash

Signs a hash using the current signer account.

```js
const tx = new SafeTransaction({
  // ...
})
const txHash = await safeSdk.getTransactionHash(tx)
const signature = await safeSdk.signTransactionHash(txHash)
```

### signTransaction

Adds the signature of the current signer to the Safe transaction object.

```js
const tx = new SafeTransaction({
  // ...
})
await safeSdk.signTransaction(tx)
```

### approveTransactionHash

Approves on-chain a hash using the current signer account.

```js
const tx = new SafeTransaction({
  // ...
})
const txHash = await safeSdk.getTransactionHash(tx)
const signature = await safeSdk.approveTransactionHash(txHash)
```

### getOwnersWhoApprovedTx

Returns a list of owners who have approved a specific Safe transaction.

```js
const tx = new SafeTransaction({
  // ...
})
const txHash = await safeSdk.getTransactionHash(tx)
const owners = await safeSdk.getOwnersWhoApprovedTx(txHash)
```

### executeTransaction

Executes a Safe transaction.

```js
const tx = new SafeTransaction({
  // ...
})
const txResponse = await safeSdk.executeTransaction(tx)
```

### getEnableModuleTx

Returns a Safe transaction ready to be signed that will enable a Safe module.

```js
const tx = await safeSdk.getEnableModuleTx(moduleAddress)
```

### getDisableModuleTx

Returns a Safe transaction ready to be signed that will disable a Safe module.

```js
const tx = await safeSdk.getDisableModuleTx(moduleAddress)
```

## License

This library is released under MIT.

## Contributors

- Germán Martínez ([germartinez](https://github.com/germartinez))
