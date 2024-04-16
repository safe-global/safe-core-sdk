import { AbstractSigner, Provider } from 'ethers'
import { AbiItem } from 'web3-utils'
import {
  DeepWriteable,
  SafeVersion,
  SafeContract_v1_3_0_Abi,
  SafeContract_v1_4_1_Abi,
  SafeContract_v1_2_0_Abi,
  SafeContract_v1_1_1_Abi,
  SafeContract_v1_0_0_Abi,
  CompatibilityFallbackHandlerContract_v1_4_1_Abi,
  CompatibilityFallbackHandlerContract_v1_3_0_Abi,
  MultiSendContract_v1_4_1_Abi,
  MultiSendContract_v1_3_0_Abi,
  MultiSendContract_v1_1_1_Abi,
  MultiSendCallOnlyContract_v1_4_1_Abi,
  MultiSendCallOnlyContract_v1_3_0_Abi,
  SafeProxyFactoryContract_v1_4_1_Abi,
  SafeProxyFactoryContract_v1_3_0_Abi,
  SafeProxyFactoryContract_v1_1_1_Abi,
  SafeProxyFactoryContract_v1_0_0_Abi,
  SignMessageLibContract_v1_4_1_Abi,
  SignMessageLibContract_v1_3_0_Abi,
  CreateCallContract_v1_4_1_Abi,
  CreateCallContract_v1_3_0_Abi,
  SimulateTxAccessorContract_v1_4_1_Abi,
  SimulateTxAccessorContract_v1_3_0_Abi
} from '@safe-global/safe-core-sdk-types'
import CreateCallContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/CreateCall/v1.3.0/CreateCallContract_v1_3_0_Ethers'
import CreateCallContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/CreateCall/v1.4.1/CreateCallContract_v1_4_1_Ethers'
import MultiSendContract_v1_1_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.1.1/MultiSendContract_v1_1_1_Ethers'
import MultiSendContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.3.0/MultiSendContract_v1_3_0_Ethers'
import MultiSendContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.4.1/MultiSendContract_v1_4_1_Ethers'
import MultiSendCallOnlyContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0_Ethers'
import MultiSendCallOnlyContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1_Ethers'
import SignMessageLibContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SignMessageLib/v1.3.0/SignMessageLibContract_v1_3_0_Ethers'
import SignMessageLibContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1_Ethers'
import SafeContract_v1_0_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.0.0/SafeContract_v1_0_0_Ethers'
import SafeContract_v1_1_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.1.1/SafeContract_v1_1_1_Ethers'
import SafeContract_v1_2_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.2.0/SafeContract_v1_2_0_Ethers'
import SafeContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.3.0/SafeContract_v1_3_0_Ethers'
import SafeContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.4.1/SafeContract_v1_4_1_Ethers'
import SafeProxyFactoryContract_v1_0_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0_Ethers'
import SafeProxyFactoryContract_v1_1_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1_Ethers'
import SafeProxyFactoryContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0_Ethers'
import SafeProxyFactoryContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1_Ethers'
import SimulateTxAccessorContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_v1_3_0_Ethers'
import SimulateTxAccessorContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_v1_4_1_Ethers'
import CompatibilityFallbackHandlerContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandlerContract_v1_3_0_Ethers'
import CompatibilityFallbackHandlerContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandlerContract_v1_4_1_Ethers'
import EthersAdapter from '../EthersAdapter'

// TODO: create a JSdoc for this function
export async function getSafeContractInstance(
  safeVersion: SafeVersion,
  ethersAdapter: EthersAdapter,
  contractAddress?: string,
  customContractAbi?: AbiItem | AbiItem[] | undefined,
  isL1SafeSingleton?: boolean
): Promise<
  | SafeContract_v1_4_1_Ethers
  | SafeContract_v1_3_0_Ethers
  | SafeContract_v1_2_0_Ethers
  | SafeContract_v1_1_1_Ethers
  | SafeContract_v1_0_0_Ethers
> {
  const chainId = await ethersAdapter.getChainId()

  switch (safeVersion) {
    case '1.4.1':
      return new SafeContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as DeepWriteable<SafeContract_v1_4_1_Abi>
      )

    case '1.3.0':
      return new SafeContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as DeepWriteable<SafeContract_v1_3_0_Abi>
      )

    case '1.2.0':
      return new SafeContract_v1_2_0_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as DeepWriteable<SafeContract_v1_2_0_Abi>
      )

    case '1.1.1':
      return new SafeContract_v1_1_1_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as DeepWriteable<SafeContract_v1_1_1_Abi>
      )

    case '1.0.0':
      return new SafeContract_v1_0_0_Ethers(
        chainId,
        ethersAdapter,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as DeepWriteable<SafeContract_v1_0_0_Abi>
      )

    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getCompatibilityFallbackHandlerContractInstance(
  safeVersion: SafeVersion,
  ethersAdapter: EthersAdapter,
  contractAddress?: string,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<
  | CompatibilityFallbackHandlerContract_v1_4_1_Ethers
  | CompatibilityFallbackHandlerContract_v1_3_0_Ethers
> {
  const chainId = await ethersAdapter.getChainId()
  switch (safeVersion) {
    case '1.4.1':
      return new CompatibilityFallbackHandlerContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<CompatibilityFallbackHandlerContract_v1_4_1_Abi>
      )

    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
      return new CompatibilityFallbackHandlerContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<CompatibilityFallbackHandlerContract_v1_3_0_Abi>
      )

    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getMultiSendContractInstance(
  safeVersion: SafeVersion,
  ethersAdapter: EthersAdapter,
  contractAddress?: string,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<
  | MultiSendContract_v1_4_1_Ethers
  | MultiSendContract_v1_3_0_Ethers
  | MultiSendContract_v1_1_1_Ethers
> {
  const chainId = await ethersAdapter.getChainId()
  switch (safeVersion) {
    case '1.4.1':
      return new MultiSendContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<MultiSendContract_v1_4_1_Abi>
      )

    case '1.3.0':
      return new MultiSendContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<MultiSendContract_v1_3_0_Abi>
      )

    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new MultiSendContract_v1_1_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<MultiSendContract_v1_1_1_Abi>
      )

    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getMultiSendCallOnlyContractInstance(
  safeVersion: SafeVersion,
  ethersAdapter: EthersAdapter,
  contractAddress?: string,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<MultiSendCallOnlyContract_v1_4_1_Ethers | MultiSendCallOnlyContract_v1_3_0_Ethers> {
  const chainId = await ethersAdapter.getChainId()
  switch (safeVersion) {
    case '1.4.1':
      return new MultiSendCallOnlyContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<MultiSendCallOnlyContract_v1_4_1_Abi>
      )

    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new MultiSendCallOnlyContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<MultiSendCallOnlyContract_v1_3_0_Abi>
      )
    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getSafeProxyFactoryContractInstance(
  safeVersion: SafeVersion,
  ethersAdapter: EthersAdapter,
  // TODO: remove this ??
  signerOrProvider: AbstractSigner | Provider,
  contractAddress?: string,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<
  | SafeProxyFactoryContract_v1_4_1_Ethers
  | SafeProxyFactoryContract_v1_3_0_Ethers
  | SafeProxyFactoryContract_v1_1_1_Ethers
  | SafeProxyFactoryContract_v1_0_0_Ethers
> {
  const chainId = await ethersAdapter.getChainId()

  switch (safeVersion) {
    case '1.4.1':
      return new SafeProxyFactoryContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<SafeProxyFactoryContract_v1_4_1_Abi>,
        signerOrProvider
      )

    case '1.3.0':
      return new SafeProxyFactoryContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<SafeProxyFactoryContract_v1_3_0_Abi>,
        signerOrProvider
      )

    case '1.2.0':
    case '1.1.1':
      return new SafeProxyFactoryContract_v1_1_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<SafeProxyFactoryContract_v1_1_1_Abi>,
        signerOrProvider
      )

    case '1.0.0':
      return new SafeProxyFactoryContract_v1_0_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<SafeProxyFactoryContract_v1_0_0_Abi>,
        signerOrProvider
      )

    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getSignMessageLibContractInstance(
  safeVersion: SafeVersion,
  ethersAdapter: EthersAdapter,
  contractAddress?: string,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<SignMessageLibContract_v1_4_1_Ethers | SignMessageLibContract_v1_3_0_Ethers> {
  const chainId = await ethersAdapter.getChainId()

  switch (safeVersion) {
    case '1.4.1':
      return new SignMessageLibContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<SignMessageLibContract_v1_4_1_Abi>
      )

    case '1.3.0':
      return new SignMessageLibContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<SignMessageLibContract_v1_3_0_Abi>
      )

    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getCreateCallContractInstance(
  safeVersion: SafeVersion,
  ethersAdapter: EthersAdapter,
  contractAddress?: string,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<CreateCallContract_v1_4_1_Ethers | CreateCallContract_v1_3_0_Ethers> {
  const chainId = await ethersAdapter.getChainId()

  switch (safeVersion) {
    case '1.4.1':
      return new CreateCallContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<CreateCallContract_v1_4_1_Abi>
      )

    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      return new CreateCallContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<CreateCallContract_v1_3_0_Abi>
      )

    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getSimulateTxAccessorContractInstance(
  safeVersion: SafeVersion,
  ethersAdapter: EthersAdapter,
  contractAddress?: string,
  customContractAbi?: AbiItem | AbiItem[] | undefined
): Promise<SimulateTxAccessorContract_v1_4_1_Ethers | SimulateTxAccessorContract_v1_3_0_Ethers> {
  const chainId = await ethersAdapter.getChainId()

  switch (safeVersion) {
    case '1.4.1':
      return new SimulateTxAccessorContract_v1_4_1_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<SimulateTxAccessorContract_v1_4_1_Abi>
      )

    case '1.3.0':
      return new SimulateTxAccessorContract_v1_3_0_Ethers(
        chainId,
        ethersAdapter,
        contractAddress,
        customContractAbi as DeepWriteable<SimulateTxAccessorContract_v1_3_0_Abi>
      )
    default:
      throw new Error('Invalid Safe version')
  }
}
