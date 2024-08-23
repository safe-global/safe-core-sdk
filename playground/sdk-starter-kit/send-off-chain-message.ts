import { privateKeyToAddress } from 'viem/accounts'
import { SafeClientResult, createSafeClient, offChainMessages } from '@safe-global/sdk-starter-kit'

const OWNER_1_PRIVATE_KEY = '0x'
const OWNER_2_PRIVATE_KEY = '0x'
const OWNER_3_PRIVATE_KEY = '0x'

const THRESHOLD = 3
const SALT_NONCE = ''

const RPC_URL = 'https://rpc.sepolia.org'

const MESSAGE = "I'm the owner of this Safe"
// const MESSAGE = {
//   types: {
//     EIP712Domain: [
//       { name: 'name', type: 'string' },
//       { name: 'version', type: 'string' },
//       { name: 'chainId', type: 'uint256' },
//       { name: 'verifyingContract', type: 'address' }
//     ],
//     Person: [
//       { name: 'name', type: 'string' },
//       { name: 'wallets', type: 'address[]' }
//     ],
//     Mail: [
//       { name: 'from', type: 'Person' },
//       { name: 'to', type: 'Person[]' },
//       { name: 'contents', type: 'string' }
//     ]
//   },
//   domain: {
//     name: 'Ether Mail',
//     version: '1',
//     chainId: 1,
//     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
//   },
//   primaryType: 'Mail',
//   message: {
//     from: {
//       name: 'Cow',
//       wallets: [
//         '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
//         '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'
//       ]
//     },
//     to: [
//       {
//         name: 'Bob',
//         wallets: [
//           '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
//           '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
//           '0xB0B0b0b0b0b0B000000000000000000000000000'
//         ]
//       }
//     ],
//     contents: 'Hello, Bob!'
//   }
// }

async function send(): Promise<SafeClientResult> {
  const owner1 = privateKeyToAddress(OWNER_1_PRIVATE_KEY)
  const owner2 = privateKeyToAddress(OWNER_2_PRIVATE_KEY)
  const owner3 = privateKeyToAddress(OWNER_3_PRIVATE_KEY)

  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    safeOptions: {
      owners: [owner1, owner2, owner3],
      threshold: THRESHOLD,
      saltNonce: SALT_NONCE
    }
  })

  const safeClientWithMessages = safeClient.extend(offChainMessages())

  const signerAddress = (await safeClient.protocolKit.getSafeProvider().getSignerAddress()) || '0x'

  console.log(
    '-Safe Address:',
    await safeClient.protocolKit.getAddress(),
    await safeClient.protocolKit.isSafeDeployed()
  )
  console.log('-Signer Address:', signerAddress)

  const txResult = await safeClientWithMessages.sendOffChainMessage({ message: MESSAGE })

  console.log('-Send result: ', txResult)

  return txResult
}

async function confirm({ safeAddress, messages }: SafeClientResult, pk: string) {
  if (!pk) {
    return
  }

  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: pk,
    safeAddress
  })

  const signerAddress = (await safeClient.protocolKit.getSafeProvider().getSignerAddress()) || '0x'

  console.log('-Signer Address:', signerAddress)

  const safeClientWithMessages = safeClient.extend(offChainMessages())

  const pendingMessages = await safeClientWithMessages.getPendingOffChainMessages()

  for (const message of pendingMessages.results) {
    if (message.messageHash !== messages?.messageHash) {
      return
    }

    const txResult = await safeClientWithMessages.confirmOffChainMessage({
      messageHash: message.messageHash
    })

    console.log('-Confirm result: ', txResult)
  }
}

async function main() {
  if (![1, 2, 3].includes(THRESHOLD)) {
    return
  }

  const txResult = await send()

  if (THRESHOLD > 1) {
    await confirm(txResult, OWNER_2_PRIVATE_KEY)
  }

  //@ts-ignore-next-line
  if (THRESHOLD > 2) {
    await confirm(txResult, OWNER_3_PRIVATE_KEY)
  }
}

main()
