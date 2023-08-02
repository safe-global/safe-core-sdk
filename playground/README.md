## Playground

This playground contains several scripts that can be used as a starting point to use the Safe{Core} SDK. These scripts do not cover all the functionality exposed by the SDK but showcase some steps of the Safe transaction flow.

Before starting, make sure to install and build the Safe{Core} SDK monorepo.

```bash
yarn install
yarn build
```

Update the config inside the scripts you want to execute and run the following commands for each of them.

#### Deploy a Safe

This script allows to deploy a new Safe account with any given configuration (number and addresses of the signers, threshold, etc.):

```bash
yarn play deploy-safe
```

#### Propose a transaction

This script allows a signer of a Safe to share a transaction with the other signers by submitting it to the Safe Transaction Service:

```bash
yarn play propose-transaction
```

#### Confirm a transaction

This script allows a signer of a Safe to get a proposed transaction from the Safe Transaction Service and confirm it by signing it and submitting its signature:

```bash
yarn play confirm-transaction
```

#### Execute a transaction

Once there are enough signatures collected for a given transaction in the Safe Transaction Service, this script allows any account to get the transaction and execute it:

```bash
yarn play execute-transaction
```

In case you want to execute the transaction via a transaction relay, this script allows to do that, where the fees are extracted from the Safe balance:

```bash
yarn play relay-paid-transaction
```

In case you want to execute the transaction via a transaction relay, this script allows to to that, where the fees are extracted from a third party account balance that sponsors the transaction:

```bash
yarn play relay-sponsored-transaction
```

#### Generate a custon Safe address

This script allows to find the right `saltNonce` to generate a vanity Safe address with any given configuration:

```bash
yarn play generate-safe-address
```
