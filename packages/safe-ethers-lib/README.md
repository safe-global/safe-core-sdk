# Safe Ethers Lib

[![NPM Version](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-ethers-lib.svg)](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-ethers-lib)
[![GitHub Release](https://img.shields.io/github/release/gnosis/safe-core-sdk.svg?style=flat)](https://github.com/gnosis/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/gnosis/safe-core-sdk)](https://github.com/gnosis/safe-core-sdk/blob/main/LICENSE.md)

Ethers.js wrapper that contains some utilities and the Safe contracts types (generated with typechain ethers-v5) used to initialize the [Safe Core SDK](https://github.com/gnosis/safe-core-sdk/tree/main/packages/safe-core-sdk).

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
import { ethers } from 'ethers'
import EthersAdapter from '@gnosis.pm/safe-ethers-lib'

const web3Provider = // ...
const provider = new ethers.providers.JsonRpcProvider(web3Provider)
const safeOwner = provider.getSigner(0)

const ethAdapter = new EthersAdapter({
  ethers,
  signer: safeOwner
})
```