# Guide: Integrating the Safe Core SDK

## What is Gnosis Safe

Read about the basics of Gnosis Safe and how it compares to other solutions [here](https://help.gnosis-safe.io/en/articles/3876456-what-is-gnosis-safe).

## Safe Core SDK

The [Safe Core SDK](https://github.com/gnosis/safe-core-sdk) is a monorepo that contains a set of software developer tools that facilitate the interaction with the [Safe contracts](https://github.com/gnosis/safe-contracts) and the [Safe Transaction Service](https://github.com/gnosis/safe-transaction-service).

In this guide we will be using the following packages to deploy new Safes, create transactions, collect the signatures off-chain and execute those transactions:

* **safe-core-sdk-types**
  
  Contains the types that are shared among the different packages inside the monorepo.

* **safe-core-sdk**

  Offers most of the functionality of the Safe contracts. This library only interacts with the Safe contracts and every action performed with it happens on-chain. Among others, it allows to execute actions like:
    - Deploy new Safes
    - Get information of a Safe from the contracts (nonce, threshold, owners, modules, etc.)
    - Build Safe transaction objects that can be single or batch transactions
    - Approve Safe transactions on-chain
    - Execute Safe transactions once they have the required confirmations

  Check the complete [API reference](/packages/safe-core-sdk#api-reference) for more details.

* **safe-service-client**

  Consumes the Safe Transaction Service API. This library only interacts with this service and every action performed with it happens off-chain. Among others, it allows to execute actions like:
    - Get information of a Safe from the service (nonce, threshold, owners, modules, etc.)
    - Store a Safe transaction in the service to allow collecting the signatures from the owners
    - Add signatures to the stored transactions
    - Get the transaction history of a Safe (and filter by pending, incoming, multisig transactions, etc.)
    - Get balances, list of tokens, etc.

  Check the complete [API reference](/packages/safe-service-client#api-reference) for more details.

## Prerequisites

We'll assume that you are familiar with TypeScript (JavaScript) and Ethereum and have `node.js` and `npm` installed.

## Help

If you need help, you can reach Gnosis Safe developers in the #safe-developers channel in https://chat.gnosis.io/ or create a discussion in https://github.com/gnosis/safe-core-sdk/discussions.

Let's jump into the guide: [Integrating the Safe Core SDK](/guides/integrating-the-safe-core-sdk.md)
