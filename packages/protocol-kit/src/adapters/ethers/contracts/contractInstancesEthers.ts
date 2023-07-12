import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/providers'
import { Gnosis_safe__factory as SafeMasterCopy_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0/factories/Gnosis_safe__factory'
import { Proxy_factory__factory as SafeProxyFactory_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0/factories/Proxy_factory__factory'
import { Gnosis_safe__factory as SafeMasterCopy_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/factories/Gnosis_safe__factory'
import { Multi_send__factory as MultiSend_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/factories/Multi_send__factory'
import { Proxy_factory__factory as SafeProxyFactory_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/factories/Proxy_factory__factory'
import { Gnosis_safe__factory as SafeMasterCopy_V1_2_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.2.0/factories/Gnosis_safe__factory'
import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Compatibility_fallback_handler__factory'
import { Create_call__factory as CreateCall_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Create_call__factory'
import { Gnosis_safe__factory as SafeMasterCopy_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Gnosis_safe__factory'
import { Multi_send__factory as MultiSend_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Multi_send__factory'
import { Multi_send_call_only__factory as MultiSendCallOnly_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Multi_send_call_only__factory'
import { Proxy_factory__factory as SafeProxyFactory_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Proxy_factory__factory'
import { Sign_message_lib__factory as SignMessageLib_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Sign_message_lib__factory'
import { Simulate_tx_accessor__factory as SimulateTxAccessor_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/factories/Simulate_tx_accessor__factory'
import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/factories/Compatibility_fallback_handler__factory'
import { Create_call__factory as CreateCall_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/factories/Create_call__factory'
import { Multi_send__factory as MultiSend_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/factories/Multi_send__factory'
import { Multi_send_call_only__factory as MultiSendCallOnly_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/factories/Multi_send_call_only__factory'
import { Safe__factory as SafeMasterCopy_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/factories/Safe__factory'
import { Safe_proxy_factory__factory as SafeProxyFactory_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/factories/Safe_proxy_factory__factory'
import { Sign_message_lib__factory as SignMessageLib_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/factories/Sign_message_lib__factory'
import { Simulate_tx_accessor__factory as SimulateTxAccessor_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/factories/Simulate_tx_accessor__factory'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import CompatibilityFallbackHandler_V1_3_0_Ethers from './CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandler_V1_3_0_Ethers'
import CompatibilityFallbackHandler_V1_4_1_Ethers from './CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandler_V1_4_1_Ethers'
import CreateCallContract_V1_3_0_Ethers from './CreateCall/v1.3.0/CreateCallEthersContract_V1_3_0_Ethers'
import CreateCallContract_V1_4_1_Ethers from './CreateCall/v1.4.1/CreateCallEthersContract_V1_4_1_Ethers'
import MultiSendContract_V1_1_1_Ethers from './MultiSend/v1.1.1/MultiSendContract_V1_1_1_Ethers'
import MultiSendContract_V1_3_0_Ethers from './MultiSend/v1.3.0/MultiSendContract_V1_3_0_Ethers'
import MultiSendContract_V1_4_1_Ethers from './MultiSend/v1.4.1/MultiSendContract_V1_4_1_Ethers'
import MultiSendCallOnlyContract_V1_3_0_Ethers from './MultiSendCallOnly/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Ethers'
import MultiSendCallOnlyContract_V1_4_1_Ethers from './MultiSendCallOnly/v1.4.1/MultiSendCallOnlyContract_V1_4_1_Ethers'
import SafeContract_V1_0_0_Ethers from './Safe/v1.0.0/SafeContract_V1_0_0_Ethers'
import SafeContract_V1_1_1_Ethers from './Safe/v1.1.1/SafeContract_V1_1_1_Ethers'
import SafeContract_V1_2_0_Ethers from './Safe/v1.2.0/SafeContract_V1_2_0_Ethers'
import SafeContract_V1_3_0_Ethers from './Safe/v1.3.0/SafeContract_V1_3_0_Ethers'
import SafeContract_V1_4_1_Ethers from './Safe/v1.4.1/SafeContract_V1_4_1_Ethers'
import SafeProxyFactoryContract_V1_0_0_Ethers from './SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_V1_0_0_Ethers'
import SafeProxyFactoryContract_V1_1_1_Ethers from './SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_V1_1_1_Ethers'
import SafeProxyFactoryContract_V1_3_0_Ethers from './SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_V1_3_0_Ethers'
import SafeProxyFactoryContract_V1_4_1_Ethers from './SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_V1_4_1_Ethers'
import SignMessageLibContract_V1_3_0_Ethers from './SignMessageLib/v1.3.0/SignMessageLibContract_V1_3_0_Ethers'
import SignMessageLibContract_V1_4_1_Ethers from './SignMessageLib/v1.4.1/SignMessageLibContract_V1_4_1_Ethers'
import SimulateTxAccessorContract_V1_3_0_Ethers from './SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_V1_3_0_Ethers'
import SimulateTxAccessorContract_V1_4_1_Ethers from './SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_V1_4_1_Ethers'

export function getSafeContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
):
  | SafeContract_V1_4_1_Ethers
  | SafeContract_V1_3_0_Ethers
  | SafeContract_V1_2_0_Ethers
  | SafeContract_V1_1_1_Ethers
  | SafeContract_V1_0_0_Ethers {
  let safeContract
  switch (safeVersion) {
    case '1.4.1':
      safeContract = SafeMasterCopy_V1_4_1.connect(contractAddress, signerOrProvider)
      return new SafeContract_V1_4_1_Ethers(safeContract)
    case '1.3.0':
      safeContract = SafeMasterCopy_V1_3_0.connect(contractAddress, signerOrProvider)
      return new SafeContract_V1_3_0_Ethers(safeContract)
    case '1.2.0':
      safeContract = SafeMasterCopy_V1_2_0.connect(contractAddress, signerOrProvider)
      return new SafeContract_V1_2_0_Ethers(safeContract)
    case '1.1.1':
      safeContract = SafeMasterCopy_V1_1_1.connect(contractAddress, signerOrProvider)
      return new SafeContract_V1_1_1_Ethers(safeContract)
    case '1.0.0':
      safeContract = SafeMasterCopy_V1_0_0.connect(contractAddress, signerOrProvider)
      return new SafeContract_V1_0_0_Ethers(safeContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getCompatibilityFallbackHandlerContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
): CompatibilityFallbackHandler_V1_4_1_Ethers | CompatibilityFallbackHandler_V1_3_0_Ethers {
  let compatibilityFallbackHandlerContract
  switch (safeVersion) {
    case '1.4.1':
      compatibilityFallbackHandlerContract = CompatibilityFallbackHandler_V1_4_1.connect(
        contractAddress,
        signerOrProvider
      )
      return new CompatibilityFallbackHandler_V1_4_1_Ethers(compatibilityFallbackHandlerContract)
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
):
  | MultiSendContract_V1_4_1_Ethers
  | MultiSendContract_V1_3_0_Ethers
  | MultiSendContract_V1_1_1_Ethers {
  let multiSendContract
  switch (safeVersion) {
    case '1.4.1':
      multiSendContract = MultiSend_V1_4_1.connect(contractAddress, signerOrProvider)
      return new MultiSendContract_V1_4_1_Ethers(multiSendContract)
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
): MultiSendCallOnlyContract_V1_4_1_Ethers | MultiSendCallOnlyContract_V1_3_0_Ethers {
  let multiSendCallOnlyContract
  switch (safeVersion) {
    case '1.4.1':
      multiSendCallOnlyContract = MultiSendCallOnly_V1_4_1.connect(
        contractAddress,
        signerOrProvider
      )
      return new MultiSendCallOnlyContract_V1_4_1_Ethers(multiSendCallOnlyContract)
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
  | SafeProxyFactoryContract_V1_4_1_Ethers
  | SafeProxyFactoryContract_V1_3_0_Ethers
  | SafeProxyFactoryContract_V1_1_1_Ethers
  | SafeProxyFactoryContract_V1_0_0_Ethers {
  let safeProxyFactoryContract
  switch (safeVersion) {
    case '1.4.1':
      safeProxyFactoryContract = SafeProxyFactory_V1_4_1.connect(contractAddress, signerOrProvider)
      return new SafeProxyFactoryContract_V1_4_1_Ethers(safeProxyFactoryContract)
    case '1.3.0':
      safeProxyFactoryContract = SafeProxyFactory_V1_3_0.connect(contractAddress, signerOrProvider)
      return new SafeProxyFactoryContract_V1_3_0_Ethers(safeProxyFactoryContract)
    case '1.2.0':
    case '1.1.1':
      safeProxyFactoryContract = SafeProxyFactory_V1_1_1.connect(contractAddress, signerOrProvider)
      return new SafeProxyFactoryContract_V1_1_1_Ethers(safeProxyFactoryContract)
    case '1.0.0':
      safeProxyFactoryContract = SafeProxyFactory_V1_0_0.connect(contractAddress, signerOrProvider)
      return new SafeProxyFactoryContract_V1_0_0_Ethers(safeProxyFactoryContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getSignMessageLibContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
): SignMessageLibContract_V1_4_1_Ethers | SignMessageLibContract_V1_3_0_Ethers {
  let signMessageLibContract
  switch (safeVersion) {
    case '1.4.1':
      signMessageLibContract = SignMessageLib_V1_4_1.connect(contractAddress, signerOrProvider)
      return new SignMessageLibContract_V1_4_1_Ethers(signMessageLibContract)
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
): CreateCallContract_V1_4_1_Ethers | CreateCallContract_V1_3_0_Ethers {
  let createCallContract
  switch (safeVersion) {
    case '1.4.1':
      createCallContract = CreateCall_V1_4_1.connect(contractAddress, signerOrProvider)
      return new CreateCallContract_V1_4_1_Ethers(createCallContract)
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

export function getSimulateTxAccessorContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: Signer | Provider
): SimulateTxAccessorContract_V1_4_1_Ethers | SimulateTxAccessorContract_V1_3_0_Ethers {
  let simulateTxAccessorContract
  switch (safeVersion) {
    case '1.4.1':
      simulateTxAccessorContract = SimulateTxAccessor_V1_4_1.connect(
        contractAddress,
        signerOrProvider
      )
      return new SimulateTxAccessorContract_V1_4_1_Ethers(simulateTxAccessorContract)
    case '1.3.0':
      simulateTxAccessorContract = SimulateTxAccessor_V1_3_0.connect(
        contractAddress,
        signerOrProvider
      )
      return new SimulateTxAccessorContract_V1_3_0_Ethers(simulateTxAccessorContract)
    default:
      throw new Error('Invalid Safe version')
  }
}
