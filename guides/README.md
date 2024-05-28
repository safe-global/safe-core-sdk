# Guide: Integrating the Safe Core SDK

## What is Safe

Read about the basics of Safe and [how it compares to other solutions](https://help.safe.global/en/articles/40869-what-is-safe).

## Safe Core SDK

The [Safe Core SDK](https://github.com/safe-global/safe-core-sdk) is a monorepo that contains software developer tools that allows interaction with [Safe Smart Accounts](https://github.com/safe-global/safe-smart-account) and the [Safe Transaction Service API](https://github.com/safe-global/safe-transaction-service).

In this guide we will use the following packages to deploy new Safes, create transactions, collect off-chain signatures and execute transactions:
* **safe-core-sdk-types**
  
  Contains the types that are shared among the different packages inside the monorepo.

* **protocol-kit**

  Offers most of the functionality of the Safe contracts. This library only interacts with the Safe contracts and every action then happens on-chain. Among others, it allows for actions such as:
    - Deploy new Safes
    - Get Safe information from the contracts (nonce, threshold, owners, modules, etc.)
    - Build Safe transaction objects that can be executed or batched
    - Approve Safe transactions on-chain
    - Execute Safe transactions once they have the required confirmations

  Check the complete [API reference](https://docs.safe.global/sdk/protocol-kit/reference) for more details.

* **api-kit**

  Consumes the Safe Transaction Service API. This library only interacts with this service and every action performed with it happens off-chain. Among others, it allows to execute actions like:
    - Get information of a Safe
    - Store a Safe transaction to allow for signature collection from owners
    - Add signatures to stored transactions
    - Get the transaction history of a Safe (and filter by pending, incoming, multisig transactions, etc.)
    - Get balances, list of tokens, etc.

  Check the complete [API reference](https://docs.safe.global/sdk/api-kit/reference) for more details.

## Prerequisites

We'll assume that you are familiar with TypeScript (JavaScript), Ethereum and have `node.js` and `npm` installed.

## Help

If you need help, please follow our support guidelines: https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md.

Let's jump into the guide: [Integrating the Safe Core SDK](/guides/integrating-the-safe-core-sdk.md)
