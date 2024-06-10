# Protocol Kit

[![npm Version](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit)
[![GitHub Release](https://img.shields.io/github/release/safe-global/safe-core-sdk.svg?style=flat)](https://github.com/safe-global/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/safe-global/safe-core-sdk)](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md)

Software development kit that facilitates the interaction with [Safe Smart Accounts](https://github.com/safe-global/safe-smart-account) using a TypeScript interface. This Kit can be used to create new Safe accounts, update the configuration of existing Safes, create and execute transactions, among other features.

## Table of contents

- [Documentation](#documentation)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Need Help or Have Questions?](#need-help-or-have-questions)
- [Contributing](#contributing)
- [License](#license)

## Documentation

Head to the [Protocol Kit docs](https://docs.safe.global/sdk/protocol-kit) to learn more about how to use this SDK.

## Installation

Install the package with yarn or npm:

```bash
yarn add @safe-global/protocol-kit
npm install @safe-global/protocol-kit
```

## Quick Start

- `provider`: You can set an EIP-1193 compatible provider or an HTTP/WebSocket RPC URL.
- `signer`: This is an optional parameter. It should be the provider's address you want to use or a private key. If not set, it will try to fetch a connected account from the provider.

Loading an already deployed Safe, using the `safeAddress` property:

```js
import Safe from '@safe-global/protocol-kit'

const protocolKit = await Safe.init({
  provider,
  signer,
  safeAddress
})
```

Initialization of an undeployed Safe using the `predictedSafe` property. Because Safes are deployed in a deterministic way, passing a `predictedSafe` will allow to initialize the SDK with the Safe configuration and use it to some extent before it's deployed:

```js
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit'

const predictedSafe: PredictedSafeProps = {
  safeAccountConfig,
  safeDeploymentConfig
}

const protocolKit = await Safe.init({
  provider,
  signer,
  predictedSafe
})
```

## Need Help or Have Questions?

If you have any doubts, questions, or need assistance, feel free to reach out! [Here you will find how to get support.](https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md)

## Contributing

Please read our [contribution guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/CONTRIBUTING.md) before submitting any changes. We appreciate your help! 🙌

## License

This library is [released under MIT](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md).
