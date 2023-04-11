# Safe Core SDK Monorepo

[![Logo](https://raw.githubusercontent.com/safe-global/safe-core-sdk/main/assets/logo.png)](https://safe.global/)

![license](https://img.shields.io/github/license/safe-global/safe-core-sdk)

Software developer tools that facilitate the interaction with the Safe [contracts](https://github.com/safe-global/safe-contracts) and [services](https://github.com/safe-global/safe-transaction-service).

## Guides

| Title | Description |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Integrating the Safe Core SDK](https://github.com/safe-global/safe-core-sdk/blob/main/guides/integrating-the-safe-core-sdk.md) | This guide shows how to use the [Protocol Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit) and [API Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit). |

## Packages

| Package | Release | Description | 
| ------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [api-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit)                           | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fapi-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fapi-kit)                 | [Safe Transaction Service API](https://github.com/safe-global/safe-transaction-service) client library                                                                       |
| [auth-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/auth-kit)                         | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fauth-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fauth-kit)               | Typescript library to create an Ethereum address and authenticating a blockchain account using an email address, social media account, or traditional crypto wallets like Metamask   |
| [onramp-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/onramp-kit)                     | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fonramp-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fonramp-kit)           | Typescript library that allows users to buy cryptocurrencies using a credit card and other payment options                                                                           |
| [protocol-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit)                 | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit)       | TypeScript library that facilitates the interaction with the [Safe contracts](https://github.com/safe-global/safe-contracts)                                                |
| [relay-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/relay-kit)                       | ​​​[​![NPM Version](https://badge.fury.io/js/%40safe-global%2Frelay-kit.svg)​](https://badge.fury.io/js/%40safe-global%2Frelay-kit)​             | Library to abstract transaction fees payment (gas fees), allowing the use of native tokens or ERC-20​​                                                                                 |
| [safe-core-sdk-types](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk-types)   | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-types.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-types)  | Common types extracted from the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages) packages                                                   |
| [safe-ethers-adapters](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-ethers-adapters) | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-adapters.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-ethers-adapters) | [Ethers](https://docs.ethers.io/v5/single-page/) adapter that facilitates the interaction with the [Safe Services](https://github.com/safe-global/safe-transaction-service) |

## Playground

This project includes a [playground](https://github.com/safe-global/safe-core-sdk/tree/main/playground) with a few scripts that can be used as a starting point to use the Safe Core SDK. These scripts do not cover all the functionality exposed by the SDK, but each of them present steps of the Safe transaction flow.

Update the config inside the scripts and execute the following commands to run each step:

#### Step 1: Deploy a Safe

```bash
yarn play deploy-safe
```

#### Step 2: Propose a transaction

```bash
yarn play propose-transaction
```

#### Step 3: Confirm a transaction

```bash
yarn play confirm-transaction
```

#### Step 4: Execute a transaction

```bash
yarn play execute-transaction
```
