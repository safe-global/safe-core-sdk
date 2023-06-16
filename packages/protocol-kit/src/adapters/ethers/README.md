# Ethers Adapter

Ethers.js wrapper that contains some utilities and the Safe contracts types (generated with `typechain` `ethers-v5`). It is used to initialize the [Protocol Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit).

## How to use

If the app integrating the SDK is using `ethers`, create an instance of the `EthersAdapter`, where `signer` is the Ethereum account we are connecting and the one who will sign the transactions.

> :warning: **NOTE**: Currently only `ethers` `v5` is supported.

```js
import { ethers } from 'ethers'
import { EthersAdapter } from '@safe-global/protocol-kit'

const web3Provider = // ...
const provider = new ethers.providers.Web3Provider(web3Provider)
const safeOwner = provider.getSigner(0)

const ethAdapter = new EthersAdapter({
  ethers,
  signerOrProvider: safeOwner
})
```

Depending on whether the `ethAdapter` instance is used to sign/execute transactions or just call read-only methods, the `signerOrProvider` property can be a `Signer` or a `Provider`.
