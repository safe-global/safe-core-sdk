import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { Gnosis_safe as SafeMasterCopy_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.0.0/Gnosis_safe'
import { Proxy_factory as GnosisSafeProxyFactory_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.0.0/Proxy_factory'
import { Gnosis_safe as SafeMasterCopy_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.1.1/Gnosis_safe'
import { Multi_send as MultiSend_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.1.1/Multi_send'
import { Proxy_factory as GnosisSafeProxyFactory_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.1.1/Proxy_factory'
import { Gnosis_safe as SafeMasterCopy_V1_2_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.2.0/Gnosis_safe'
import { Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Compatibility_fallback_handler'
import { Create_call as CreateCall_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Create_call'
import { Gnosis_safe as SafeMasterCopy_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Gnosis_safe'
import { Multi_send as MultiSend_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Multi_send'
import { Multi_send_call_only as MultiSendCallOnly_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Multi_send_call_only'
import { Proxy_factory as GnosisSafeProxyFactory_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Proxy_factory'
import { Sign_message_lib as SignMessageLib_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Sign_message_lib'
import CompatibilityFallbackHandler_V1_3_0_Web3 from './CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandler_V1_3_0_Web3'
import CreateCallContract_V1_3_0_Web3 from './CreateCall/v1.3.0/CreateCallEthersContract_V1_3_0_Web3'
import GnosisSafeContract_V1_0_0_Web3 from './GnosisSafe/v1.0.0/GnosisSafeContract_V1_0_0_Web3'
import GnosisSafeContract_V1_1_1_Web3 from './GnosisSafe/v1.1.1/GnosisSafeContract_V1_1_1_Web3'
import GnosisSafeContract_V1_2_0_Web3 from './GnosisSafe/v1.2.0/GnosisSafeContract_V1_2_0_Web3'
import GnosisSafeContract_V1_3_0_Web3 from './GnosisSafe/v1.3.0/GnosisSafeContract_V1_3_0_Web3'
import GnosisSafeProxyFactoryContract_V1_0_0_Web3 from './GnosisSafeProxyFactory/v1.0.0/GnosisSafeProxyFactoryContract_V1_0_0_Web3'
import GnosisSafeProxyFactoryContract_V1_1_1_Web3 from './GnosisSafeProxyFactory/v1.1.1/GnosisSafeProxyFactoryContract_V1_1_1_Web3'
import GnosisSafeProxyFactoryContract_V1_3_0_Web3 from './GnosisSafeProxyFactory/v1.3.0/GnosisSafeProxyFactoryContract_V1_3_0_Web3'
import MultiSendContract_V1_1_1_Web3 from './MultiSend/v1.1.1/MultiSendContract_V1_1_1_Web3'
import MultiSendContract_V1_3_0_Web3 from './MultiSend/v1.3.0/MultiSendContract_V1_3_0_Web3'
import MultiSendCallOnlyContract_V1_3_0_Web3 from './MultiSendCallOnly/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Web3'
import SignMessageLibContract_V1_3_0_Web3 from './SignMessageLib/v1.3.0/SignMessageLibContract_V1_3_0_Web3'

export function getSafeContractInstance(
  safeVersion: SafeVersion,
  safeContract:
    | SafeMasterCopy_V1_3_0
    | SafeMasterCopy_V1_2_0
    | SafeMasterCopy_V1_1_1
    | SafeMasterCopy_V1_0_0
):
  | GnosisSafeContract_V1_3_0_Web3
  | GnosisSafeContract_V1_2_0_Web3
  | GnosisSafeContract_V1_1_1_Web3
  | GnosisSafeContract_V1_0_0_Web3 {
  switch (safeVersion) {
    case '1.3.0':
      return new GnosisSafeContract_V1_3_0_Web3(safeContract as SafeMasterCopy_V1_3_0)
    case '1.2.0':
      return new GnosisSafeContract_V1_2_0_Web3(safeContract as SafeMasterCopy_V1_2_0)
    case '1.1.1':
      return new GnosisSafeContract_V1_1_1_Web3(safeContract as SafeMasterCopy_V1_1_1)
    case '1.0.0':
      return new GnosisSafeContract_V1_0_0_Web3(safeContract as SafeMasterCopy_V1_0_0)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getCompatibilityFallbackHandlerContractInstance(
  safeVersion: SafeVersion,
  compatibilityFallbackhandlerContract: CompatibilityFallbackHandler_V1_3_0
): CompatibilityFallbackHandler_V1_3_0_Web3 {
  switch (safeVersion) {
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
      return new CompatibilityFallbackHandler_V1_3_0_Web3(
        compatibilityFallbackhandlerContract as CompatibilityFallbackHandler_V1_3_0
      )
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getMultiSendContractInstance(
  safeVersion: SafeVersion,
  multiSendContract: MultiSend_V1_3_0 | MultiSend_V1_1_1
): MultiSendContract_V1_3_0_Web3 | MultiSendContract_V1_1_1_Web3 {
  switch (safeVersion) {
    case '1.3.0':
      return new MultiSendContract_V1_3_0_Web3(multiSendContract as MultiSend_V1_3_0)
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new MultiSendContract_V1_1_1_Web3(multiSendContract as MultiSend_V1_1_1)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getMultiSendCallOnlyContractInstance(
  safeVersion: SafeVersion,
  multiSendCallOnlyContract: MultiSendCallOnly_V1_3_0
): MultiSendCallOnlyContract_V1_3_0_Web3 {
  switch (safeVersion) {
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new MultiSendCallOnlyContract_V1_3_0_Web3(
        multiSendCallOnlyContract as MultiSendCallOnly_V1_3_0
      )
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getGnosisSafeProxyFactoryContractInstance(
  safeVersion: SafeVersion,
  gnosisSafeProxyFactoryContract:
    | GnosisSafeProxyFactory_V1_3_0
    | GnosisSafeProxyFactory_V1_1_1
    | GnosisSafeProxyFactoryContract_V1_0_0_Web3
):
  | GnosisSafeProxyFactoryContract_V1_3_0_Web3
  | GnosisSafeProxyFactoryContract_V1_1_1_Web3
  | GnosisSafeProxyFactoryContract_V1_0_0_Web3 {
  switch (safeVersion) {
    case '1.3.0':
      return new GnosisSafeProxyFactoryContract_V1_3_0_Web3(
        gnosisSafeProxyFactoryContract as GnosisSafeProxyFactory_V1_3_0
      )
    case '1.2.0':
    case '1.1.1':
      return new GnosisSafeProxyFactoryContract_V1_1_1_Web3(
        gnosisSafeProxyFactoryContract as GnosisSafeProxyFactory_V1_1_1
      )
    case '1.0.0':
      return new GnosisSafeProxyFactoryContract_V1_0_0_Web3(
        gnosisSafeProxyFactoryContract as GnosisSafeProxyFactory_V1_0_0
      )
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getSignMessageLibContractInstance(
  safeVersion: SafeVersion,
  signMessageLibContract: SignMessageLib_V1_3_0
): SignMessageLibContract_V1_3_0_Web3 {
  switch (safeVersion) {
    case '1.3.0':
      return new SignMessageLibContract_V1_3_0_Web3(signMessageLibContract as SignMessageLib_V1_3_0)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getCreateCallContractInstance(
  safeVersion: SafeVersion,
  createCallContract: CreateCall_V1_3_0
): CreateCallContract_V1_3_0_Web3 {
  switch (safeVersion) {
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new CreateCallContract_V1_3_0_Web3(createCallContract as CreateCall_V1_3_0)
    default:
      throw new Error('Invalid Safe version')
  }
}
