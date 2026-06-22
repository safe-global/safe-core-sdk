## Playground

This playground contains several scripts that can be used as a starting point to use the Safe{Core} SDK. These scripts do not cover all the functionality exposed by the SDK but showcase some steps of the Safe transaction flow.

Before starting, make sure to install and build the Safe{Core} SDK monorepo. From the project root, run:

```bash
pnpm install
pnpm build
```

Update the config inside the scripts you want to execute and run the following commands for each of them. There are 2 ways to configure the input parameters of the scripts:

- Environment files can be found in each folder with the required configuration. In this case, rename the `.env-sample` file to `.env` and update the values according to the comments inside `.env-sample`.
- Set the values directly in the script file.

### `protocol-kit`

#### Deploy a Safe

This script allows to deploy a new Safe account with any given configuration (number and addresses of the signers, threshold, etc.):

```bash
pnpm play deploy-safe
```

#### Generate a custom Safe address

This script shows how to generate a Safe address based on some custom config parameters. The Safe account address is deterministic and can be calculated based on the signers and threshold. This is useful for counterfactual deployments or multi-chain Safe accounts scenarios:

```bash
pnpm play generate-safe-address
```

#### Estimate gas

Showcase how to estimate the `gas` (The complete transaction gas cost) and `safeTxGas` (The concrete Safe contracts calls gas cost) for a transaction:

```bash
pnpm play estimate-gas
```

#### Verify the per-chain gas schedule

Measures, per chain, the real gas cost of each EVM operation used in a Safe `execTransaction` (via `debug_traceTransaction`) and flags any deviation from the EIP-2929 (Berlin) standard. This is the reproducible backing for the chain-aware `baseGas` lookup: only Polygon PoS deviates (PIP-88 / "Chicago" hard fork — cold `SLOAD` 5460, cold-`SSTORE` surcharge 2940).

Edit the `CHAINS` array at the top of `playground/protocol-kit/verify-gas-schedule.ts` and set `rpcUrl` for each chain you want to check, using your own debug-enabled RPC (Tenderly, dRPC, Alchemy, QuickNode, your own node…). The API key stays on your machine. Then run:

```bash
pnpm play verify-gas-schedule        # add -v to also print the raw debug_traceTransaction JSON
```

The script iterates over every chain; any chain left with the placeholder `rpcUrl` is skipped. The RPC must expose `debug_traceTransaction`. Each operation is reported as `measured` (read from a trace), `derived` (the cold DELEGATECALL surcharge, never isolable due to 63/64 gas forwarding), or — if the RPC fails or the opcode isn't in the sampled txs — `UNVERIFIED` (it does **not** silently show standard values as if checked).

#### Create and execute a transaction

This script allows you to create and execute a transaction. It demonstrates the typical flow for a Safe transaction using the `protocol-kit`, including how to create, sign, and execute a transaction.

```bash
pnpm play create-and-execute-transaction
```

#### Replicate Safe addresses

This script demonstrates how to obtain the same Safe address across different networks. This is useful when you want to deploy a Safe account on another network while retaining the same Safe account address:

```bash
pnpm play replicate-safe-address
```

#### Validate signatures

This script shows how to validate the signatures of a Safe message using the `protocol-kit`:

```bash
pnpm play validate-signatures
```

### `api-kit`

#### Propose a transaction

This script allows a signer of a Safe to share a transaction with the other signers by submitting it to the Safe Transaction Service first:

```bash
pnpm play propose-transaction
```

#### Confirm a transaction

This script allows a signer of a Safe to get a proposed transaction from the Safe Transaction Service and confirm it by signing it and submitting its signature:

```bash
pnpm play confirm-transaction
```

#### Execute a transaction

Once there are enough signatures collected for a given transaction in the Safe Transaction Service, this script allows any account to get the transaction and execute it:

```bash
pnpm play execute-transaction
```

### `relay-kit`

#### Send User Operation using an existing Safe

This script showcases how to create a Safe Operation from a batch of transactions, sign it and send to the bundler as an User Operation:

```bash
pnpm play userop
```

#### Send User Operation with a non-existent Safe account

This script demonstrates how to create a Safe Operation from a batch of transactions, sign it and send to the bundler as an User Operation for a non-existent Safe account:

```bash
pnpm play userop-counterfactual
```

#### Send User Operation using an existing Safe and an ERC20 Paymaster

This script showcases how to create a Safe Operation from a batch of transactions, sign it and send to the bundler as an User Operation. The User Operation gas costs will be covered with ERC20 tokens by using a paymaster:

```bash
pnpm play userop-erc20-paymaster
```

#### Send User Operation using an ERC20 Paymaster with a non-existent Safe account

This script showcases how to create a Safe Operation from a batch of transactions, sign it and send to the bundler as an User Operation for a non-existent Safe account. The User Operation gas costs will be covered with ERC20 tokens by using a paymaster:

```bash
pnpm play userop-erc20-paymaster-counterfactual
```

#### Send User Operation using an existing Safe and a verifying Paymaster to sponsor the operation

This script showcases how to create a Safe Operation from a batch of transactions, sign it and send to the bundler. The User Operation will be sponsored by using a Paymaster:

```bash
pnpm play userop-verifying-paymaster
```

#### Send User Operation using a verifying Paymaster tp sponsor the operations with a non-existent Safe account

This script demonstrates how to create a Safe Operation from a batch of transactions, sign it and send to the bundler for a non-existent Safe account. The User Operation will be sponsored by using a Paymaster:

```bash
pnpm play userop-verifying-paymaster-counterfactual
```

#### Execute User Operations in parallel

This script showcases how to execute multiple User Operations in parallel by using custom nonces:

```bash
pnpm play userop-parallel-execution
```

#### Api kit interoperability

This script shows how to create a Safe Operation and store it using the Safe Transaction Service. This process orchestrates signatures from additional owners before bundle the User Operation and send it to provider bundler services:

```bash
pnpm play userop-api-kit-interoperability
```

#### Relay a transaction using Gelato

In case you want to execute the transaction via a transaction relay, this script allows to do that, where the fees are extracted from the Safe balance:

```bash
pnpm play gelato-paid-transaction
```

#### Relay an sponsored transaction using Gelato

In case you want to execute the transaction via a transaction relay, this script allows to to that, where the fees are extracted from a third party account balance that sponsors the transaction:

```bash
pnpm play gelato-sponsored-transaction
```

### `sdk-starter-kit`

#### Create and execute a transaction

This script demonstrates how to use the `sdk-starter-kit` to create, sign, and execute a transaction and deploy the Safe account if it does not exist. Internally it use the Safe Transaction Service to propose and confirm the transactions in case more than one owner signature is required:

```bash
pnpm play send-transactions
```

#### Create and execute Safe Operations

This script demonstrates how to use the `sdk-starter-kit` to create, sign, and execute a Safe Operation and deploy the Safe account if it does not exist. Internally it use the Safe Transaction Service to propose and confirm the Safe Operations in case more than one owner signature is required:

```bash
pnpm play send-safe-operation
```

#### Create and execute on-chain messages

This script demonstrates how to use the `sdk-starter-kit` to create, sign, and execute on-chain messages and deploy the Safe account if it does not exist. Internally it use the Safe Transaction Service to propose and confirm the on-chain messages (that are basically regular transactions) in case more than one owner signature is required:

```bash
pnpm play send-on-chain-message
```

#### Create and execute off-chain messages

This script demonstrates how to use the `sdk-starter-kit` to create, sign, and execute off-chain messages and deploy the Safe account if it does not exist. Internally it use the Safe Transaction Service to propose and confirm the off-chain messages in case more than one owner signature is required:

```bash
pnpm play send-off-chain-message
```

#### Setup Safe account owners

This script demonstrates how to use the `sdk-starter-kit` to setup Safe accounts with different owner configurations

```bash
pnpm play owner-management
```
