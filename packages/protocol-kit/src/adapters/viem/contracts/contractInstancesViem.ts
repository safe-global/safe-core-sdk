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
import MultiSendContract_V1_4_1_Viem from './MultiSend/v1.4.1/MultiSendContract_V1_4_1_ViemContract'
import MultiSendContract_V1_3_0_Viem from './MultiSend/v1.3.0/MultiSendContract_V1_3_0_ViemContract'
import MultiSendContract_V1_1_1_Viem from './MultiSend/v1.1.1/MultiSendContract_V1_1_1_ViemContract'
import MultiSendCallOnlyContract_V1_4_1_Viem from './MultiSendCallOnly/v1.4.1/MultiSendCallOnlyContract_V1_4_1_Viem'
import MultiSendCallOnlyContract_V1_3_0_Viem from './MultiSendCallOnly/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Viem'
import CreateCallContract_V1_3_0_Viem from './CreateCall/v1.3.0/CreateCallContract_V1_3_0_Viem'
import CreateCallContract_V1_4_1_Viem from './CreateCall/v1.4.1/CreateCallContract_V1_4_1_Viem'
import SignMessageLibContract_V1_4_1_Viem from './SignMessageLib/v1.4.1/SignMessageLibContract_V1_4_1_Viem'
import SignMessageLibContract_V1_3_0_Viem from './SignMessageLib/v1.3.0/SignMessageLibContract_V1_3_0_Viem'
import SimulateTxAccessorContract_V1_4_1_Viem from './SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_V1_4_1_Viem'
import SimulateTxAccessorContract_V1_3_0_Viem from './SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_V1_3_0_Viem'

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

export function getMultiSendContractInstance(safeVersion: SafeVersion, args: ViemContractBaseArgs) {
  switch (safeVersion) {
    case '1.4.1':
      return new MultiSendContract_V1_4_1_Viem(args)
    case '1.3.0':
      return new MultiSendContract_V1_3_0_Viem(args)
    case '1.2.0':
    case '1.1.1':
      return new MultiSendContract_V1_1_1_Viem(args)
    default:
      throw new Error('Invalid MultiSend version')
  }
}

export function getMultiSendCallOnlyContractInstance(
  safeVersion: SafeVersion,
  args: ViemContractBaseArgs
) {
  switch (safeVersion) {
    case '1.4.1':
      return new MultiSendCallOnlyContract_V1_4_1_Viem(args)
    case '1.3.0':
      return new MultiSendCallOnlyContract_V1_3_0_Viem(args)
    default:
      throw new Error('Invalid MultiSendCallOnly version')
  }
}

export function getCreateCallContractInstance(
  safeVersion: SafeVersion,
  args: ViemContractBaseArgs
) {
  switch (safeVersion) {
    case '1.4.1':
      return new CreateCallContract_V1_4_1_Viem(args)
    case '1.3.0':
      return new CreateCallContract_V1_3_0_Viem(args)
    default:
      throw new Error('Invalid CreateCall version')
  }
}

export function getSignMessageLibContractInstance(
  safeVersion: SafeVersion,
  args: ViemContractBaseArgs
) {
  switch (safeVersion) {
    case '1.4.1':
      return new SignMessageLibContract_V1_4_1_Viem(args)
    case '1.3.0':
      return new SignMessageLibContract_V1_3_0_Viem(args)
    default:
      throw new Error('Invalid SignMessageLib version')
  }
}

export function getSimulateTxAccessorContractInstance(
  safeVersion: SafeVersion,
  args: ViemContractBaseArgs
) {
  switch (safeVersion) {
    case '1.4.1':
      return new SimulateTxAccessorContract_V1_4_1_Viem(args)
    case '1.3.0':
      return new SimulateTxAccessorContract_V1_3_0_Viem(args)
    default:
      throw new Error('Invalid SimulateTxAccessor version')
  }
}
