import Safe, { DeploymentType, SafeAccountConfig } from '@safe-global/protocol-kit'
import { SafeVersion } from '@safe-global/types-kit'
import {
  gnosis,
  mainnet,
  base,
  optimism,
  arbitrum,
  bsc,
  polygon,
  linea,
  scroll,
  xLayer,
  celo,
  avalanche,
  blast,
  mantle,
  aurora,
  sepolia
} from 'viem/chains'

// This file can be used to play around with the Safe Core SDK

// Safe config to be replicated in different chains
const safeAccountConfig: SafeAccountConfig = {
  owners: ['0x0Ee26C4481485AC64BfFf2bdCaA21EdAeCEcdCa9'],
  threshold: 1
}

// saltNonce used
const saltNonce = '1234567890987654321'

async function main() {
  console.log('Safe Account config: ', safeAccountConfig)
  console.log('saltNonce: ', saltNonce)

  const deploymentTypes: DeploymentType[] = ['canonical'] // 'canonical' or 'eip155'
  const isL1SafeSingletons = [true, false]
  const safeVersions: SafeVersion[] = ['1.3.0', '1.4.1']

  const chains = [
    mainnet,
    gnosis,
    polygon,
    bsc,
    arbitrum,
    optimism,
    base,
    linea,
    scroll,
    xLayer,
    celo,
    avalanche,
    blast,
    mantle,
    aurora,

    // tesnets
    sepolia
  ]

  for (let i = 0; i < safeVersions.length; i++) {
    for (let j = 0; j < deploymentTypes.length; j++) {
      for (let k = 0; k < isL1SafeSingletons.length; k++) {
        const safeVersion = safeVersions[i]
        const deploymentType = deploymentTypes[j]
        const isL1SafeSingleton = isL1SafeSingletons[k]

        console.log(' ')
        console.log(
          ` ---------- [Safe v${safeVersion}; ${deploymentType} deployment; ${isL1SafeSingleton ? 'L1' : 'L2'} contract ] ---------- `
        )
        console.log(' ')

        for (let l = 0; l < chains.length; l++) {
          const chain = chains[l]
          const provider = chain.rpcUrls.default.http[0]

          const protocolKit = await Safe.init({
            provider,
            isL1SafeSingleton,
            predictedSafe: {
              safeAccountConfig,
              safeDeploymentConfig: {
                deploymentType,
                saltNonce,
                safeVersion
              }
            }
          })

          const safeAddress = await protocolKit.getAddress()

          console.log(`${safeAddress} --> Safe address in ${chain.name} chain`)
        }
      }
    }
  }
}

main()
