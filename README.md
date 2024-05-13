![license](https://img.shields.io/github/license/safe-global/safe-core-sdk) [![Coverage Status](https://coveralls.io/repos/github/safe-global/safe-core-sdk/badge.svg?branch=main)](https://coveralls.io/github/safe-global/safe-core-sdk?branch=main)

![Safe_Logos_Core_SDK_Black](https://github.com/safe-global/safe-core-sdk/assets/6764315/7202a24a-2981-4b31-9cf5-ace1c3b2c4fa)

## Table of contents

- [About](#about)
- [Documentation](#documentation)
- [Guides](#guides)
- [Packages](#packages)
- [Contributing](#contributing)
- [Playground](#playground)
- [License](#license)

## About

This is a mono-repository containing Javascript software developer tools that facilitate the interaction with the [Safe Smart Account](https://github.com/safe-global/safe-smart-account) and [services](https://github.com/safe-global/safe-transaction-service).

## Documentation

Visit [https://docs.safe.global/sdk/overview](https://docs.safe.global/sdk/overview) to view the full documentation.

## Guides

| Title | Description |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Integrating the Safe{Core} SDK](https://github.com/safe-global/safe-core-sdk/blob/main/guides/integrating-the-safe-core-sdk.md) | This guide shows how to use the [Protocol Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit) and [API Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit). |

## Packages

| Package | Release | Description | 
| ------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [api-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit)                           | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fapi-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fapi-kit)                 | [Safe Transaction Service API](https://github.com/safe-global/safe-transaction-service) client library                                                                       |
| [auth-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/auth-kit)                         | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fauth-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fauth-kit)               | Typescript library to create an Ethereum address and authenticating a blockchain account using an email address, social media account, or traditional crypto wallets like Metamask   |
| [onramp-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/onramp-kit)                     | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fonramp-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fonramp-kit)           | Typescript library that allows users to buy cryptocurrencies using a credit card and other payment options                                                                           |
| [protocol-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit)                 | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit)       | TypeScript library that facilitates the interaction with the [Safe contracts](https://github.com/safe-global/safe-contracts)                                                |
| [relay-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/relay-kit)                       | ​​​[​![NPM Version](https://badge.fury.io/js/%40safe-global%2Frelay-kit.svg)​](https://badge.fury.io/js/%40safe-global%2Frelay-kit)​             | Library to abstract transaction fees payment (gas fees), allowing the use of native tokens or ERC-20​​                                                                                 |
| [safe-core-sdk-types](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk-types)   | [![NPM Version](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-types.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-types)  | Common types extracted from the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages) packages                                                   |

## Contributing

If you are interested in contributing, please read the [Contributing Guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/CONTRIBUTING.md) **before opening an issue or submitting a pull request**.

## Playground

This project includes a [playground](https://github.com/safe-global/safe-core-sdk/tree/main/playground/README.md) with a few scripts that can be used as a starting point to use the Safe{Core} SDK.

## License

This library is released under [MIT](https://github.com/safe-global/safe-core-sdk/tree/main/LICENSE.md).
