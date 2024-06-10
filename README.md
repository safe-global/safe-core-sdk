![license](https://img.shields.io/github/license/safe-global/safe-core-sdk) [![Coverage Status](https://coveralls.io/repos/github/safe-global/safe-core-sdk/badge.svg?branch=main)](https://coveralls.io/github/safe-global/safe-core-sdk?branch=main)

![Safe_Logos_Core_SDK_Black](https://github.com/safe-global/safe-core-sdk/assets/6764315/7202a24a-2981-4b31-9cf5-ace1c3b2c4fa)

## Table of contents

- [About](#about)
- [Documentation](#documentation)
- [Packages](#packages)
- [Guides](#guides)
- [Need Help or Have Questions?](#need-help-or-have-questions)
- [Contributing](#contributing)
- [Playground](#playground)
- [License](#license)

## About

This is a mono-repository containing Javascript/Typescript software developer tools that facilitate the interaction with [Safe Smart Accounts](https://github.com/safe-global/safe-smart-account), [Safe Transaction Service API](https://github.com/safe-global/safe-transaction-service), and enabling uses like ERC-4337 compatibility.

## Documentation

If you want to develop using Safe Smart Accounts in a Javascript/Typescript app, we recommend that you visit [our documentation site](https://docs.safe.global/sdk/overview).

## Packages

| Package | Release | Description |
| ------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [protocol-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit)                 | [![npm Version](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fprotocol-kit)       | TypeScript library that facilitates the interaction with [Safe Smart Accounts](https://github.com/safe-global/safe-smart-account). Can be used to create new Safe accounts, update the configuration of existing Safes, create and execute transactions, among other features.                                              |
| [api-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit)                           | [![npm Version](https://badge.fury.io/js/%40safe-global%2Fapi-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fapi-kit)                 | [Safe Transaction Service API](https://github.com/safe-global/safe-transaction-service) typescript library. Allows to propose and share transactions with the other signers of a Safe, sending the signatures to the service to collect them, and getting information about a Safe, among other features.                                                                       |
| [relay-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/relay-kit)                       | ​​​[​![npm Version](https://badge.fury.io/js/%40safe-global%2Frelay-kit.svg)​](https://badge.fury.io/js/%40safe-global%2Frelay-kit)​             | Typescript library that enables ERC-4337 with Safe and allows users to pay for the transaction fees from their Safe account balance using the blockchain native token or ERC-20 tokens, or to get their transactions sponsored.                                                                            |
| [safe-core-sdk-types](https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk-types)   | [![npm Version](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-types.svg)](https://badge.fury.io/js/%40safe-global%2Fsafe-core-sdk-types)  | Common types used in the [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/tree/main/packages) packages.                                                  |
| [auth-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/auth-kit)                         | [![npm Version](https://badge.fury.io/js/%40safe-global%2Fauth-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fauth-kit)               | Typescript library to create an Ethereum address and authenticating a blockchain account using an email address, social media account, or traditional crypto wallets like Metamask.  |
| [onramp-kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/onramp-kit)                     | [![npm Version](https://badge.fury.io/js/%40safe-global%2Fonramp-kit.svg)](https://badge.fury.io/js/%40safe-global%2Fonramp-kit)           | Typescript library that allows users to buy cryptocurrencies using a credit card and other payment options.                                                                           |

## Guides

| Title | Description |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Integrating the Safe{Core} SDK](https://github.com/safe-global/safe-core-sdk/blob/main/guides/integrating-the-safe-core-sdk.md) | This guide shows how to use the [Protocol Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit) and [API Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit). |

## Need Help or Have Questions?

If you have any doubts, questions, or need assistance, feel free to reach out! [Here you will find how to get support.](https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md)

## Contributing

If you are interested in contributing, please read the [Contributing Guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/CONTRIBUTING.md) **before opening an issue or submitting a pull request**.

## Playground

This project includes a [playground](https://github.com/safe-global/safe-core-sdk/tree/main/playground/README.md) with a few scripts that can be used as a starting point to use the Safe{Core} SDK.

## License

This library is released under [MIT](https://github.com/safe-global/safe-core-sdk/tree/main/LICENSE.md).
