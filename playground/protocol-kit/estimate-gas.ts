import Safe, { estimateSafeTxGas } from '@safe-global/protocol-kit'
import { Chain, gnosis, arbitrum, polygon } from 'viem/chains'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const config = {
  SAFE_ADDRESS: '<SAFE_ADDRESS>',
  chain: gnosis // Add the viem chain where the SAFE_ADDRESS is deployed (gnosis, arbitrum, polygon, etc.)
}

const privateKey = generatePrivateKey()
const account = privateKeyToAccount(privateKey)

async function estimate(chain: Chain) {
  const protocolKit = await Safe.init({
    provider: chain.rpcUrls.default.http[0],
    safeAddress: config.SAFE_ADDRESS
  })

  const safeProvider = protocolKit.getSafeProvider()

  const safeTransaction = await protocolKit.createAddOwnerTx({
    ownerAddress: account.address,
    threshold: 1
  })

  console.log(
    `gas (${chain.name}):`,
    await safeProvider.estimateGas({
      to: safeTransaction.data.to,
      value: safeTransaction.data.value,
      data: safeTransaction.data.data,
      from: config.SAFE_ADDRESS
    })
  )

  console.log(`safeTxGas (${chain.name}):`, await estimateSafeTxGas(protocolKit, safeTransaction))
}

async function main() {
  await estimate(config.chain)
}

main()
