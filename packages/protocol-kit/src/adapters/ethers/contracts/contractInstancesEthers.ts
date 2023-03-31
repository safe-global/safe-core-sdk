import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/providers'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { Gnosis_safe__factory as SafeMasterCopy_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0/factories/Gnosis_safe__factory'
import { Proxy_factory__factory as SafeProxyFactory_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0/factories/Proxy_factory__factory'
import { Gnosis_safe__factory as SafeMasterCopy_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/factories/Gnosis_safe__factory'
import { Multi_send__factory as MultiSend_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/factories/Multi_send__factory'
import { Proxy_factory__factory as SafeProxyFactory_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/factories/Proxy_factory__factory'
import { Gnosis_safe__factory as SafeMasterCopy_V1_2_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.2.0/factories/Gnosis_safe__factory'
import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Compatibility_fallback_handler__factory'
import { Gnosis_safe__factory as SafeMasterCopy_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Gnosis_safe__factory'
import { Multi_send_call_only__factory as MultiSendCallOnly_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Multi_send_call_only__factory'
import { Multi_send__factory as MultiSend_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Multi_send__factory'
import { Proxy_factory__factory as SafeProxyFactory_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Proxy_factory__factory'
import { Sign_message_lib__factory as SignMessageLib_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Sign_message_lib__factory'
import { Create_call__factory as CreateCall_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Create_call__factory'
import CompatibilityFallbackHandler_V1_3_0_Ethers from './CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandler_V1_3_0_Ethers'
import CreateCallContract_V1_3_0_Ethers from './CreateCall/v1.3.0/CreateCallEthersContract_V1_3_0_Ethers'
import GnosisSafeContract_V1_0_0_Ethers from './GnosisSafe/v1.0.0/GnosisSafeContract_V1_0_0_Ethers'
import GnosisSafeContract_V1_1_1_Ethers from './GnosisSafe/v1.1.1/GnosisSafeContract_V1_1_1_Ethers'
import GnosisSafeContract_V1_2_0_Ethers from './GnosisSafe/v1.2.0/GnosisSafeContract_V1_2_0_Ethers'
import GnosisSafeContract_V1_3_0_Ethers from './GnosisSafe/v1.3.0/GnosisSafeContract_V1_3_0_Ethers'
import GnosisSafeProxyFactoryContract_V1_0_0_Ethers from './GnosisSafeProxyFactory/v1.0.0/GnosisSafeProxyFactoryContract_V1_0_0_Ethers'
import GnosisSafeProxyFactoryContract_V1_1_1_Ethers from './GnosisSafeProxyFactory/v1.1.1/GnosisSafeProxyFactoryContract_V1_1_1_Ethers'
import GnosisSafeProxyFactoryContract_V1_3_0_Ethers from './GnosisSafeProxyFactory/v1.3.0/GnosisSafeProxyFactoryContract_V1_3_0_Ethers'
import MultiSendContract_V1_1_1_Ethers from './MultiSend/v1.1.1/MultiSendContract_V1_1_1_Ethers'
import MultiSendContract_V1_3_0_Ethers from './MultiSend/v1.3.0/MultiSendContract_V1_3_0_Ethers'
import MultiSendCallOnlyContract_V1_3_0_Ethers from './MultiSendCallOnly/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Ethers'
import SignMessageLibContract_V1_3_0_Ethers from './SignMessageLib/v1.3.0/SignMessageLibContract_V1_3_0_Ethers'

export function getSafeContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
):
  | GnosisSafeContract_V1_3_0_Ethers
  | GnosisSafeContract_V1_2_0_Ethers
  | GnosisSafeContract_V1_1_1_Ethers
  | GnosisSafeContract_V1_0_0_Ethers {
  let safeContract
  switch (safeVersion) {
    case '1.3.0':
      safeContract = SafeMasterCopy_V1_3_0.connect(contractAddress, signerOrProvider)
      return new GnosisSafeContract_V1_3_0_Ethers(safeContract)
    case '1.2.0':
      safeContract = SafeMasterCopy_V1_2_0.connect(contractAddress, signerOrProvider)
      return new GnosisSafeContract_V1_2_0_Ethers(safeContract)
    case '1.1.1':
      safeContract = SafeMasterCopy_V1_1_1.connect(contractAddress, signerOrProvider)
      return new GnosisSafeContract_V1_1_1_Ethers(safeContract)
    case '1.0.0':
      safeContract = SafeMasterCopy_V1_0_0.connect(contractAddress, signerOrProvider)
      return new GnosisSafeContract_V1_0_0_Ethers(safeContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getCompatibilityFallbackHandlerContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
): CompatibilityFallbackHandler_V1_3_0_Ethers {
  let compatibilityFallbackHandlerContract
  switch (safeVersion) {
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
      compatibilityFallbackHandlerContract = CompatibilityFallbackHandler_V1_3_0.connect(
        contractAddress,
        signerOrProvider
      )
      return new CompatibilityFallbackHandler_V1_3_0_Ethers(compatibilityFallbackHandlerContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getMultiSendContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
): MultiSendContract_V1_3_0_Ethers | MultiSendContract_V1_1_1_Ethers {
  let multiSendContract
  switch (safeVersion) {
    case '1.3.0':
      multiSendContract = MultiSend_V1_3_0.connect(contractAddress, signerOrProvider)
      return new MultiSendContract_V1_3_0_Ethers(multiSendContract)
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      multiSendContract = MultiSend_V1_1_1.connect(contractAddress, signerOrProvider)
      return new MultiSendContract_V1_1_1_Ethers(multiSendContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getMultiSendCallOnlyContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
): MultiSendCallOnlyContract_V1_3_0_Ethers {
  let multiSendCallOnlyContract
  switch (safeVersion) {
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      multiSendCallOnlyContract = MultiSendCallOnly_V1_3_0.connect(
        contractAddress,
        signerOrProvider
      )
      return new MultiSendCallOnlyContract_V1_3_0_Ethers(multiSendCallOnlyContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getSafeProxyFactoryContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
):
  | GnosisSafeProxyFactoryContract_V1_3_0_Ethers
  | GnosisSafeProxyFactoryContract_V1_1_1_Ethers
  | GnosisSafeProxyFactoryContract_V1_0_0_Ethers {
  let gnosisSafeProxyFactoryContract
  switch (safeVersion) {
    case '1.3.0':
      gnosisSafeProxyFactoryContract = SafeProxyFactory_V1_3_0.connect(
        contractAddress,
        signerOrProvider
      )
      return new GnosisSafeProxyFactoryContract_V1_3_0_Ethers(gnosisSafeProxyFactoryContract)
    case '1.2.0':
    case '1.1.1':
      gnosisSafeProxyFactoryContract = SafeProxyFactory_V1_1_1.connect(
        contractAddress,
        signerOrProvider
      )
      return new GnosisSafeProxyFactoryContract_V1_1_1_Ethers(gnosisSafeProxyFactoryContract)
    case '1.0.0':
      gnosisSafeProxyFactoryContract = SafeProxyFactory_V1_0_0.connect(
        contractAddress,
        signerOrProvider
      )
      return new GnosisSafeProxyFactoryContract_V1_0_0_Ethers(gnosisSafeProxyFactoryContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getSignMessageLibContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
): SignMessageLibContract_V1_3_0_Ethers {
  let signMessageLibContract
  switch (safeVersion) {
    case '1.3.0':
      signMessageLibContract = SignMessageLib_V1_3_0.connect(contractAddress, signerOrProvider)
      return new SignMessageLibContract_V1_3_0_Ethers(signMessageLibContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getCreateCallContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
): CreateCallContract_V1_3_0_Ethers {
  let createCallContract
  switch (safeVersion) {
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      createCallContract = CreateCall_V1_3_0.connect(contractAddress, signerOrProvider)
      return new CreateCallContract_V1_3_0_Ethers(createCallContract)
    default:
      throw new Error('Invalid Safe version')
  }
}
