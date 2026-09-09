# SDK Starter Kit

[![npm Version](https://badge.fury.io/js/%40safe-global%2Fsdk-starter-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fsdk-starter-kit)
[![GitHub Release](https://img.shields.io/github/release/safe-global/safe-core-sdk.svg?style=flat)](https://github.com/safe-global/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/safe-global/safe-core-sdk)](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md)

Higher-level client that wraps the [Protocol Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit) and [API Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit) so you can create, propose, confirm, and execute Safe transactions with less boilerplate.

## Table of contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [MultiSend / batch transactions](#multisend--batch-transactions)
- [Need Help or Have Questions?](#need-help-or-have-questions)
- [Contributing](#contributing)
- [License](#license)

## Installation

Install the package with yarn or npm:

```bash
yarn add @safe-global/sdk-starter-kit
npm install @safe-global/sdk-starter-kit
```

## Quick Start

```js
import { createSafeClient } from '@safe-global/sdk-starter-kit'

const safeClient = await createSafeClient({
  provider,
  signer,
  safeAddress,
  apiKey // Safe{Core} API key when using the Transaction Service
})

const txResult = await safeClient.send({
  transactions: [
    {
      to: '0x...',
      value: '0',
      data: '0x...'
    }
  ]
})
```

If the Safe threshold is greater than one, other owners confirm the pending transaction:

```js
await safeClient.confirm({ safeTxHash: txResult.transactions.safeTxHash })
```

## MultiSend / batch transactions

`send` accepts an array of transactions. When the array has more than one item, the Starter Kit uses the Protocol Kit to wrap them in a MultiSend batch automatically (same behaviour as `protocolKit.createTransaction({ transactions })`):

```js
const txResult = await safeClient.send({
  transactions: [
    { to: '0x...', value: '0', data: '0x...' },
    { to: '0x...', value: '0', data: '0x...' }
  ]
})
```

See the [MultiSend guide](https://github.com/safe-global/safe-core-sdk/blob/main/guides/multisend-transactions.md) for details on MultiSend vs MultiSendCallOnly and the lower-level Protocol Kit API.

## Need Help or Have Questions?

If you have any doubts, questions, or need assistance, feel free to reach out! [Here you will find how to get support.](https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md)

## Contributing

Please read our [contribution guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/CONTRIBUTING.md) before submitting any changes. We appreciate your help! 🙌

## <a name="license">License</a>

This library is [released under MIT](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md).
