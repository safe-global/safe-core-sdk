import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import SafeContract_V1_4_1_Viem from './Safe/v1.4.1/SafeContract_V1_4_1_Viem'
import SafeContract_V1_3_0_Viem from './Safe/v1.3.0/SafeContract_V1_3_0_Viem'
import SafeContract_V1_2_0_Viem from './Safe/v1.2.0/SafeContract_V1_2_0_Viem'
import SafeContract_V1_1_1_Viem from './Safe/v1.1.1/SafeContract_V1_1_1_Viem'
import SafeContract_V1_0_0_Viem from './Safe/v1.0.0/SafeContract_V1_0_0_Viem'
import SafeProxyFactoryContract_V1_3_0_Viem from './SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_V1_3_0_Viem'
import SafeProxyFactoryContract_V1_4_1_Viem from './SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_V1_4_1_Viem'
import SafeProxyFactoryContract_V1_1_1_Viem from './SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_V1_1_1_Ethers'
import SafeProxyFactoryContract_V1_0_0_Viem from './SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_V1_0_0_Ethers'
import CompatibilityFallbackHandler_V1_4_1_Viem from './CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandler_V1_4_1_Viem'
import CompatibilityFallbackHandler_V1_3_0_Viem from './CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandler_V1_3_0_Viem'
import { ViemContractBaseArgs } from '../ViemContract'

export function getSafeContractInstance(safeVersion: SafeVersion, args: ViemContractBaseArgs) {
  switch (safeVersion) {
    case '1.4.1':
      return new SafeContract_V1_4_1_Viem(args)
    case '1.3.0':
      return new SafeContract_V1_3_0_Viem(args)
    case '1.2.0':
      return new SafeContract_V1_2_0_Viem(args)
    case '1.1.1':
      return new SafeContract_V1_1_1_Viem(args)
    case '1.0.0':
      return new SafeContract_V1_0_0_Viem(args)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getSafeProxyFactoryContractInstance(
  safeVersion: SafeVersion,
  args: ViemContractBaseArgs
) {
  switch (safeVersion) {
    case '1.4.1':
      return new SafeProxyFactoryContract_V1_4_1_Viem(args)
    case '1.3.0':
      return new SafeProxyFactoryContract_V1_3_0_Viem(args)
    case '1.2.0':
    case '1.1.1':
      return new SafeProxyFactoryContract_V1_1_1_Viem(args)
    case '1.0.0':
      return new SafeProxyFactoryContract_V1_0_0_Viem(args)
    default:
      throw new Error('Invalid SafeProxyFactory version')
  }
}

export function getCompatibilityFallbackHandlerContractInstance(
  safeVersion: SafeVersion,
  args: ViemContractBaseArgs
) {
  switch (safeVersion) {
    case '1.4.1':
      return new CompatibilityFallbackHandler_V1_4_1_Viem(args)
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
      return new CompatibilityFallbackHandler_V1_3_0_Viem(args)
    default:
      throw new Error('Invalid CompatibilityFallbackHandler version')
  }
}
