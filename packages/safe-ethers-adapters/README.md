# Safe Ethers Adapters

[![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-adapters.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-adapters)
[![GitHub](https://img.shields.io/github/license/safe-global/safe-core-sdk)](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md)

[Ethers](https://docs.ethers.io/v5/single-page/) adapter that facilitates the interaction with the [Safe Services](https://github.com/safe-global/safe-transaction-service)

## Getting Started

The only adapter currently provided is the `SafeEthersSigner` which implements the [`Signer` interface](https://docs.ethers.io/v5/api/signer/#Signer) from Ethers.

The `SafeEthersSigner` can be used with [Ethers Contracts](https://docs.ethers.io/v5/getting-started/#getting-started--contracts) to deploy and interact with them. Each of these interactions will create a Safe transaction that is published to the [Safe transaction service](https://docs.gnosis.io/safe/docs/services_transactions/). 

For this to work it is required to initialize the `SafeEthersSigner` with an account that is either an owner of the specified Safe or a [delegate](https://docs.gnosis.io/safe/docs/tutorial_tx_service_set_delegate/) of one of the owners.

An example for such an account would be the private key of one of the owners that is used with an [Ethers Wallet](https://docs.ethers.io/v5/api/signer/#Wallet)

```js
const signer = new Wallet("some_private_key", ethereumProvider)
```

It is also necessary to specify a service instance that should be used to publish the Safe transactions. An example for this would be the Mainnet instance of the [Safe Transaction Service](https://safe-transaction-mainnet.safe.global/): `https://safe-transaction-mainnet.safe.global/`

```js
const service = new SafeService("some_service_url")
```

A Safe instance must also be created before obtaining the signer.
It may be obtained with:

```js
import { ethers } from "ethers"
import Safe from "@safe-global/safe-core-sdk"
import EthersAdapter from "@safe-global/safe-ethers-lib"

const safe = await Safe.create({
  ethAdapter: new EthersAdapter({ ethers, signerOrProvider }),
  safeAddress: "some_safe_address"
})
```

Using these components it is possible to create an instance of the `SafeEthersSigner`

```js
const safeSigner = new SafeEthersSigner(safe, service, provider)
```

See [examples](/packages/safe-ethers-adapters/examples) for more information.

## Installation

Select correct nvm version:

```bash
nvm use
```

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

## License

This library is released under MIT.

## Contributors

- Richard Meisser ([rmeissner](https://github.com/rmeissner))
- Germán Martínez ([germartinez](https://github.com/germartinez))
