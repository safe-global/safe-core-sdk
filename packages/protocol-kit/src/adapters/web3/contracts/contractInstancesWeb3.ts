import { AbiItem } from 'web3-utils'
import SafeContract_v1_0_0_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/v1.0.0/SafeContract_v1_0_0_Web3'
import SafeContract_v1_1_1_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/v1.1.1/SafeContract_v1_1_1_Web3'
import SafeContract_v1_2_0_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/v1.2.0/SafeContract_v1_2_0_Web3'
import SafeContract_v1_3_0_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/v1.3.0/SafeContract_v1_3_0_Web3'
import SafeContract_v1_4_1_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/v1.4.1/SafeContract_v1_4_1_Web3'
import SafeProxyFactoryContract_v1_0_0_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0_Web3'
import SafeProxyFactoryContract_v1_1_1_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1_Web3'
import SafeProxyFactoryContract_v1_3_0_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0_Web3'
import SafeProxyFactoryContract_v1_4_1_Web3 from '@safe-global/protocol-kit/adapters/web3/contracts/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1_Web3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeContract_v1_0_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.0.0/SafeContract_v1_0_0'
import { SafeContract_v1_1_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.1.1/SafeContract_v1_1_1'
import { SafeContract_v1_2_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.2.0/SafeContract_v1_2_0'
import { SafeContract_v1_3_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.3.0/SafeContract_v1_3_0'
import { SafeContract_v1_4_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.4.1/SafeContract_v1_4_1'
import { SafeProxyFactoryContract_v1_0_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0'
import { SafeProxyFactoryContract_v1_1_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1'
import { SafeProxyFactoryContract_v1_3_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0'
import { SafeProxyFactoryContract_v1_4_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1'
import { Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Compatibility_fallback_handler'
import { Create_call as CreateCall_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Create_call'
import { Simulate_tx_accessor as SimulateTxAccessor_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Simulate_tx_accessor'
import { Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Compatibility_fallback_handler'
import { Create_call as CreateCall_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Create_call'
import { Simulate_tx_accessor as SimulateTxAccessor_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Simulate_tx_accessor'
import { SafeVersion, SignMessageLibContract } from '@safe-global/safe-core-sdk-types'
import CompatibilityFallbackHandler_V1_3_0_Web3 from './CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandler_V1_3_0_Web3'
import CompatibilityFallbackHandler_V1_4_1_Web3 from './CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandler_V1_4_1_Web3'
import CreateCallContract_V1_3_0_Web3 from './CreateCall/v1.3.0/CreateCallEthersContract_V1_3_0_Web3'
import CreateCallContract_V1_4_1_Web3 from './CreateCall/v1.4.1/CreateCallEthersContract_V1_4_1_Web3'
import MultiSendContract_V1_1_1_Web3 from './MultiSend/v1.1.1/MultiSendContract_V1_1_1_Web3'
import MultiSendContract_V1_3_0_Web3 from './MultiSend/v1.3.0/MultiSendContract_V1_3_0_Web3'
import MultiSendContract_V1_4_1_Web3 from './MultiSend/v1.4.1/MultiSendContract_V1_4_1_Web3'
import MultiSendCallOnlyContract_V1_3_0_Web3 from './MultiSend/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Web3'
import MultiSendCallOnlyContract_V1_4_1_Web3 from './MultiSend/v1.4.1/MultiSendCallOnlyContract_V1_4_1_Web3'
import SignMessageLibContract_v1_3_0_Web3 from './SignMessageLib/v1.3.0/SignMessageLibContract_V1_3_0_Web3'
import SignMessageLibContract_v1_4_1_Web3 from './SignMessageLib/v1.4.1/SignMessageLibContract_V1_4_1_Web3'
import SimulateTxAccessorContract_V1_3_0_Web3 from './SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_V1_3_0_Web3'
import SimulateTxAccessorContract_V1_4_1_Web3 from './SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_V1_4_1_Web3'
import { MultiSendContract_v1_4_1_Abi as MultiSendContract_v1_4_1_Abi_Readonly } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.4.1/MultiSendContract_v1_4_1'
import { MultiSendContract_v1_3_0_Abi as MultiSendContract_v1_3_0_Abi_Readonly } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.3.0/MultiSendContract_v1_3_0'
import { MultiSendContract_v1_1_1_Abi as MultiSendContract_v1_1_1_Abi_Readonly } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.1.1/MultiSendContract_v1_1_1'
import { MultiSendCallOnlyContract_v1_3_0_Abi as MultiSendCallOnlyContract_v1_3_0_Abi_Readonly } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0'
import { MultiSendCallOnlyContract_v1_4_1_Abi as MultiSendCallOnlyContract_v1_4_1_Abi_Readonly } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1'
import { SignMessageLibContract_v1_4_1_Abi as SignMessageLibContract_v1_4_1_Abi_Readonly } from '@safe-global/protocol-kit/contracts/AbiType/SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1'
import { SignMessageLibContract_v1_3_0_Abi as SignMessageLibContract_v1_3_0_Abi_Readonly } from '@safe-global/protocol-kit/contracts/AbiType/SignMessageLib/v1.3.0/SignMessageLibContract_v1_3_0'
import { DeepWriteable } from '../types'

type MultiSendContract_v1_1_1_Abi = DeepWriteable<MultiSendContract_v1_1_1_Abi_Readonly>
type MultiSendContract_v1_3_0_Abi = DeepWriteable<MultiSendContract_v1_3_0_Abi_Readonly>
type MultiSendContract_v1_4_1_Abi = DeepWriteable<MultiSendContract_v1_4_1_Abi_Readonly>
type MultiSendCallOnlyContract_v1_3_0_Abi =
  DeepWriteable<MultiSendCallOnlyContract_v1_3_0_Abi_Readonly>
type MultiSendCallOnlyContract_v1_4_1_Abi =
  DeepWriteable<MultiSendCallOnlyContract_v1_4_1_Abi_Readonly>
type SignMessageLibContract_v1_3_0_Abi = DeepWriteable<SignMessageLibContract_v1_3_0_Abi_Readonly>
type SignMessageLibContract_v1_4_1_Abi = DeepWriteable<SignMessageLibContract_v1_4_1_Abi_Readonly>

export async function getSafeContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  web3Adapter: Web3Adapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined,
  isL1SafeSingleton?: boolean
  // TODO <any> return type used until Typechain is removed
): Promise<any> {
  const chainId = await web3Adapter.getChainId()
  let safeContract
  switch (safeVersion) {
    case '1.4.1':
      safeContract = new SafeContract_v1_4_1_Web3(
        chainId,
        web3Adapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_4_1_Abi
      )
      // TODO: Remove this mapper after remove typechain
      return safeContract.mapToTypechainContract()
    case '1.3.0':
      safeContract = new SafeContract_v1_3_0_Web3(
        chainId,
        web3Adapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_3_0_Abi
      )
      // TODO: Remove this mapper after remove typechain
      return safeContract.mapToTypechainContract()
    case '1.2.0':
      safeContract = new SafeContract_v1_2_0_Web3(
        chainId,
        web3Adapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_2_0_Abi
      )
      // TODO: Remove this mapper after remove typechain
      return safeContract.mapToTypechainContract()
    case '1.1.1':
      safeContract = new SafeContract_v1_1_1_Web3(
        chainId,
        web3Adapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_1_1_Abi
      )
      // TODO: Remove this mapper after remove typechain
      return safeContract.mapToTypechainContract()
    case '1.0.0':
      safeContract = new SafeContract_v1_0_0_Web3(
        chainId,
        web3Adapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_0_0_Abi
      )
      // TODO: Remove this mapper after remove typechain
      return safeContract.mapToTypechainContract()
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getCompatibilityFallbackHandlerContractInstance(
  safeVersion: SafeVersion,
  compatibilityFallbackhandlerContract:
    | CompatibilityFallbackHandler_V1_4_1
    | CompatibilityFallbackHandler_V1_3_0
): CompatibilityFallbackHandler_V1_4_1_Web3 | CompatibilityFallbackHandler_V1_3_0_Web3 {
  switch (safeVersion) {
    case '1.4.1':
      return new CompatibilityFallbackHandler_V1_4_1_Web3(
        compatibilityFallbackhandlerContract as CompatibilityFallbackHandler_V1_4_1
      )
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

export async function getMultiSendContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  web3Adapter: Web3Adapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<
  MultiSendContract_V1_4_1_Web3 | MultiSendContract_V1_3_0_Web3 | MultiSendContract_V1_1_1_Web3
> {
  const chainId = await web3Adapter.getChainId()
  switch (safeVersion) {
    case '1.4.1':
      return new MultiSendContract_V1_4_1_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        customContractAbi as unknown as MultiSendContract_v1_4_1_Abi
      )
    case '1.3.0':
      return new MultiSendContract_V1_3_0_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        customContractAbi as unknown as MultiSendContract_v1_3_0_Abi
      )
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new MultiSendContract_V1_1_1_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        customContractAbi as unknown as MultiSendContract_v1_1_1_Abi
      )
    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getMultiSendCallOnlyContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  web3Adapter: Web3Adapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<MultiSendCallOnlyContract_V1_4_1_Web3 | MultiSendCallOnlyContract_V1_3_0_Web3> {
  const chainId = await web3Adapter.getChainId()
  switch (safeVersion) {
    case '1.4.1':
      return new MultiSendCallOnlyContract_V1_4_1_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        customContractAbi as unknown as MultiSendCallOnlyContract_v1_4_1_Abi
      )
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new MultiSendCallOnlyContract_V1_3_0_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        customContractAbi as unknown as MultiSendCallOnlyContract_v1_3_0_Abi
      )
    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getSafeProxyFactoryContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  web3Adapter: Web3Adapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined
) {
  const chainId = await web3Adapter.getChainId()
  let safeProxyFactoryContract

  switch (safeVersion) {
    case '1.4.1':
      safeProxyFactoryContract = new SafeProxyFactoryContract_v1_4_1_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeProxyFactoryContract_v1_4_1_Abi
      )
      return safeProxyFactoryContract.mapToTypechainContract() // remove this mapper after remove typechain
    case '1.3.0':
      safeProxyFactoryContract = new SafeProxyFactoryContract_v1_3_0_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeProxyFactoryContract_v1_3_0_Abi
      )
      return safeProxyFactoryContract.mapToTypechainContract() // remove this mapper after remove typechain
    case '1.2.0':
    case '1.1.1':
      safeProxyFactoryContract = new SafeProxyFactoryContract_v1_1_1_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeProxyFactoryContract_v1_1_1_Abi
      )
      return safeProxyFactoryContract.mapToTypechainContract() // remove this mapper after remove typechain
    case '1.0.0':
      safeProxyFactoryContract = new SafeProxyFactoryContract_v1_0_0_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeProxyFactoryContract_v1_0_0_Abi
      )
      return safeProxyFactoryContract.mapToTypechainContract() // remove this mapper after remove typechain
    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getSignMessageLibContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  web3Adapter: Web3Adapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<SignMessageLibContract> {
  const chainId = await web3Adapter.getChainId()
  let signMessageLibContract

  switch (safeVersion) {
    case '1.4.1':
      signMessageLibContract = new SignMessageLibContract_v1_4_1_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        customContractAbi as unknown as SignMessageLibContract_v1_4_1_Abi
      )

      // TODO: Remove this mapper after remove typechain
      return signMessageLibContract.mapToTypechainContract()
    case '1.3.0':
      signMessageLibContract = new SignMessageLibContract_v1_3_0_Web3(
        chainId,
        web3Adapter,
        contractAddress,
        customContractAbi as unknown as SignMessageLibContract_v1_3_0_Abi
      )

      // TODO: Remove this mapper after remove typechain
      return signMessageLibContract.mapToTypechainContract()
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getCreateCallContractInstance(
  safeVersion: SafeVersion,
  createCallContract: CreateCall_V1_4_1 | CreateCall_V1_3_0
): CreateCallContract_V1_4_1_Web3 | CreateCallContract_V1_3_0_Web3 {
  switch (safeVersion) {
    case '1.4.1':
      return new CreateCallContract_V1_4_1_Web3(createCallContract as CreateCall_V1_4_1)
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new CreateCallContract_V1_3_0_Web3(createCallContract as CreateCall_V1_3_0)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getSimulateTxAccessorContractInstance(
  safeVersion: SafeVersion,
  simulateTxAccessorContract: SimulateTxAccessor_V1_4_1 | SimulateTxAccessor_V1_3_0
): SimulateTxAccessorContract_V1_4_1_Web3 | SimulateTxAccessorContract_V1_3_0_Web3 {
  switch (safeVersion) {
    case '1.4.1':
      return new SimulateTxAccessorContract_V1_4_1_Web3(
        simulateTxAccessorContract as SimulateTxAccessor_V1_4_1
      )
    case '1.3.0':
      return new SimulateTxAccessorContract_V1_3_0_Web3(
        simulateTxAccessorContract as SimulateTxAccessor_V1_3_0
      )
    default:
      throw new Error('Invalid Safe version')
  }
}
