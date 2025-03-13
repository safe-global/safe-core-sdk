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

  const safeTransaction = await protocolKit.createAddOwnerTx({
    ownerAddress: account.address,
    threshold: 1
  })

  console.log(`safeTxGas (${chain.name}):`, await estimateSafeTxGas(protocolKit, safeTransaction))
}

async function main() {
  await estimate(config.chain)
}

main()
