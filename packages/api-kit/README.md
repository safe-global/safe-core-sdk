# Safe API Kit

[![npm Version](https://badge.fury.io/js/%40safe-global%2Fapi-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fapi-kit)
[![GitHub Release](https://img.shields.io/github/release/safe-global/safe-core-sdk.svg?style=flat)](https://github.com/safe-global/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/safe-global/safe-core-sdk)](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md)

Software development kit that facilitates the interaction with the Safe services: the Safe Queue Service (transaction proposals, confirmations, off-chain messages and delegates), the [Safe Transaction Service](https://github.com/safe-global/safe-transaction-service) (Safe info, transaction history, tokens, SafeOperations) and the Safe Decoder Service (data decoding). It allows to propose and share transactions with the other signers of a Safe, sending the signatures to the service to collect them, getting information about a Safe (like reading the transaction history, pending transactions, enabled Modules and Guards, etc.), among other features.

## Table of contents

- [Documentation](#documentation)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Need Help or Have Questions?](#need-help-or-have-questions)
- [Contributing](#contributing)
- [License](#license)

## Documentation

Head to the [API Kit docs](https://docs.safe.global/sdk/api-kit) to learn more about how to use this SDK.

## Installation

Install the package with yarn or npm:

```bash
yarn add @safe-global/api-kit
npm install @safe-global/api-kit
```

## Quick Start

```js
import SafeApiKit from '@safe-global/api-kit'

const apiKit = new SafeApiKit({
  // Required when using the Safe hosted services, and only sent to them. Get your API key at https://developer.safe.global
  apiKey: 'YOUR_API_KEY',
  // Optional. Transaction Service URL of some chains, including the `/api` path, for example for
  // self-hosted services or chains where Safe doesn't run them. The other chains use the Safe hosted service.
  indexerUrls: [{ chainId: 11155111n, url: 'https://my-transaction-service.example.com/api' }],
  // Optional. Custom multi-chain service URLs, including the `/api` path
  queueServiceUrl: 'https://my-queue-service.example.com/api',
  decoderServiceUrl: 'https://my-decoder-service.example.com/api'
})
```

The kit has no chain: each request carries its own, see [Multi-chain](#multi-chain). Each client is created the first time it is used, and only its own service has to be configured. For example, a self-hosted Transaction Service without an API key can be used through `apiKit.indexer`; `apiKit.queue` and `apiKit.decoder` throw when accessed until their service is configured.

Note that proposals, confirmations, messages and delegates are handled by the Queue Service, and data decoding by the Decoder Service, not by the Transaction Service. A self-hosted Transaction Service alone only serves `apiKit.indexer`: to use `apiKit.queue` and `apiKit.decoder` you need the API key of the Safe hosted services or your own `queueServiceUrl` and `decoderServiceUrl`.

The kit exposes one client per Safe service, with one method per endpoint:

- `apiKit.queue`: the Safe Queue Service, the off-chain queue of multisig transactions, messages and delegates.
- `apiKit.indexer`: the Safe Transaction Service, the data indexed from the chain (Safe accounts, executed history, transfers, tokens) and the ERC-4337 SafeOperations.
- `apiKit.decoder`: the Safe Decoder Service, transaction data decoding and known contracts.

The queue and the indexer both return multisig transactions. `apiKit.queue` is the off-chain queue: proposals, confirmations and the status of the transactions. `apiKit.indexer` is what has been indexed from the chain: `getTransaction` and `getMultisigTransactions` return the execution data (`executionDate`, `blockNumber`, `transactionHash`, `gasUsed`, `fee`...) and include the transactions executed without an off-chain proposal, which the queue has no record of.

```js
// Propose a transaction and confirm it from another owner
const { safeTxHash } = await apiKit.queue.proposeTransaction({
  safeAddress,
  safeTransactionData: safeTransaction.data,
  signatures: ownerSignature,
  chainId: 11155111n
})
await apiKit.queue.confirmTransaction(safeTxHash, otherOwnerSignature)

// Read the indexed Safe info and decode some data
const safeInfo = await apiKit.indexer.getSafeInfo(safeAddress, { chainId: 11155111n })
const decoded = await apiKit.decoder.decodeData(data, to, { chainId: 11155111n })
```

### Multi-chain

The Safe services are multi-chain, so one kit works with every chain. The chain of a request is the `chainId` passed to the method. An EIP-3770 prefix in an address (`eth:0x…`) is only accepted together with `chainId`, and must match it; without `chainId` the addresses are plain.

```js
const apiKit = new SafeApiKit({ apiKey })

// Writes: `chainId` is required
await apiKit.queue.proposeTransaction({ safeAddress, safeTransactionData, signatures, chainId: 1n })
await apiKit.queue.addMessage(safeAddress, { message, signatures, chainId: 1n })
await apiKit.queue.addDelegate({ delegateAddress, delegatorAddress, signer, label, chainId: 1n })
await apiKit.queue.addDelegate({
  delegateAddress,
  delegatorAddress,
  signer,
  label,
  allChains: true
})

// Queue reads: without a chain they return every chain
await apiKit.queue.getSafeTransactions(safeAddress)
await apiKit.queue.getSafeTransactions('eth:0x…', { chainId: 1n })
await apiKit.queue.getSafeTransactions('eth:0x…') // throws: the prefix needs the chainId
await apiKit.queue.getTransactions({
  safes: [
    { address: safeAddress, chainIds: [1n] },
    { address: otherSafeAddress, chainIds: [8453n] }
  ],
  executed: false
})
// The pending transactions need the chain of every Safe
await apiKit.queue.getPendingTransactions([safeAddress, otherSafeAddress], { chainId: 1n })

// Indexer: `chainId` is required in every method. An EIP-3770 prefix must match it
await apiKit.indexer.getSafeInfo(safeAddress, { chainId: 8453n })
await apiKit.indexer.getSafeInfo('base:0x…', { chainId: 8453n })
await apiKit.indexer.getServiceInfo({ chainId: 8453n })
// Executed history, with the execution data of each transaction
await apiKit.indexer.getMultisigTransactions(safeAddress, { executed: true, chainId: 8453n })
await apiKit.indexer.getTransaction(safeTxHash, { chainId: 8453n })

// Decoder: the chain is optional
await apiKit.decoder.decodeData(data, to, { chainId: 1n })
```

The confirmations (`confirmTransaction`, `confirmMessage`) and the other requests by hash in the Queue Service don't need a chain.

A Transaction Service indexes a single chain, so `apiKit.indexer` sends each request to the service of its chain: the `indexerUrls` entry of the chain, or the Safe hosted service. A chain without an `indexerUrls` entry needs the `apiKey`, and throws when Safe doesn't run a Transaction Service for it. `apiKit.getIndexerUrls()` returns the URL of every chain the indexer can be used with: the `indexerUrls` entries and, with an `apiKey`, the Safe hosted service of the other chains.

```js
const apiKit = new SafeApiKit({
  apiKey,
  indexerUrls: [
    { chainId: 11155111n, url: 'https://my-sepolia-indexer.example.com/api' },
    { chainId: 123456789n, url: 'https://my-chain-indexer.example.com/api' }
  ]
})

await apiKit.indexer.getSafeInfo(safeAddress, { chainId: 11155111n }) // my-sepolia-indexer
await apiKit.indexer.getSafeInfo(safeAddress, { chainId: 1n }) // Safe hosted service

// The indexers available to the kit, `[{ chainId, url }]`
const indexerUrls = apiKit.getIndexerUrls()
```

## Need Help or Have Questions?

If you have any doubts, questions, or need assistance, feel free to reach out! [Here you will find how to get support.](https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md)

## Contributing

Please read our [contribution guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/CONTRIBUTING.md) before submitting any changes. We appreciate your help! 🙌

## License

This library is [released under MIT](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md).
