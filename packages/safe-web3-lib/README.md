# Safe Web3 Lib

[![NPM Version](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-web3-lib.svg)](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-web3-lib)
[![GitHub Release](https://img.shields.io/github/release/gnosis/safe-core-sdk.svg?style=flat)](https://github.com/gnosis/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/gnosis/safe-core-sdk)](https://github.com/gnosis/safe-core-sdk/blob/main/LICENSE.md)

Web3.js wrapper that contains some utilities and the Safe contracts types (generated with typechain web3-v1) used to initialize the [Safe Core SDK](https://github.com/gnosis/safe-core-sdk/tree/main/packages/safe-core-sdk).

## Table of contents
* [Installation](#installation)
* [Build](#build)
* [Initialization](#initialization)

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