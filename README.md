# Safe Core SDK

Software development kit that facilitates the interaction with the [Gnosis Safe contracts](https://github.com/gnosis/safe-contracts).

## Install

Install the package with yarn or npm:

```bash
yarn install
npm install
```

## Build

Build the package with yarn or npm:

```bash
yarn build
npm build
```

## Documentation

### Getting Started

This is how executing a Safe transaction with off-chain signatures looks like.

1. Create a Safe account with two owners and threshold equal two (this configuration is just an example):
```js
import { ethers } from 'ethers')
import EthersSafe, { makeSafeTransaction } from 'safe-core-sdk'

const provider = ethers.getDefaultProvider('homestead')
const wallet1 = ethers.Wallet.createRandom().connect(provider)
const wallet2 = ethers.Wallet.createRandom().connect(provider)

const safe = await safeContract.setup(
  [wallet1, wallet2], //owners
  2, // threshold
  AddressZero,
  '0x',
  AddressZero,
  AddressZero,
  0,
  AddressZero
)
```

2. Create a Safe transaction:
```js
const tx = makeSafeTransaction({
  to: safe.address,
  value: '0',
  data: '0x',
  nonce: (await safe.nonce()).toString()
})
```

3. Generate the signatures with both owners:
```js
let safeSdk = new EthersSafe(ethers, wallet1, safe.address)
await safeSdk.confirmTransaction(tx)

safeSdk = new EthersSafe(ethers, wallet2, safe.address)
await safeSdk.confirmTransaction(tx)
```

4. Execute the transaction with the two signatures added:
```js
const txResponse = await safeSdk.executeTransaction(tx)

```

## License

This library is released under MIT.

## Contributors

- Germán Martínez ([germartinez](https://github.com/germartinez))
