import { AbstractSigner, Provider } from 'ethers'
import { AbiItem } from 'web3-utils'
import { Gnosis_safe__factory as SafeSingleton_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0/factories/Gnosis_safe__factory'
import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0/factories/Compatibility_fallback_handler__factory'
import { Create_call__factory as CreateCall_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0/factories/Create_call__factory'
import { Simulate_tx_accessor__factory as SimulateTxAccessor_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0/factories/Simulate_tx_accessor__factory'
import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1/factories/Compatibility_fallback_handler__factory'
import { Create_call__factory as CreateCall_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1/factories/Create_call__factory'
import { Simulate_tx_accessor__factory as SimulateTxAccessor_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1/factories/Simulate_tx_accessor__factory'
import { SafeVersion, SignMessageLibContract } from '@safe-global/safe-core-sdk-types'
import CompatibilityFallbackHandler_V1_3_0_Ethers from './CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandler_V1_3_0_Ethers'
import CompatibilityFallbackHandler_V1_4_1_Ethers from './CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandler_V1_4_1_Ethers'
import CreateCallContract_V1_3_0_Ethers from './CreateCall/v1.3.0/CreateCallEthersContract_V1_3_0_Ethers'
import CreateCallContract_V1_4_1_Ethers from './CreateCall/v1.4.1/CreateCallEthersContract_V1_4_1_Ethers'
import MultiSendContract_V1_1_1_Ethers from './MultiSend/v1.1.1/MultiSendContract_V1_1_1_Ethers'
import MultiSendContract_V1_3_0_Ethers from './MultiSend/v1.3.0/MultiSendContract_V1_3_0_Ethers'
import MultiSendContract_V1_4_1_Ethers from './MultiSend/v1.4.1/MultiSendContract_V1_4_1_Ethers'
import MultiSendCallOnlyContract_V1_3_0_Ethers from './MultiSend/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Ethers'
import MultiSendCallOnlyContract_V1_4_1_Ethers from './MultiSend/v1.4.1/MultiSendCallOnlyContract_V1_4_1_Ethers'
import SafeContract_V1_0_0_Ethers from './Safe/v1.0.0/SafeContract_V1_0_0_Ethers'
import SignMessageLibContract_V1_3_0_Ethers from './SignMessageLib/v1.3.0/SignMessageLibContract_V1_3_0_Ethers'
import SignMessageLibContract_V1_4_1_Ethers from './SignMessageLib/v1.4.1/SignMessageLibContract_V1_4_1_Ethers'
import SimulateTxAccessorContract_V1_3_0_Ethers from './SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_V1_3_0_Ethers'
import SimulateTxAccessorContract_V1_4_1_Ethers from './SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_V1_4_1_Ethers'
import SafeContract_v1_1_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.1.1/SafeContract_v1_1_1_Ethers'
import SafeContract_v1_2_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.2.0/SafeContract_v1_2_0_Ethers'
import SafeContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.3.0/SafeContract_v1_3_0_Ethers'
import SafeProxyFactoryContract_v1_0_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0_Ethers'
import SafeProxyFactoryContract_v1_1_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1_Ethers'
import SafeProxyFactoryContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0_Ethers'
import SafeProxyFactoryContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1_Ethers'
import SafeContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.4.1/SafeContract_v1_4_1_Ethers'
import EthersAdapter from '../EthersAdapter'
import { SafeContract_v1_1_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.1.1/SafeContract_v1_1_1'
import { SafeContract_v1_2_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.2.0/SafeContract_v1_2_0'
import { SafeContract_v1_3_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.3.0/SafeContract_v1_3_0'
import { SafeContract_v1_4_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.4.1/SafeContract_v1_4_1'
import { MultiSendContract_v1_4_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.4.1/MultiSendContract_v1_4_1'
import { MultiSendContract_v1_3_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.3.0/MultiSendContract_v1_3_0'
import { MultiSendContract_v1_1_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.1.1/MultiSendContract_v1_1_1'
import { MultiSendCallOnlyContract_v1_3_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0'
import { MultiSendCallOnlyContract_v1_4_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1'
import { SignMessageLibContract_v1_4_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1'
import { SignMessageLibContract_v1_3_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SignMessageLib/v1.3.0/SignMessageLibContract_v1_3_0'
import { SafeProxyFactoryContract_v1_0_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0'
import { SafeProxyFactoryContract_v1_1_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1'
import { SafeProxyFactoryContract_v1_3_0_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0'
import { SafeProxyFactoryContract_v1_4_1_Abi } from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1'

export async function getSafeContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: AbstractSigner | Provider,
  ethersAdapter: EthersAdapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined,
  isL1SafeSingleton?: boolean
): Promise<SafeContract_V1_0_0_Ethers> {
  const chainId = await ethersAdapter.getChainId()
  let safeContract
  switch (safeVersion) {
    case '1.4.1':
      safeContract = new SafeContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_4_1_Abi
      )
      // TODO: Remove this mapper after remove typechain
      return safeContract.mapToTypechainContract()
    case '1.3.0':
      safeContract = new SafeContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_3_0_Abi
      )
      // TODO: Remove this mapper after remove typechain
      return safeContract.mapToTypechainContract()
    case '1.2.0':
      safeContract = new SafeContract_v1_2_0_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_2_0_Abi
      )
      // TODO: Remove this mapper after remove typechain
      return safeContract.mapToTypechainContract()
    case '1.1.1':
      safeContract = new SafeContract_v1_1_1_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeContract_v1_1_1_Abi
      )
      return safeContract.mapToTypechainContract()
    case '1.0.0':
      safeContract = SafeSingleton_V1_0_0.connect(contractAddress, signerOrProvider)
      return new SafeContract_V1_0_0_Ethers(safeContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getCompatibilityFallbackHandlerContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signerOrProvider: AbstractSigner | Provider
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

export async function getMultiSendContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  ethersAdapter: EthersAdapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<
  | MultiSendContract_V1_4_1_Ethers
  | MultiSendContract_V1_3_0_Ethers
  | MultiSendContract_V1_1_1_Ethers
> {
  const chainId = await ethersAdapter.getChainId()
  switch (safeVersion) {
    case '1.4.1':
      return new MultiSendContract_V1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as unknown as MultiSendContract_v1_4_1_Abi
      )
    case '1.3.0':
      return new MultiSendContract_V1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as unknown as MultiSendContract_v1_3_0_Abi
      )
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new MultiSendContract_V1_1_1_Ethers(
        chainId,
        ethersAdapter,
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
  ethersAdapter: EthersAdapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<MultiSendCallOnlyContract_V1_4_1_Ethers | MultiSendCallOnlyContract_V1_3_0_Ethers> {
  const chainId = await ethersAdapter.getChainId()
  switch (safeVersion) {
    case '1.4.1':
      return new MultiSendCallOnlyContract_V1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as unknown as MultiSendCallOnlyContract_v1_4_1_Abi
      )
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new MultiSendCallOnlyContract_V1_3_0_Ethers(
        chainId,
        ethersAdapter,
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
  signerOrProvider: AbstractSigner | Provider,
  ethersAdapter: EthersAdapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined
) {
  const chainId = await ethersAdapter.getChainId()
  let safeProxyFactoryContract
  switch (safeVersion) {
    case '1.4.1':
      safeProxyFactoryContract = new SafeProxyFactoryContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeProxyFactoryContract_v1_4_1_Abi,
        signerOrProvider
      )
      return safeProxyFactoryContract.mapToTypechainContract() // remove this mapper after remove typechain

    case '1.3.0':
      safeProxyFactoryContract = new SafeProxyFactoryContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeProxyFactoryContract_v1_3_0_Abi,
        signerOrProvider
      )
      return safeProxyFactoryContract.mapToTypechainContract() // remove this mapper after remove typechain
    case '1.2.0':
    case '1.1.1':
      safeProxyFactoryContract = new SafeProxyFactoryContract_v1_1_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeProxyFactoryContract_v1_1_1_Abi,
        signerOrProvider
      )
      return safeProxyFactoryContract.mapToTypechainContract() // remove this mapper after remove typechain
    case '1.0.0':
      safeProxyFactoryContract = new SafeProxyFactoryContract_v1_0_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        // TODO: Remove this unknown after remove Typechain
        customContractAbi as unknown as SafeProxyFactoryContract_v1_0_0_Abi,
        signerOrProvider
      )
      return safeProxyFactoryContract.mapToTypechainContract() // remove this mapper after remove typechain
    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getSignMessageLibContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  ethersAdapter: EthersAdapter,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<SignMessageLibContract> {
  const chainId = await ethersAdapter.getChainId()
  let signMessageLibContract

  switch (safeVersion) {
    case '1.4.1':
      signMessageLibContract = new SignMessageLibContract_V1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as unknown as SignMessageLibContract_v1_4_1_Abi
      )

      // TODO: Remove this mapper after remove typechain
      return signMessageLibContract.mapToTypechainContract()
    case '1.3.0':
      signMessageLibContract = new SignMessageLibContract_V1_3_0_Ethers(
        chainId,
        ethersAdapter,
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
  contractAddress: string,
  signerOrProvider: AbstractSigner | Provider
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
  signerOrProvider: AbstractSigner | Provider
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
