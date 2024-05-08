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

## <a name="install-dependencies">1. Install the dependencies</a>

To integrate the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk) into your Dapp or script you will need to install these dependencies:

```
@safe-global/safe-core-sdk-types
@safe-global/protocol-kit
@safe-global/api-kit
```

## <a name="initialize-sdks">2. Initialize the SDK’s</a>

### Select your Ethereum `provider` and `signer`

To use our kits, you need to provide an Ethereum provider and a signer. The provider is the connection to the Ethereum network, while the signer is an account that will sign the transactions (a Safe owner). When using an injected provider like MetaMask, the signer is the account selected in the wallet.

In the examples below, you can see `provider` and `signer` properties, which represent:

- `provider`: You can provide an EIP-1193 compatible provider or an HTTP/WebSocket RPC URL.
- `signer`: This is an optional parameter. It should be the provider's address you want to use or a private key. If not set, it will try to fetch a connected account from the provider.

### Initialize the Safe API Kit

As stated in the introduction, the [Safe API Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit) consumes the [Safe Transaction Service API](https://github.com/safe-global/safe-transaction-service). To start using this library, create a new instance of the `SafeApiKit` class, imported from `@safe-global/api-kit` and pass the URL to the constructor of the Safe Transaction Service you want to use depending on the network.

```js
import SafeApiKit from '@safe-global/api-kit'

const safeService = new SafeApiKit({ chainId })
```

Using the `chainId` is enough for chains where Safe runs a Transaction Service. For those chains where Safe doesn't run a service, use the `txServiceUrl` parameter to set the custom service endpoint.

```js
const safeService = new SafeApiKit({
  chainId,
  txServiceUrl: 'https://txServiceUrl.com'
})
```

### Initialize the Protocol Kit

```js
import Safe, { SafeFactory } from '@safe-global/protocol-kit'

const safeFactory = await SafeFactory.create({ provider, signer })

const safeSdk = await Safe.create({ provider, signer, safeAddress })
```

There are two versions of the Safe contracts: [Safe.sol](https://github.com/safe-global/safe-contracts/blob/v1.4.1/contracts/Safe.sol) that does not trigger events in order to save gas and [SafeL2.sol](https://github.com/safe-global/safe-contracts/blob/v1.4.1/contracts/SafeL2.sol) that does, which is more appropriate for L2 networks.

By default `Safe.sol` will be only used on Ethereum Mainnet. For the rest of the networks where the Safe contracts are already deployed, the `SafeL2.sol` contract will be used unless you add the property `isL1SafeSingleton` to force the use of the `Safe.sol` contract.

```js
const safeFactory = await SafeFactory.create({ provider, signer, isL1SafeSingleton: true })

const safeSdk = await Safe.create({ provider, signer, safeAddress, isL1SafeSingleton: true })
```

If the Safe contracts are not deployed to your current network, the property `contractNetworks` will be required to point to the addresses of the Safe contracts previously deployed by you.

```js
import { ContractNetworksConfig, SafeProvider } from '@safe-global/protocol-kit'

const safeProvider = new SafeProvider({ provider, signer })
const chainId = await safeProvider.getChainId()
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

const safeFactory = await SafeFactory.create({ provider, signer, contractNetworks })

const safeSdk = await Safe.create({ provider, signer, safeAddress, contractNetworks })
```

The `SafeFactory` constructor also accepts the property `safeVersion` to specify the Safe contract version that will be deployed. This string can take the values `1.0.0`, `1.1.1`, `1.2.0`, `1.3.0` or `1.4.1`. If not specified, the `DEFAULT_SAFE_VERSION` value will be used.

```js
const safeVersion = 'X.Y.Z'
const safeFactory = await SafeFactory.create({ provider, signer, safeVersion })
```

## <a name="deploy-safe">3. Deploy a new Safe</a>

The Protocol Kit library allows the deployment of new Safes using the `safeFactory` instance we just created.

Here, for example, we can create a new Safe account with 3 owners and 2 required signatures.

```js
import { SafeAccountConfig } from '@safe-global/protocol-kit'

const safeAccountConfig: SafeAccountConfig = {
  owners: ['0x...', '0x...', '0x...']
  threshold: 2,
  // ... (optional params)
}
const safeSdk = await safeFactory.deploySafe({ safeAccountConfig })
```

Calling the method `deploySafe` will deploy the desired Safe and return a Protocol Kit initialized instance ready to be used. Check the [API Reference](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit#deploysafe) for more details on additional configuration parameters and callbacks.

## <a name="create-transaction">4. Create a transaction</a>

The Protocol Kit supports the execution of single Safe transactions but also MultiSend transactions. We can create a transaction object by calling the method `createTransaction` in our `Safe` instance.

This method takes an array of `MetaTransactionData` objects that represent the individual transactions we want to include in our MultiSend transaction. If we want to specify some of the optional properties in our MultiSend transaction, we can pass a second argument to the method `createTransaction` with the `SafeTransactionOptionalProps` object.

When the array contains only one transaction, it is not wrapped in the MultiSend.

```js
import { SafeTransactionOptionalProps } from '@safe-global/protocol-kit'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'

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

We can specify the `nonce` of our Safe transaction as long as it is not lower than the current Safe nonce. If multiple transactions are created but not executed they will share the same `nonce` if no `nonce` is specified, validating the first executed transaction and invalidating all the rest. We can prevent this by calling the method `getNextNonce` from the Safe API Kit instance. This method takes all queued/pending transactions into account when calculating the next nonce, creating a unique one for all different transactions.

```js
const nonce = await safeService.getNextNonce(safeAddress)
```

## <a name="propose-transaction">5. Propose the transaction to the service</a>

Once we have the Safe transaction object we can share it with the other owners of the Safe so they can sign it. To send the transaction to the Safe Transaction Service we need to call the method `proposeTransaction` from the Safe API Kit instance and pass an object with the properties:

- `safeAddress`: The Safe address.
- `safeTransactionData`: The `data` object inside the Safe transaction object returned from the method `createTransaction`.
- `safeTxHash`: The Safe transaction hash, calculated by calling the method `getTransactionHash` from the Protocol Kit.
- `senderAddress`: The Safe owner or delegate proposing the transaction.
- `senderSignature`: The signature generated by signing the `safeTxHash` with the `senderAddress`.
- `origin`: Optional string that allows to provide more information about the app proposing the transaction.

```js
const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
const senderSignature = await safeSdk.signHash(safeTxHash)
await safeService.proposeTransaction({
  safeAddress,
  safeTransactionData: safeTransaction.data,
  safeTxHash,
  senderAddress,
  senderSignature: senderSignature.data,
  origin
})
```

## <a name="get-transaction">6. Get the transaction from the service</a>

The transaction is then available on the Safe Transaction Service and the owners can retrieve it by finding it in the pending transaction list, or by getting its Safe transaction hash.

Get a list of pending transactions:

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
  fee?: string
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

## <a name="confirm-transaction">7. Confirm/reject the transaction</a>

The owners of the Safe can now sign the transaction obtained from the Safe Transaction Service by calling the method `signHash` from the Protocol Kit to generate the signature and by calling the method `confirmTransaction` from the Safe API Kit to add the signature to the service.

```js
// transaction: SafeMultisigTransactionResponse

const hash = transaction.safeTxHash
let signature = await safeSdk.signHash(hash)
await safeService.confirmTransaction(hash, signature.data)
```

## <a name="execute-transaction">8. Execute the transaction</a>

Once there are enough confirmations in the service the transaction is ready to be executed. The account that will execute the transaction needs to retrieve it from the service with all the required signatures and call the method `executeTransaction` from the Protocol Kit.

The method `executeTransaction` accepts an instance of the class `SafeTransaction` so the transaction needs to be transformed from the type `SafeMultisigTransactionResponse`.

```js
const safeTransaction = await safeService.getTransaction(...)
const executeTxResponse = await safeSdk.executeTransaction(safeTransaction)
const receipt = executeTxResponse.transactionResponse && (await executeTxResponse.transactionResponse.wait())
```

Optionally, the `isValidTransaction` method, that returns a boolean value, could be called right before the `executeTransaction` method to check if the transaction will be executed successfully or not.

```js
const isValidTx = await safeSdk.isValidTransaction(safeTransaction)
```

## <a name="interface-checks">9. Interface checks</a>

During the process of collecting the signatures/executing transactions, some useful checks can be made in the interface to display or hide a button to confirm or execute the transaction depending on the current number of confirmations, the address of accounts that confirmed the transaction and the Safe threshold:

Check if a Safe transaction is already signed by an owner:

```js
const isTransactionSignedByAddress = (
  signerAddress: string,
  transaction: SafeMultisigTransactionResponse
) => {
  const confirmation = transaction.confirmations.find(
    (confirmation) => confirmation.owner === signerAddress
  )
  return !!confirmation
}
```

Check if a Safe transaction is ready to be executed:

```js
const isTransactionExecutable = (
  safeThreshold: number,
  transaction: SafeMultisigTransactionResponse
) => {
  return transaction.confirmations.length >= safeThreshold
}
```
