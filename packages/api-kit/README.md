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
  // Optional. Default chain of the requests, see Multi-chain below
  chainId: 1n,
  // Required when using the Safe hosted services. Get your API key at https://developer.safe.global
  apiKey: 'YOUR_API_KEY',
  // Optional. Custom service URLs, including the `/api` path, for example for self-hosted services
  // or chains where Safe doesn't run them.
  indexerServiceUrl: 'https://my-transaction-service.example.com/api',
  queueServiceUrl: 'https://my-queue-service.example.com/api',
  decoderServiceUrl: 'https://my-decoder-service.example.com/api'
})
```

Each client is created the first time it is used, and only its own service has to be configured. For example, a self-hosted Transaction Service without an API key can be used through `apiKit.indexer`; `apiKit.queue` and `apiKit.decoder` throw when accessed until their service is configured. `txServiceUrl` is still accepted as the former name of `indexerServiceUrl`.

The kit exposes one client per Safe service, with one method per endpoint:

- `apiKit.queue`: the Safe Queue Service, the off-chain queue of multisig transactions, messages and delegates.
- `apiKit.indexer`: the Safe Transaction Service, the data indexed from the chain (Safe accounts, history, transfers, tokens) and the ERC-4337 SafeOperations.
- `apiKit.decoder`: the Safe Decoder Service, transaction data decoding and known contracts.

```js
// Propose a transaction and confirm it from another owner
const { safeTxHash } = await apiKit.queue.proposeTransaction({
  safeAddress,
  safeTransactionData: safeTransaction.data,
  signatures: ownerSignature
})
await apiKit.queue.confirmTransaction(safeTxHash, otherOwnerSignature)

// Read the indexed Safe info and decode some data
const safeInfo = await apiKit.indexer.getSafeInfo(safeAddress)
const decoded = await apiKit.decoder.decodeData(data, to)
```

### Multi-chain

The Safe services are multi-chain, so one kit can work with every chain. The `chainId` of the config is only the default chain of the requests, and each method that depends on the chain accepts its own `chainId`. The chain of a request is, in order of precedence:

1. The `chainId` passed to the method.
2. The EIP-3770 prefix of the address (`eth:0x…`).
3. The `chainId` of the kit.

```js
const apiKit = new SafeApiKit({ apiKey })

await apiKit.queue.proposeTransaction({ safeAddress, safeTransactionData, signatures, chainId: 1n })
await apiKit.queue.getPendingTransactions(['eth:0x…', 'base:0x…'])
await apiKit.indexer.getSafeInfo(safeAddress, { chainId: 8453n })
await apiKit.decoder.decodeData(data, to, { chainId: 1n })

// Same configuration with another default chain
const mainnetApiKit = apiKit.forChain(1n)
```

Without a chain, the requests that store or sign something for a chain (`proposeTransaction`, `addMessage`, the delegates, `deleteTransaction`) and the hosted Transaction Service requests throw, while `getSafeTransactions` and `getMessages` return every chain. A Transaction Service indexes a single chain, so a custom `indexerServiceUrl` is only used for the `chainId` of the kit: requests for another chain throw.

## Need Help or Have Questions?

If you have any doubts, questions, or need assistance, feel free to reach out! [Here you will find how to get support.](https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md)

## Contributing

Please read our [contribution guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/CONTRIBUTING.md) before submitting any changes. We appreciate your help! 🙌

## License

This library is [released under MIT](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md).
