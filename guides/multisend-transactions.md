# Guide: Batch transactions with MultiSend

Safe can execute several actions in a single Safe transaction by wrapping them with the [MultiSend](https://github.com/safe-global/safe-smart-account) library. The Protocol Kit does this for you when you pass more than one transaction to `createTransaction`. You do not need to call `encodeMultiSendData` yourself in normal application code.

## Table of contents

1. [How MultiSend works in the Protocol Kit](#how-multisend-works)
2. [Create a MultiSend transaction](#create-multisend)
3. [MultiSend vs MultiSendCallOnly](#multisend-vs-callonly)
4. [Propose, sign, and execute](#propose-sign-execute)
5. [SDK Starter Kit](#starter-kit)
6. [Helpers: encodeMultiSendData / decodeMultiSendData](#helpers)

## <a name="how-multisend-works">1. How MultiSend works in the Protocol Kit</a>

`createTransaction` always receives an array of `MetaTransactionData` objects:

- **One transaction** in the array: the Safe executes that call directly. No MultiSend wrapper is used.
- **Two or more transactions**: the Protocol Kit encodes them with MultiSend (or MultiSendCallOnly) and builds one Safe transaction that points at the MultiSend contract with a `DelegateCall` operation.

That single Safe transaction still needs the usual threshold of owner signatures before it can be executed.

## <a name="create-multisend">2. Create a MultiSend transaction</a>

```js
import Safe from '@safe-global/protocol-kit'
import { MetaTransactionData, OperationType } from '@safe-global/types-kit'

const protocolKit = await Safe.init({
  provider,
  signer,
  safeAddress
})

const transactions: MetaTransactionData[] = [
  {
    to: '0x...',
    value: '0',
    data: '0x...', // encoded calldata
    operation: OperationType.Call // optional, defaults to Call
  },
  {
    to: '0x...',
    value: '0',
    data: '0x...',
    operation: OperationType.Call
  }
]

const safeTransaction = await protocolKit.createTransaction({
  transactions
})
```

Optional gas and nonce fields can be passed through `options`:

```js
const safeTransaction = await protocolKit.createTransaction({
  transactions,
  options: {
    safeTxGas, // optional
    baseGas, // optional
    gasPrice, // optional
    gasToken, // optional
    refundReceiver, // optional
    nonce // optional
  }
})
```

For a longer end-to-end flow (propose via the API Kit, collect signatures, execute), see [Integrating the Safe Core SDK](./integrating-the-safe-core-sdk.md) and the [`createTransaction` reference](https://docs.safe.global/reference-sdk-protocol-kit/transactions/createtransaction).

## <a name="multisend-vs-callonly">3. MultiSend vs MultiSendCallOnly</a>

By default, `onlyCalls` is `true`. Batches then use the **MultiSendCallOnly** contract, which only allows `Call` operations inside the batch. That is the safer default for most apps.

If any inner transaction uses `OperationType.DelegateCall`, set `onlyCalls: false` so the kit uses the full **MultiSend** contract:

```js
const safeTransaction = await protocolKit.createTransaction({
  transactions,
  onlyCalls: false
})
```

If `onlyCalls` stays `true` and a transaction uses `DelegateCall`, `createTransaction` throws.

## <a name="propose-sign-execute">4. Propose, sign, and execute</a>

A MultiSend batch is still one Safe transaction. The propose / sign / execute steps are the same as for a single call:

```js
import SafeApiKit from '@safe-global/api-kit'

const apiKit = new SafeApiKit({ chainId })

const safeTxHash = await protocolKit.getTransactionHash(safeTransaction)
const senderSignature = await protocolKit.signHash(safeTxHash)

await apiKit.proposeTransaction({
  safeAddress,
  safeTransactionData: safeTransaction.data,
  safeTxHash,
  senderAddress,
  senderSignature: senderSignature.data
})

// After enough owners have confirmed:
const proposedTx = await apiKit.getTransaction(safeTxHash)
const executeTxResponse = await protocolKit.executeTransaction(proposedTx)
```

On a 1-of-1 Safe you can skip the service and call `signTransaction` / `executeTransaction` directly on the Protocol Kit instance.

## <a name="starter-kit">5. SDK Starter Kit</a>

[`@safe-global/sdk-starter-kit`](https://github.com/safe-global/safe-core-sdk/tree/main/packages/sdk-starter-kit) wraps the same path. Pass several transactions to `send` and the client builds a MultiSend batch through the Protocol Kit:

```js
import { createSafeClient } from '@safe-global/sdk-starter-kit'

const safeClient = await createSafeClient({
  provider,
  signer,
  safeAddress,
  apiKey
})

const txResult = await safeClient.send({
  transactions: [
    { to: '0x...', value: '0', data: '0x...' },
    { to: '0x...', value: '0', data: '0x...' }
  ]
})
```

If the Safe threshold is greater than one, other owners confirm with `safeClient.confirm({ safeTxHash })`.

## <a name="helpers">6. Helpers: encodeMultiSendData / decodeMultiSendData</a>

`encodeMultiSendData` and `decodeMultiSendData` are exported from `@safe-global/protocol-kit` for advanced or tooling use (for example inspecting already-encoded MultiSend calldata). Day-to-day apps should prefer `createTransaction` (Protocol Kit) or `send` (Starter Kit), which call the encoder internally and select the correct MultiSend contract.

```js
import { encodeMultiSendData, decodeMultiSendData } from '@safe-global/protocol-kit'

const encoded = encodeMultiSendData(transactions)
const decoded = decodeMultiSendData(multiSendCalldata)
```
