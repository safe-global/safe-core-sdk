# Safe API Kit

[![npm Version](https://badge.fury.io/js/%40safe-global%2Fapi-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fapi-kit)
[![GitHub Release](https://img.shields.io/github/release/safe-global/safe-core-sdk.svg?style=flat)](https://github.com/safe-global/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/safe-global/safe-core-sdk)](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md)

Software development kit that facilitates the interaction with the [Safe Transaction Service API](https://github.com/safe-global/safe-transaction-service), allowing to propose and share transactions with the other signers of a Safe, sending the signatures to the service to collect them, getting information about a Safe (like reading the transaction history, pending transactions, enabled Modules and Guards, etc.), among other features.

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
  chainId: 1n,
  // Optional. txServiceUrl must be used to set a custom service. For example on chains where Safe doesn't run services.
  txServiceUrl: 'https://safe-transaction-mainnet.safe.global'
})
```

## Need Help or Have Questions?

If you have any doubts, questions, or need assistance, feel free to reach out! [Here you will find how to get support.](https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md)

## Contributing

Please read our [contribution guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/CONTRIBUTING.md) before submitting any changes. We appreciate your help! 🙌

## License

This library is [released under MIT](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md).
