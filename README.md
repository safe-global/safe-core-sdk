# Safe Core SDK Monorepo

[![Logo](https://raw.githubusercontent.com/gnosis/safe-core-sdk/main/assets/logo.png)](https://gnosis-safe.io/)

Software developer tools that facilitate the interaction with the Safe [contracts](https://github.com/safe-global/safe-contracts) and [services](https://github.com/safe-global/safe-transaction-service).

## Guides

| Title | Description |
| ------- | ----------- |
| [Integrating the Safe Core SDK](https://github.com/safe-global/safe-core-sdk/blob/main/guides/integrating-the-safe-core-sdk.md) | This guide shows how to use the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk) and [Safe Service Client](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-service-client). |

## Packages

| Package | Release | Description |
| ------- | :-----: | ----------- |
| [safe-core-sdk](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk) | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk) | TypeScript library that facilitates the interaction with the [Safe contracts](https://github.com/safe-global/safe-contracts) |
[safe-core-sdk-types](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk-types) | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-types.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-types) | Common types extracted from the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages) packages |
[safe-core-sdk-utils](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk-utils) | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-utils.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-utils) | Utilities for the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages) packages |
[safe-ethers-lib](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-ethers-lib) | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-lib.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-lib) | Ethers.js utilities and Safe contracts types (typechain ethers-v5) used to initialize the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk) |
[safe-web3-lib](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-web3-lib) | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-web3-lib.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-web3-lib) | Web3.js utilities and Safe contracts types (typechain web3-v1) used to initialize the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk) |
[safe-service-client](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-service-client) | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-service-client.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-service-client) | [Safe Transaction Service API](https://github.com/safe-global/safe-transaction-service) client library |
[safe-ethers-adapters](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-ethers-adapters) | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-adapters.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-adapters) | [Ethers](https://docs.ethers.io/v5/single-page/) adapter that facilitates the interaction with the [Safe Services](https://github.com/safe-global/safe-transaction-service) |

## Playground

This project includes a [playground](https://github.com/safe-global/safe-core-sdk/tree/main/playground) with a few scripts that can be used as a starting point to play around with the Safe Core SDK. These scripts does not cover all the functionality exposed by the SDK, but each of them present one of the steps involved in the Safe transaction flow.

Update the config inside the scripts and execute the following commands to run each step:

#### Step 1: Deploy a Safe
```bash
yarn play deploy-safe
```

#### Step 2: Propose the transaction
```bash
yarn play propose-transaction
```

#### Step 3: Confirm the transaction
```bash
yarn play confirm-transaction
```

#### Step 4: Execute the transaction
```bash
yarn play execute-transaction
```
