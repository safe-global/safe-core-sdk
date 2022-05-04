# Safe Web3 Lib

[![NPM Version](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-web3-lib.svg)](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-web3-lib)
[![GitHub Release](https://img.shields.io/github/release/safe-global/safe-core-sdk.svg?style=flat)](https://github.com/safe-global/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/safe-global/safe-core-sdk)](https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md)

Web3.js wrapper that contains some utilities and the Safe contracts types (generated with typechain web3-v1). It is used to initialize the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk).

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

If the app integrating the SDK is using `Web3`, create an instance of the `Web3Adapter`, where `signerAddress` is the Ethereum account we are connecting and the one who will sign the transactions.

```js
import Web3 from 'web3'
import Web3Adapter from '@gnosis.pm/safe-web3-lib'

const web3 = new Web3.providers.HttpProvider('http://localhost:8545')
const safeOwner = '0x<address>'

const ethAdapter = new Web3Adapter({
  web3,
  signerAddress: safeOwner
})
```

## <a name="license">License</a>

This library is released under MIT.

## <a name="contributors">Contributors</a>

- Germán Martínez ([germartinez](https://github.com/germartinez))
