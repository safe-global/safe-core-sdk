# Web3 Adapter

Web3.js wrapper that contains some utilities and the Safe contracts types (generated with `typechain` `web3-v1`). It is used to initialize the [Protocol Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit).

## How to use

If the app integrating the SDK is using `Web3`, create an instance of the `Web3Adapter`, where `signerAddress` is the Ethereum account we are connecting and the one who will sign the transactions.

```js
import Web3 from 'web3'
import { Web3Adapter } from '@safe-global/protocol-kit'

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(provider)
const safeOwner = '0x<address>'

const ethAdapter = new Web3Adapter({
  web3,
  signerAddress: safeOwner
})
```

In case the `ethAdapter` instance is only used to execute read-only methods the `signerAddress` property can be omitted.

```js
const readOnlyEthAdapter = new Web3Adapter({ web3 })
```
