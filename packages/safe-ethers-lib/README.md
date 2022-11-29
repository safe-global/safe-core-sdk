# Safe Ethers Lib

[![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-lib.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-lib)
[![GitHub Release](https://img.shields.io/github/release/safe-global/safe-core-sdk.svg?style=flat)](https://github.com/safe-global/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/safe-global/safe-core-sdk)](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md)

Ethers.js wrapper that contains some utilities and the Safe contracts types (generated with typechain ethers-v5). It is used to initialize the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk).

## Table of contents
* [Installation](#installation)
* [Build](#build)
* [Initialization](#initialization)
* [License](#license)
* [Contributors](#contributors)

## <a name="installation">Installation</a>

Install the package with yarn or npm:

```bash
yarn install
npm install
```

## <a name="build">Build</a>

Build the package with yarn or npm:

```bash
yarn build
npm build
```

## <a name="initialization">Initialization</a>

If the app integrating the SDK is using `Ethers` `v5`, create an instance of the `EthersAdapter`, where `signer` is the Ethereum account we are connecting and the one who will sign the transactions.

```js
import { ethers } from 'ethers'
import EthersAdapter from '@safe-global/safe-ethers-lib'

const web3Provider = // ...
const provider = new ethers.providers.Web3Provider(web3Provider)
const safeOwner = provider.getSigner(0)

const ethAdapter = new EthersAdapter({
  ethers,
  signerOrProvider: safeOwner
})
```

Depending on whether the `ethAdapter` instance is used to sign/execute transactions or just call read-only methods, the `signerOrProvider` property can be a `Signer` or a `Provider`.

## <a name="license">License</a>

This library is released under MIT.

## <a name="contributors">Contributors</a>

- Germán Martínez ([germartinez](https://github.com/germartinez))
