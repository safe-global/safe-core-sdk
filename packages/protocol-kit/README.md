# Protocol Kit

[![NPM Version](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit)
[![GitHub Release](https://img.shields.io/github/release/safe-global/safe-core-sdk.svg?style=flat)](https://github.com/safe-global/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/safe-global/safe-core-sdk)](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md)

Software development kit that facilitates the interaction with the [Safe contracts](https://github.com/safe-global/safe-contracts).

## Table of contents

- [Installation](#installation)
- [Build](#build)
- [Tests](#tests)
- [Getting Started](#getting-started)
- [Safe Factory API Reference](#factory-api)
- [Safe Core SDK API Reference](#sdk-api)
- [License](#license)
- [Contributors](#contributors)

## <a name="installation">Installation</a>

Install the package with yarn or npm:

```bash
yarn add @safe-global/protocol-kit
npm install @safe-global/protocol-kit
```

## <a name="build">Build</a>

Build the package with yarn or npm:

```bash
yarn build
npm run build
```

## <a name="tests">Tests</a>

Create a `.env` file with environment variables. You can use the `.env.example` file as a reference.

Test the package with yarn or npm:

```bash
yarn test
npm run test
```

## <a name="getting-started">Getting Started</a>

The following steps show how to set up the Protocol Kit, deploy a new Safe, create a Safe transaction, generate the required signatures from owners and execute the transaction. However, using the Protocol Kit alone will not allow for the collection of owner signatures off-chain. To do this and be able to see and confirm the pending transactions shown in the [Safe Web App](https://app.safe.global/), it is recommended that you follow this other [guide](/guides/integrating-the-safe-core-sdk.md) that covers the use of the Protocol Kit, combined with the API Kit.

### 1. Instantiate an EthAdapter

First of all, we need to create an `EthAdapter`, which contains all the required utilities for the SDKs to interact with the blockchain. It acts as a wrapper for [web3.js](https://web3js.readthedocs.io/) or [ethers.js](https://docs.ethers.org/v6/) Ethereum libraries.

Depending on the library used by the Dapp, there are two options:

- [Create an `EthersAdapter` instance](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit/src/adapters/ethers)
- [Create a `Web3Adapter` instance](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit/src/adapters/web3)

Once the instance of `EthersAdapter` or `Web3Adapter` is created, it can be used in the SDK initialization.

### 2. Deploy a new Safe

To deploy a new Safe account instantiate the `SafeFactory` class and call the `deploySafe` method with the right params to configure the new Safe. This includes defining the list of owners and the threshold of the Safe. A Safe account with three owners and threshold equal three will be used as the starting point for this example but any Safe configuration is valid.

```js
import Safe, { SafeFactory, SafeAccountConfig } from '@safe-global/protocol-kit'

const safeFactory = await SafeFactory.create({ ethAdapter })

const owners = ['0x<address>', '0x<address>', '0x<address>']
const threshold = 3
const safeAccountConfig: SafeAccountConfig = {
  owners,
  threshold
  // ...
}

const safeSdk: Safe = await safeFactory.deploySafe({ safeAccountConfig })
```

The `deploySafe` method executes a transaction from the `owner1` account, deploys a new Safe and returns an instance of the Protocol Kit connected to the new Safe. Check the `deploySafe` method in the [API Reference](#factory-api) for more details on additional configuration parameters and callbacks.

Call the `getAddress` method, for example, to check the address of the newly deployed Safe.

```js
const newSafeAddress = await safeSdk.getAddress()
```

To instantiate the Protocol Kit from an existing Safe just pass to it an instance of the `EthAdapter` class and the Safe address.

```js
import Safe from '@safe-global/protocol-kit'

const safeSdk: Safe = await Safe.create({ ethAdapter: ethAdapterOwner1, safeAddress })
```

Check the `create` method in the [API Reference](#sdk-api) for more details on additional configuration parameters.

### 3. Create a Safe transaction

```js
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'

const safeTransactionData: MetaTransactionData = {
  to: '0x<address>',
  value: '<eth_value_in_wei>',
  data: '0x<data>'
}
const safeTransaction = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
```

Check the `createTransaction` method in the [API Reference](#sdk-api) for additional details on creating MultiSend transactions.

Before executing this transaction, it must be signed by the owners and this can be done off-chain or on-chain. In this example `owner1` will sign it off-chain, `owner2` will sign it on-chain and `owner3` will execute it (the executor also signs the transaction transparently).

### 3.a. Off-chain signatures

The `owner1` account signs the transaction off-chain.

```js
const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction)
```

Because the signature is off-chain, there is no interaction with the contract and the signature becomes available at `signedSafeTransaction.signatures`.

### 3.b. On-chain signatures

To connect `owner2` to the Safe we need to create a new instance of the class `EthAdapter` passing to its constructor the owner we would like to connect. After `owner2` account is connected to the SDK as a signer the transaction hash will be approved on-chain.

```js
const ethAdapterOwner2 = new EthersAdapter({ ethers, signerOrProvider: owner2 })
const safeSdk2 = await safeSdk.connect({ ethAdapter: ethAdapterOwner2, safeAddress })
const txHash = await safeSdk2.getTransactionHash(safeTransaction)
const approveTxResponse = await safeSdk2.approveTransactionHash(txHash)
await approveTxResponse.transactionResponse?.wait()
```

### 4. Transaction execution

Lastly, `owner3` account is connected to the SDK as a signer and executor of the Safe transaction to execute it.

```js
const ethAdapterOwner3 = new EthersAdapter({ ethers, signerOrProvider: owner3 })
const safeSdk3 = await safeSdk2.connect({ ethAdapter: ethAdapterOwner3, safeAddress })
const executeTxResponse = await safeSdk3.executeTransaction(safeTransaction)
await executeTxResponse.transactionResponse?.wait()
```

All the signatures used to execute the transaction are now available at `safeTransaction.signatures`.

## <a name="factory-api">Safe Factory API Reference</a>

### create

Returns an instance of the Safe Factory.

```js
import { SafeFactory } from '@safe-global/protocol-kit'

const safeFactory = await SafeFactory.create({ ethAdapter })
```

- The `isL1SafeSingleton` flag

  There are two versions of the Safe contracts: [Safe.sol](https://github.com/safe-global/safe-contracts/blob/v1.4.1/contracts/Safe.sol) that does not trigger events in order to save gas and [SafeL2.sol](https://github.com/safe-global/safe-contracts/blob/v1.4.1/contracts/SafeL2.sol) that does, which is more appropriate for L2 networks.

  By default `Safe.sol` will be only used on Ethereum Mainnet. For the rest of the networks where the Safe contracts are already deployed, the `SafeL2.sol` contract will be used unless you add the `isL1SafeSingleton` flag to force the use of the `Safe.sol` contract.

  ```js
  const safeFactory = await SafeFactory.create({ ethAdapter, isL1SafeSingleton: true })
  ```

- The `contractNetworks` property

  If the Safe contracts are not deployed to your current network, the `contractNetworks` property will be required to point to the addresses of the Safe contracts previously deployed by you.

  ```js
  import { ContractNetworksConfig } from '@safe-global/protocol-kit'

  const chainId = await ethAdapter.getChainId()
  const contractNetworks: ContractNetworksConfig = {
    [chainId]: {
      safeSingletonAddress: '<SINGLETON_ADDRESS>',
      safeProxyFactoryAddress: '<PROXY_FACTORY_ADDRESS>',
      multiSendAddress: '<MULTI_SEND_ADDRESS>',
      multiSendCallOnlyAddress: '<MULTI_SEND_CALL_ONLY_ADDRESS>',
      fallbackHandlerAddress: '<FALLBACK_HANDLER_ADDRESS>',
      signMessageLibAddress: '<SIGN_MESSAGE_LIB_ADDRESS>',
      createCallAddress: '<CREATE_CALL_ADDRESS>',
      simulateTxAccessorAddress: '<SIMULATE_TX_ACCESSOR_ADDRESS>',
      safeSingletonAbi: '<SINGLETON_ABI>', // Optional. Only needed with web3.js
      safeProxyFactoryAbi: '<PROXY_FACTORY_ABI>', // Optional. Only needed with web3.js
      multiSendAbi: '<MULTI_SEND_ABI>', // Optional. Only needed with web3.js
      multiSendCallOnlyAbi: '<MULTI_SEND_CALL_ONLY_ABI>', // Optional. Only needed with web3.js
      fallbackHandlerAbi: '<FALLBACK_HANDLER_ABI>', // Optional. Only needed with web3.js
      signMessageLibAbi: '<SIGN_MESSAGE_LIB_ABI>', // Optional. Only needed with web3.js
      createCallAbi: '<CREATE_CALL_ABI>', // Optional. Only needed with web3.js
      simulateTxAccessorAbi: '<SIMULATE_TX_ACCESSOR_ABI>' // Optional. Only needed with web3.js
    }
  }

  const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
  ```

- The `safeVersion` property

  The `SafeFactory` constructor also accepts the `safeVersion` property to specify the Safe contract version that will be deployed. This string can take the values `1.0.0`, `1.1.1`, `1.2.0`, `1.3.0` or `1.4.1`. If not specified, the `DEFAULT_SAFE_VERSION` value will be used.

  ```js
  const safeVersion = 'X.Y.Z'
  const safeFactory = await SafeFactory.create({ ethAdapter, safeVersion })
  ```

### deploySafe

Deploys a new Safe and returns an instance of the Protocol Kit connected to the deployed Safe. The Singleton address, contract version and layer instance (`Safe.sol` or `SafeL2.sol`) of the deployed Safe will depend on the configuration used to create the `safeFactory`.

```js
const safeAccountConfig: SafeAccountConfig = {
  owners,
  threshold,
  to, // Optional
  data, // Optional
  fallbackHandler, // Optional
  paymentToken, // Optional
  payment, // Optional
  paymentReceiver // Optional
}

const safeSdk = await safeFactory.deploySafe({ safeAccountConfig })
```

This method can optionally receive the `saltNonce` parameter.

```js
const safeAccountConfig: SafeAccountConfig = {
  owners,
  threshold,
  to, // Optional
  data, // Optional
  fallbackHandler, // Optional
  paymentToken, // Optional
  payment, // Optional
  paymentReceiver // Optional
}

const saltNonce = '<YOUR_CUSTOM_VALUE>'

const safeSdk = await safeFactory.deploySafe({ safeAccountConfig, saltNonce })
```

Optionally, some properties can be passed as execution options:

```js
const options: Web3TransactionOptions = {
  from, // Optional
  gas, // Optional
  gasPrice, // Optional
  maxFeePerGas, // Optional
  maxPriorityFeePerGas // Optional
  nonce // Optional
}
```

```js
const options: EthersTransactionOptions = {
  from, // Optional
  gasLimit, // Optional
  gasPrice, // Optional
  maxFeePerGas, // Optional
  maxPriorityFeePerGas // Optional
  nonce // Optional
}
```

```js
const safeSdk = await safeFactory.deploySafe({ safeAccountConfig, safeDeploymentConfig, options })
```

It can also take an optional callback which receives the `txHash` of the Safe deployment transaction prior to returning a new instance of the Protocol Kit:

```js
const callback = (txHash: string): void => {
  console.log({ txHash })
}

const safeSdk = await safeFactory.deploySafe({ safeAccountConfig, callback })
```

## <a name="sdk-api">Safe Core SDK API Reference</a>

### create

Returns an instance of the Protocol Kit connected to a Safe. The provided Safe must be a `safeAddress` or a `predictedSafe`.

Initialization of a deployed Safe using the `safeAddress` property:

```js
import Safe from '@safe-global/protocol-kit'

const safeSdk = await Safe.create({ ethAdapter, safeAddress })
```

Initialization of a not deployed Safe using the `predictedSafe` property. Because Safes are deployed in a deterministic way, passing a `predictedSafe` will allow to initialize the SDK with the Safe configuration and use it to some extent before it is deployed:

```js
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit'

const predictedSafe: PredictedSafeProps = {
  safeAccountConfig,
  safeDeploymentConfig
}

const safeSdk = await Safe.create({ ethAdapter, predictedSafe })
```

- The `isL1SafeSingleton` flag

  There are two versions of the Safe contracts: [Safe.sol](https://github.com/safe-global/safe-contracts/blob/v1.4.1/contracts/Safe.sol) that does not trigger events in order to save gas and [SafeL2.sol](https://github.com/safe-global/safe-contracts/blob/v1.4.1/contracts/SafeL2.sol) that does, which is more appropriate for L2 networks.

  By default `Safe.sol` will be only used on Ethereum Mainnet. For the rest of the networks where the Safe contracts are already deployed, the `SafeL2.sol` contract will be used unless you add the `isL1SafeSingleton` flag to force the use of the `Safe.sol` contract.

  ```js
  const safeSdk = await Safe.create({ ethAdapter, safeAddress, isL1SafeSingleton: true })
  ```

- The `contractNetworks` property

  If the Safe contracts are not deployed to your current network, the `contractNetworks` property will be required to point to the addresses of the Safe contracts previously deployed by you.

  ```js
  import { ContractNetworksConfig } from '@safe-global/protocol-kit'

  const chainId = await ethAdapter.getChainId()
  const contractNetworks: ContractNetworksConfig = {
    [chainId]: {
      safeSingletonAddress: '<SINGLETON_ADDRESS>',
      safeProxyFactoryAddress: '<PROXY_FACTORY_ADDRESS>',
      multiSendAddress: '<MULTI_SEND_ADDRESS>',
      multiSendCallOnlyAddress: '<MULTI_SEND_CALL_ONLY_ADDRESS>',
      fallbackHandlerAddress: '<FALLBACK_HANDLER_ADDRESS>',
      signMessageLibAddress: '<SIGN_MESSAGE_LIB_ADDRESS>',
      createCallAddress: '<CREATE_CALL_ADDRESS>',
      simulateTxAccessorAddress: '<SIMULATE_TX_ACCESSOR_ADDRESS>',
      safeSingletonAbi: '<SINGLETON_ABI>', // Optional. Only needed with web3.js
      safeProxyFactoryAbi: '<PROXY_FACTORY_ABI>', // Optional. Only needed with web3.js
      multiSendAbi: '<MULTI_SEND_ABI>', // Optional. Only needed with web3.js
      multiSendCallOnlyAbi: '<MULTI_SEND_CALL_ONLY_ABI>', // Optional. Only needed with web3.js
      fallbackHandlerAbi: '<FALLBACK_HANDLER_ABI>', // Optional. Only needed with web3.js
      signMessageLibAbi: '<SIGN_MESSAGE_LIB_ABI>', // Optional. Only needed with web3.js
      createCallAbi: '<CREATE_CALL_ABI>', // Optional. Only needed with web3.js
      simulateTxAccessorAbi: '<SIMULATE_TX_ACCESSOR_ABI>' // Optional. Only needed with web3.js
    }
  }

  const safeSdk = await Safe.create({ ethAdapter, safeAddress, contractNetworks })
  ```

### connect

Returns a new instance of the Protocol Kit connected to a new Safe or a new Signer. The new connected signer can be passed via the `ethAdapter` property while the new connected Safe can be passed using a `safeAddress` or a `predictedSafe`.

Connection of a deployed Safe using the `safeAddress` property:

```js
const safeSdk = await safeSdk.connect({ ethAdapter, safeAddress })
```

Connection of a not deployed Safe using the `predictedSafe` property. Because Safes are deployed in a deterministic way, passing a `predictedSafe` will allow to connect a Safe to the SDK with the Safe configuration:

```js
import { PredictedSafeProps } from '@safe-global/protocol-kit'

const predictedSafe: PredictedSafeProps = {
  safeAccountConfig,
  safeDeploymentConfig
}

const safeSdk = await safeSdk.connect({ ethAdapter, predictedSafe })
```

- The `isL1SafeSingleton` flag

  There are two versions of the Safe contracts: [Safe.sol](https://github.com/safe-global/safe-contracts/blob/v1.4.1/contracts/Safe.sol) that does not trigger events in order to save gas and [SafeL2.sol](https://github.com/safe-global/safe-contracts/blob/v1.4.1/contracts/SafeL2.sol) that does, which is more appropriate for L2 networks.

  By default `Safe.sol` will be only used on Ethereum Mainnet. For the rest of the networks where the Safe contracts are already deployed, the `SafeL2.sol` contract will be used unless you add the `isL1SafeSingleton` flag to force the use of the `Safe.sol` contract.

  ```js
  const safeSdk = await Safe.connect({ ethAdapter, safeAddress, isL1SafeSingleton: true })
  ```

- The `contractNetworks` property

  If the Safe contracts are not deployed to your current network, the `contractNetworks` property will be required to point to the addresses of the Safe contracts previously deployed by you.

  ```js
  import { ContractNetworksConfig } from '@safe-global/protocol-kit'

  const chainId = await ethAdapter.getChainId()
  const contractNetworks: ContractNetworksConfig = {
    [chainId]: {
      safeSingletonAddress: '<SINGLETON_ADDRESS>',
      safeProxyFactoryAddress: '<PROXY_FACTORY_ADDRESS>',
      multiSendAddress: '<MULTI_SEND_ADDRESS>',
      multiSendCallOnlyAddress: '<MULTI_SEND_CALL_ONLY_ADDRESS>',
      fallbackHandlerAddress: '<FALLBACK_HANDLER_ADDRESS>',
      signMessageLibAddress: '<SIGN_MESSAGE_LIB_ADDRESS>',
      createCallAddress: '<CREATE_CALL_ADDRESS>',
      simulateTxAccessorAddress: '<SIMULATE_TX_ACCESSOR_ADDRESS>',
      safeSingletonAbi: '<SINGLETON_ABI>', // Optional. Only needed with web3.js
      safeProxyFactoryAbi: '<PROXY_FACTORY_ABI>', // Optional. Only needed with web3.js
      multiSendAbi: '<MULTI_SEND_ABI>', // Optional. Only needed with web3.js
      multiSendCallOnlyAbi: '<MULTI_SEND_CALL_ONLY_ABI>', // Optional. Only needed with web3.js
      fallbackHandlerAbi: '<FALLBACK_HANDLER_ABI>', // Optional. Only needed with web3.js
      signMessageLibAbi: '<SIGN_MESSAGE_LIB_ABI>', // Optional. Only needed with web3.js
      createCallAbi: '<CREATE_CALL_ABI>', // Optional. Only needed with web3.js
      simulateTxAccessorAbi: '<SIMULATE_TX_ACCESSOR_ABI>' // Optional. Only needed with web3.js
    }
  }
  const safeSdk = await Safe.connect({ ethAdapter, safeAddress, contractNetworks })
  ```

### getAddress

Returns the address of the current SafeProxy contract.

```js
const safeAddress = await safeSdk.getAddress()
```

### getContractVersion

Returns the Safe Singleton contract version.

```js
const contractVersion = await safeSdk.getContractVersion()
```

### getOwners

Returns the list of Safe owner accounts.

```js
const ownerAddresses = await safeSdk.getOwners()
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

### getGuard

Returns the enabled Safe guard or 0x address if no guards are enabled.

```js
const guardAddress = await safeSdk.getGuard()
```

### getModules

Returns the list of addresses of all the enabled Safe modules.

```js
const moduleAddresses = await safeSdk.getModules()
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

Returns a Safe transaction ready to be signed by the owners and executed. The Protocol Kit supports the creation of single Safe transactions but also MultiSend transactions.

This method takes an array of `MetaTransactionData` objects that represent the individual transactions we want to include in our MultiSend transaction.

When the array contains only one transaction, it is not wrapped in the MultiSend.

```js
const transactions: MetaTransactionData[] = [
  {
    to,
    data,
    value,
    operation // Optional
  },
  {
    to,
    data,
    value,
    operation // Optional
  }
  // ...
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
```

This method can also receive the `options` parameter to set the optional properties in the MultiSend transaction:

```js
const transactions: MetaTransactionData[] = [
  {
    to,
    data,
    value,
    operation // Optional
  },
  {
    to,
    data,
    value,
    operation // Optional
  }
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
const safeTransaction = await safeSdk.createTransaction({ transactions, options })
```

In addition, the optional `callsOnly` parameter, which is `false` by default, allows to force the use of the `MultiSendCallOnly` instead of the `MultiSend` contract when sending a batch transaction:

```js
const callsOnly = true
const safeTransaction = await safeSdk.createTransaction({
  transactions,
  options,
  callsOnly
})
```

If the optional properties are not manually set, the Safe transaction returned will have the default value for each one:

- `operation`: `OperationType.Call` (0) is the default value.
- `safeTxGas`: The right gas estimation is the default value.
- `baseGas`: 0 is the default value.
- `gasPrice`: 0 is the default value.
- `gasToken`: 0x address is the default value.
- `refundReceiver`: 0x address is the default value.
- `nonce`: The current Safe nonce is the default value.

Read more about [create transactions from a Safe](https://docs.safe.global/safe-core-aa-sdk/protocol-kit#making-a-transaction-from-a-safe).

### createRejectionTransaction

Returns a Safe transaction ready to be signed by the owners that invalidates the pending Safe transaction/s with a specific nonce.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const rejectionTransaction = await safeSdk.createRejectionTransaction(safeTransaction.data.nonce)
```

### copyTransaction

Copies a Safe transaction.

```js
const safeTransaction1 = await safeSdk.createTransaction({ transactions })
const safeTransaction2 = await copyTransaction(safeTransaction1)
```

### getTransactionHash

Returns the transaction hash of a Safe transaction.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const txHash = await safeSdk.getTransactionHash(safeTransaction)
```

### signHash

Signs a hash using the current owner account.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const signature = await safeSdk.signHash(txHash)
```

### signTypedData

Signs a transaction according to the EIP-712 using the current signer account.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const signature = await safeSdk.signTypedData(safeTransaction)
```

### signTransaction

Returns a new `SafeTransaction` object that includes the signature of the current owner. `eth_sign` will be used by default to generate the signature.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction)
```

Optionally, an additional parameter can be passed to specify a different way of signing:

```js
const signedSafeTransaction = await safeSdk.signTransaction(
  safeTransaction,
  SigningMethod.ETH_SIGN_TYPED_DATA
)
```

```js
const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction, SigningMethod.ETH_SIGN) // default option.
```

### approveTransactionHash

Approves a hash on-chain using the current owner account.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const txResponse = await safeSdk.approveTransactionHash(txHash)
await txResponse.transactionResponse?.wait()
```

Optionally, some properties can be passed as execution options:

```js
const options: Web3TransactionOptions = {
  from, // Optional
  gas, // Optional
  gasPrice, // Optional
  maxFeePerGas, // Optional
  maxPriorityFeePerGas // Optional
  nonce // Optional
}
```

```js
const options: EthersTransactionOptions = {
  from, // Optional
  gasLimit, // Optional
  gasPrice, // Optional
  maxFeePerGas, // Optional
  maxPriorityFeePerGas // Optional
  nonce // Optional
}
```

```js
const txResponse = await safeSdk.approveTransactionHash(txHash, options)
```

### getOwnersWhoApprovedTx

Returns a list of owners who have approved a specific Safe transaction.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const ownerAddresses = await safeSdk.getOwnersWhoApprovedTx(txHash)
```

### createEnableFallbackHandlerTx

Returns the Safe transaction to enable the fallback handler.

```js
const safeTransaction = await safeSdk.createEnableFallbackHandlerTx(fallbackHandlerAddress)
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
const safeTransaction = await safeSdk.createEnableFallbackHandlerTx(fallbackHandlerAddress, options)
```

### createDisableFallbackHandlerTx

Returns the Safe transaction to disable the fallback handler.

```js
const safeTransaction = await safeSdk.createDisableFallbackHandlerTx()
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.createDisableFallbackHandlerTx(options)
```

### createEnableGuardTx

Returns the Safe transaction to enable a Safe guard.

```js
const safeTransaction = await safeSdk.createEnableGuardTx(guardAddress)
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
const safeTransaction = await safeSdk.createEnableGuardTx(guardAddress, options)
```

### createDisableGuardTx

Returns the Safe transaction to disable a Safe guard.

```js
const safeTransaction = await safeSdk.createDisableGuardTx()
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.createDisableGuardTx(options)
```

### createEnableModuleTx

Returns a Safe transaction ready to be signed that will enable a Safe module.

```js
const safeTransaction = await safeSdk.createEnableModuleTx(moduleAddress)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.createEnableModuleTx(moduleAddress, options)
```

### createDisableModuleTx

Returns a Safe transaction ready to be signed that will disable a Safe module.

```js
const safeTransaction = await safeSdk.createDisableModuleTx(moduleAddress)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.createDisableModuleTx(moduleAddress, options)
```

### createAddOwnerTx

Returns the Safe transaction to add an owner and optionally change the threshold.

```js
const params: AddOwnerTxParams = {
  ownerAddress,
  threshold // Optional. If `threshold` is not provided the current threshold will not change.
}
const safeTransaction = await safeSdk.createAddOwnerTx(params)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.createAddOwnerTx(params, options)
```

### createRemoveOwnerTx

Returns the Safe transaction to remove an owner and optionally change the threshold.

```js
const params: RemoveOwnerTxParams = {
  ownerAddress,
  newThreshold // Optional. If `newThreshold` is not provided, the current threshold will be decreased by one.
}
const safeTransaction = await safeSdk.createRemoveOwnerTx(params)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.createRemoveOwnerTx(params, options)
```

### createSwapOwnerTx

Returns the Safe transaction to replace an owner of the Safe with a new one.

```js
const params: SwapOwnerTxParams = {
  oldOwnerAddress,
  newOwnerAddress
}
const safeTransaction = await safeSdk.createSwapOwnerTx(params)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.createSwapOwnerTx(params, options)
```

### createChangeThresholdTx

Returns the Safe transaction to change the threshold.

```js
const safeTransaction = await safeSdk.createChangeThresholdTx(newThreshold)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

This method can optionally receive the `options` parameter:

```js
const options: SafeTransactionOptionalProps = { ... }
const safeTransaction = await safeSdk.createChangeThresholdTx(newThreshold, options)
```

### isValidTransaction

Checks if a Safe transaction can be executed successfully with no errors.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const isValidTx = await safeSdk.isValidTransaction(safeTransaction)
```

Optionally, some properties can be passed as execution options:

```js
const options: Web3TransactionOptions = {
  from, // Optional
  gas, // Optional
  gasPrice, // Optional
  maxFeePerGas, // Optional
  maxPriorityFeePerGas // Optional
  nonce // Optional
}
```

```js
const options: EthersTransactionOptions = {
  from, // Optional
  gasLimit, // Optional
  gasPrice, // Optional
  maxFeePerGas, // Optional
  maxPriorityFeePerGas // Optional
  nonce // Optional
}
```

```js
const isValidTx = await safeSdk.isValidTransaction(safeTransaction, options)
```

### executeTransaction

Executes a Safe transaction.

```js
const transactions: MetaTransactionData[] = [
  {
    // ...
  }
]
const safeTransaction = await safeSdk.createTransaction({ transactions })
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.transactionResponse?.wait()
```

Optionally, some properties can be passed as execution options:

```js
const options: Web3TransactionOptions = {
  from, // Optional
  gas, // Optional
  gasPrice, // Optional
  maxFeePerGas, // Optional
  maxPriorityFeePerGas // Optional
  nonce // Optional
}
```

```js
const options: EthersTransactionOptions = {
  from, // Optional
  gasLimit, // Optional
  gasPrice, // Optional
  maxFeePerGas, // Optional
  maxPriorityFeePerGas // Optional
  nonce // Optional
}
```

```js
const txResponse = await safeSdk.executeTransaction(safeTransaction, options)
```

## <a name="license">License</a>

This library is released under MIT.

## <a name="contributors">Contributors</a>

- Germán Martínez ([germartinez](https://github.com/germartinez))
