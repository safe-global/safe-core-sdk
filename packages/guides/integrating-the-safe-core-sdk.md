# Guide: Integrating the Safe Core SDK

## Table of contents:

  1. [Install the dependencies](#install-dependencies)
  2. [Initialize the SDK’s](#initialize-sdks)
  3. [Deploy a new Safe](#deploy-safe)
  4. [Create a transaction](#create-transaction)
  5. [Propose the transaction to the service](#propose-transaction)
  6. [Get the transaction from the service](#get-transaction)
  7. [Confirm/reject the transaction](#confirm-transaction)
  8. [Execute the transaction](#execute-transaction)
  9. [Interface checks](#interface-checks)

## 1. Install the dependencies <a name="install-dependencies"></a>

To integrate the [Safe Core SDK](https://github.com/gnosis/safe-core-sdk) into your Dapp or script you would need to install these dependencies:

```
@gnosis.pm/safe-core-sdk-types
@gnosis.pm/safe-core-sdk
@gnosis.pm/safe-service-client
```

## 2. Initialize the SDK’s <a name="initialize-sdks"></a>

### Initialize the Safe Service Client

As stated in the introduction, the [Safe Service Client](https://github.com/gnosis/safe-core-sdk/tree/main/packages/safe-service-client) consumes the [Safe Transaction Service API](https://github.com/gnosis/safe-transaction-service). To start using this library create a new instance of the class `SafeServiceClient` imported from `@gnosis.pm/safe-service-client` and pass to its constructor the URL of the Safe Transaction Service you want to use depending on the network.

```js
import SafeServiceClient from '@gnosis.pm/safe-service-client'

const transactionServiceUrl = 'https://safe-transaction.gnosis.io'
const safeService = new SafeServiceClient(transactionServiceUrl)
```

### Initialize the Safe Core SDK

The [Safe Core SDK](https://github.com/gnosis/safe-core-sdk/tree/main/packages/safe-core-sdk) library only interacts with the [Safe contracts](https://github.com/gnosis/safe-contracts). Because of that, we need to select one Ethereum library between [web3.js](https://web3js.readthedocs.io/) and [ethers.js](https://docs.ethers.io/v5/) to interact with the blockchain.

* **Using ethers.js**

  We can use the class `EthersAdapter` from `@gnosis.pm/safe-core-sdk` as a wrapper of `ethers.js`.

  ```js
  import { EthersAdapter } from '@gnosis.pm/safe-core-sdk'
  import { ethers } from 'ethers'

  const web3Provider = // ...
  const provider = new ethers.providers.Web3Provider(web3Provider)
  const safeOwner = provider.getSigner(0)

  const ethAdapter = new EthersAdapter({
    ethers,
    signer: safeOwner
  })
  ```

* **Using web3.js**

  We can use the class `Web3Adapter` from `@gnosis.pm/safe-core-sdk` as a wrapper of `web3.js`.

  ```js
  import { Web3Adapter } from '@gnosis.pm/safe-core-sdk'
  import Web3 from 'web3'

  const ethAdapter = new Web3Adapter({
    web3,
    signerAddress: safeOwnerAddress
  })
  ```

Once we have an instance of `EthersAdapter` or `Web3Adapter` we are ready to instantiate the `SafeFactory` and `Safe` classes from `@gnosis.pm/safe-core-sdk`.

```js
import Safe, { SafeFactory } from '@gnosis.pm/safe-core-sdk'

const safeFactory = await SafeFactory.create({ ethAdapter })

const safeSdk = await Safe.create({ ethAdapter, safeAddress })
```

There are two versions of the Safe contracts: [GnosisSafe.sol](https://github.com/gnosis/safe-contracts/blob/v1.3.0/contracts/GnosisSafe.sol) that does not trigger events in order to afford some gas and [GnosisSafeL2.sol](https://github.com/gnosis/safe-contracts/blob/v1.3.0/contracts/GnosisSafeL2.sol) that does it and it is more appropriate for L2 networks.

By default `GnosisSafe.sol` will be only used on Ethereum Mainnet. For the rest of the networks where the Safe contracts are already deployed, the `GnosisSafeL2.sol` contract will be used unless you add the property `isL1SafeMasterCopy` to force the use of the `GnosisSafe.sol` contract.

```js
const safeFactory = await SafeFactory.create({ ethAdapter, isL1SafeMasterCopy: true })

const safeSdk = await Safe.create({ ethAdapter, safeAddress, isL1SafeMasterCopy: true })
```

If the Safe contracts are not deployed in your current network, the property `contractNetworks` will be required to point to the addresses of the Safe contracts previously deployed by you.

```js
import { ContractNetworksConfig } from '@gnosis.pm/safe-core-sdk'

const id = await ethAdapter.getChainId()
const contractNetworks: ContractNetworksConfig = {
  [id]: {
    multiSendAddress: '<MULTI_SEND_ADDRESS>',
    safeMasterCopyAddress: '<MASTER_COPY_ADDRESS>',
    safeProxyFactoryAddress: '<PROXY_FACTORY_ADDRESS>'
  }
}

const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })

const safeSdk = await Safe.create({ ethAdapter, safeAddress, contractNetworks })
```

The `SafeFactory` constructor also accepts the property `safeVersion` to specify the Safe contract version that will deploy. This string can take the values `1.1.1`, `1.2.0` or `1.3.0` and if not specified the last version will be used by default.

```js
const safeVersion = 'X.Y.Z'
const safeFactory = await SafeFactory.create({ ethAdapter, safeVersion })
```

## 3. Deploy a new Safe <a name="deploy-safe"></a>

The Safe Core SDK library allows to deploy new Safes using the `safeFactory` instance we just created.

Here, for example, we can create a new Safe account with 3 owners and 2 required signatures.

```js
import { SafeAccountConfig } from '@gnosis.pm/safe-core-sdk'

const safeAccountConfig: SafeAccountConfig = {
  owners: ['0x...', '0x...', '0x...']
  threshold: 2,
  // ... (optional params)
}
const safeSdk = await safeFactory.deploySafe(safeAccountConfig)
```

Calling the method `deploySafe` will deploy de desired Safe and return a Safe Core SDK initialized instance ready to be used.

## 4. Create a transaction <a name="create-transaction"></a>

The Safe Core SDK supports the execution of single Safe transactions but also MultiSend transactions. We can create a transaction object by calling the method `createTransaction` in our `Safe` instance.

* **Create a single transaction**

  This method can receive an object of type `SafeTransactionDataPartial` that represents the transaction we want to execute (once the signatures are collected). There are some optional properties in case we want to specify them.

  ```js
  import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'

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

* **Create a MultiSend transaction**

  This method can receive an array of `MetaTransactionData` objects that represent the multiple transactions we want to include in our MultiSend transaction. If we want to specify some of the optional properties in our MultiSend transaction we can pass a second argument to the method `createTransaction` with the `SafeTransactionOptionalProps` object.

  ```js
  import { SafeTransactionOptionalProps } from '@gnosis.pm/safe-core-sdk'
  import { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types'

  const transactions: MetaTransactionData[] = [
    {
      to,
      data,
      value,
      operation
    },
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


We can specify the `nonce` of our Safe transaction as long as it is not lower than the current Safe nonce. If multiple transactions are created but not executed they will share the same `nonce` if no `nonce` is specified, making valid the first transaction that gets executed and invalidating all the rest. We can prevent this by calling the method `getNextNonce` from the Safe Service Client instance. This method will take into account all the transactions that are queued and pending to be executed and calculate the next nonce, making it different for all the transactions.

```js
const nonce = await safeService.getNextNonce(safeAddress)
```

## 5. Propose the transaction to the service <a name="propose-transaction"></a>

Once we have the Safe transaction object we need to share it with the other owners of the Safe so they can sign it. To send the transaction to the Safe Transaction Service we need to call the method `proposeTransaction` from the Safe Service Client instance and pass an object with the properties:
- `safeAddress`: The Safe address.
- `safeTransaction`: The Safe transaction object returned from the method `createTransaction`. Make sure that this object includes the signature of the owner who is proposing it.
- `safeTxHash`: The Safe transaction hash, calculated by calling the method `getTransactionHash` from the Safe Core SDK.
- `senderAddress`: The Safe owner proposing the transaction.

```js
await safeSdk.signTransaction(safeTransaction)
const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
await safeService.proposeTransaction({
  safeAddress,
  safeTransaction,
  safeTxHash,
  senderAddress
})
```

## 6. Get the transaction from the service <a name="get-transaction"></a>

Now the Safe transaction is available on the Safe Transaction Service and the owners need to retrieve it by finding it in the list of pending transactions or getting if by its Safe transaction hash.

Get the list of pending transactions:

```js
const pendingTxs = await safeService.getPendingTransactions(safeAddress)
```

Get a specific transaction given its Safe transaction hash:

```js
const tx = await safeService.getTransaction(safeTxHash)
```

The retrieved transaction will have this type:

```
type SafeMultisigTransactionResponse = {
  safe: string
  to: string
  value: string
  data?: string
  operation: number
  gasToken: string
  safeTxGas: number
  baseGas: number
  gasPrice: string
  refundReceiver?: string
  nonce: number
  executionDate: string
  submissionDate: string
  modified: string
  blockNumber?: number
  transactionHash: string
  safeTxHash: string
  executor?: string
  isExecuted: boolean
  isSuccessful?: boolean
  ethGasPrice?: string
  gasUsed?: number
  fee?: number
  origin: string
  dataDecoded?: string
  confirmationsRequired: number
  confirmations?: [
    {
      owner: string
      submissionDate: string
      transactionHash?: string
      confirmationType?: string
      signature: string
      signatureType?: string
    },
    // ...
  ]
  signatures?: string
}
```

## 7. Confirm/reject the transaction <a name="confirm-transaction"></a>

The owners of the Safe can now sign the transaction obtained from the Safe Transaction Service by calling the method `signTransactionHash` from the Safe Core SDK to generate the signature and by calling the method `confirmTransaction` from the Safe Service Client to add the signature to the service.

```js
// transaction: SafeMultisigTransactionResponse

const hash = transaction.safeTxHash
let signature = await safeSdk.signTransactionHash(hash)
await safeService.confirmTransaction(hash, signature.data)
```

## 8. Execute the transaction <a name="execute-transaction"></a>

Once there are enough confirmations in the service the transaction is ready to be executed. The account that will execute the transaction needs to retrieve it from the service with all the required signatures and call the method `executeTransaction` from the Safe Core SDK.

The method `executeTransaction` expects an instance of the class `SafeTransaction` so the transaction needs to be transformed from the type `SafeMultisigTransactionResponse`.

```js
import { EthSignSignature } from '@gnosis.pm/safe-core-sdk'

// transaction: SafeMultisigTransactionResponse

const safeTransactionData: SafeTransactionData = {
  to: transaction.to,
  value: transaction.value,
  data: transaction.data,
  operation: transaction.operation,
  safeTxGas: transaction.safeTxGas,
  baseGas: transaction.baseGas,
  gasPrice: transaction.gasPrice,
  gasToken: transaction.gasToken,
  refundReceiver: transaction.refundReceiver,
  nonce: transaction.nonce
}
const safeTransaction = await safeSdk.createTransaction(safeTransactionData)
transaction.confirmations.forEach(confirmation => {
  const signature = new EthSignSignature(confirmation.owner, confirmation.signature)
  safeTransaction.addSignature(signature)
})

const executeTxResponse = await safeSdk.executeTransaction(safeTransaction)
const receipt = executeTxResponse.transactionResponse && (await executeTxResponse.transactionResponse.wait())
```

## 9. Interface checks <a name="interface-checks"></a>

During the process of collecting the signatures and executing the transaction some useful checks can be used in the interface to display or hide a button to confirm or execute the transaction depending on the current number of confirmations, the address of the accounts who confirmed the transaction and the Safe threshold:

Check if a Safe transaction is already sign by an owner:

```js
const isTransactionSignedByAddress = (signerAddress: string, transaction: SafeMultisigTransactionResponse) => {
  const confirmation = transaction.confirmations.find(confirmation => confirmation.owner === signerAddress)
  return !!confirmation
}
```

Check if a Safe transaction is ready to be executed:

```js
const isTransactionExecutable = (safeThreshold: number, transaction: SafeMultisigTransactionResponse) => {
  return transaction.confirmations.length >= safeThreshold
}
```
