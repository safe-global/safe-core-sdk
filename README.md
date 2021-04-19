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

const web3Provider = // ...
const provider = new ethers.providers.Web3Provider(web3Provider)
const signer1 = provider.getSigner(0)
const signer2 = provider.getSigner(1)
const signer3 = provider.getSigner(2)

// Existing Safe address (e.g. Safe created via https://app.gnosis-safe.io)
// Where signer1, signer2 and signer3 are the Safe owners
const safeAddress = "0x<safe_address>"
```

Create an instance of the Safe Core SDK with `signer1` connected as the signer.

```js
const safeSdk1 = await EthersSafe.create(ethers, safeAddress, signer1)
```

### 1. Create a Safe transaction

```js
const tx = new SafeTransaction({
  to: safeAddress,
  value: '0',
  data: '0x',
  nonce: await safeSdk1.getNonce()
})
```

Before executing this transaction, it must be signed by the owners and this can be done off-chain or on-chain. In this example the owner `signer1` will sign it off-chain and the owner `signer3` would have to explicitly sign it too.

### 2.a. Off-chain signatures

The owner `signer1` signs the transaction off-chain.

```js
const signer1Signature = await safeSdk1.signTransaction(tx)
```

Because the signature is off-chain, there is no interaction with the contract and the signature is available at `tx.signatures`.

### 2.b. On-chain signatures

After `signer2` account is connected to the SDK as the signer the transaction hash is approved on-chain.

```js
const safeSdk2 = await safeSdk1.connect(signer2)
const txHash = await safeSdk2.getTransactionHash(tx)
const signer2Signature = await safeSdk2.approveTransactionHash(txHash)
```

### 3. Transaction execution

Lastly, `signer3` account is connected to the SDK as the signer and executor of the Safe transaction to execute it.

```js
const safeSdk3 = await safeSdk2.connect(signer3)
const txResponse = await safeSdk3.executeTransaction(tx)
await txResponse.wait()
```

All the signatures used to execute the transaction are available at `tx.signatures`.

## API Reference

### create
Returns an instance of the Safe Core SDK with the `providerOrSigner` connected to the `safeAddress`.

```js
const safeSdk = await EthersSafe.create(ethers, safeAddress, providerOrSigner)
```

If `providerOrSigner` is not provided, `ethers` default provider will be used.

```js
const safeSdk = await EthersSafe.create(ethers, safeAddress)
```

### connect

Returns a new instance of the Safe Core SDK with the `providerOrSigner` connected to the `safeAddress`.

```js
const safeSdk2 = await safeSdk.connect(providerOrSigner, safeAddress)
```

If `safeAddress` is not provided, the `providerOrSigner` will be connected to the previous Safe.

```js
const safeSdk2 = await safeSdk.connect(providerOrSigner)
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
const txResponse = await safeSdk.approveTransactionHash(txHash)
await txResponse.wait()
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
await txResponse.wait()
```

## License

This library is released under MIT.

## Contributors

- Germán Martínez ([germartinez](https://github.com/germartinez))
