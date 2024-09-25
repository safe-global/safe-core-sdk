import { Abi } from 'viem'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
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
  SimulateTxAccessorContract_v1_3_0_Abi,
  SafeWebAuthnSignerFactoryContract_v0_2_1_Abi,
  SafeWebAuthnSharedSignerContract_v0_2_1_Abi
} from '@safe-global/types-kit'
import CreateCallContract_v1_3_0 from './CreateCall/v1.3.0/CreateCallContract_v1_3_0'
import CreateCallContract_v1_4_1 from './CreateCall/v1.4.1/CreateCallContract_v1_4_1'
import MultiSendContract_v1_1_1 from './MultiSend/v1.1.1/MultiSendContract_v1_1_1'
import MultiSendContract_v1_3_0 from './MultiSend/v1.3.0/MultiSendContract_v1_3_0'
import MultiSendContract_v1_4_1 from './MultiSend/v1.4.1/MultiSendContract_v1_4_1'
import MultiSendCallOnlyContract_v1_3_0 from './MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0'
import MultiSendCallOnlyContract_v1_4_1 from './MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1'
import SignMessageLibContract_v1_3_0 from './SignMessageLib/v1.3.0/SignMessageLibContract_v1_3_0'
import SignMessageLibContract_v1_4_1 from './SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1'
import SafeContract_v1_0_0 from './Safe/v1.0.0/SafeContract_v1_0_0'
import SafeContract_v1_1_1 from './Safe/v1.1.1/SafeContract_v1_1_1'
import SafeContract_v1_2_0 from './Safe/v1.2.0/SafeContract_v1_2_0'
import SafeContract_v1_3_0 from './Safe/v1.3.0/SafeContract_v1_3_0'
import SafeContract_v1_4_1 from './Safe/v1.4.1/SafeContract_v1_4_1'
import SafeProxyFactoryContract_v1_0_0 from './SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0'
import SafeProxyFactoryContract_v1_1_1 from './SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1'
import SafeProxyFactoryContract_v1_3_0 from './SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0'
import SafeProxyFactoryContract_v1_4_1 from './SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1'
import SimulateTxAccessorContract_v1_3_0 from './SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_v1_3_0'
import SimulateTxAccessorContract_v1_4_1 from './SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_v1_4_1'
import CompatibilityFallbackHandlerContract_v1_3_0 from './CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandlerContract_v1_3_0'
import CompatibilityFallbackHandlerContract_v1_4_1 from './CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandlerContract_v1_4_1'
import SafeWebAuthnSignerFactoryContract_v0_2_1 from './SafeWebAuthnSignerFactory/v0.2.1/SafeWebAuthnSignerFactoryContract_v0_2_1'
import SafeWebAuthnSharedSignerContract_v0_2_1 from './SafeWebAuthnSharedSigner/v0.2.1/SafeWebAuthnSharedSignerContract_v0_2_1'
import SafeProvider from '../SafeProvider'

export async function getSafeContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  isL1SafeSingleton?: boolean,
  deploymentType?: DeploymentType
): Promise<
  | SafeContract_v1_4_1
  | SafeContract_v1_3_0
  | SafeContract_v1_2_0
  | SafeContract_v1_1_1
  | SafeContract_v1_0_0
> {
  const chainId = await safeProvider.getChainId()
  let safeContractInstance

  switch (safeVersion) {
    case '1.4.1':
      safeContractInstance = new SafeContract_v1_4_1(
        chainId,
        safeProvider,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as SafeContract_v1_4_1_Abi,
        deploymentType
      )
      break
    case '1.3.0':
      safeContractInstance = new SafeContract_v1_3_0(
        chainId,
        safeProvider,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as SafeContract_v1_3_0_Abi,
        deploymentType
      )
      break
    case '1.2.0':
      safeContractInstance = new SafeContract_v1_2_0(
        chainId,
        safeProvider,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as SafeContract_v1_2_0_Abi,
        deploymentType
      )
      break
    case '1.1.1':
      safeContractInstance = new SafeContract_v1_1_1(
        chainId,
        safeProvider,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as SafeContract_v1_1_1_Abi,
        deploymentType
      )
      break
    case '1.0.0':
      safeContractInstance = new SafeContract_v1_0_0(
        chainId,
        safeProvider,
        isL1SafeSingleton,
        contractAddress,
        customContractAbi as SafeContract_v1_0_0_Abi,
        deploymentType
      )
      break
    default:
      throw new Error('Invalid Safe version')
  }

  await safeContractInstance.init()

  return safeContractInstance
}

export async function getCompatibilityFallbackHandlerContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<
  CompatibilityFallbackHandlerContract_v1_4_1 | CompatibilityFallbackHandlerContract_v1_3_0
> {
  const chainId = await safeProvider.getChainId()
  let compatibilityFallbackHandlerInstance

  switch (safeVersion) {
    case '1.4.1':
      compatibilityFallbackHandlerInstance = new CompatibilityFallbackHandlerContract_v1_4_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as CompatibilityFallbackHandlerContract_v1_4_1_Abi,
        deploymentType
      )
      break
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
      compatibilityFallbackHandlerInstance = new CompatibilityFallbackHandlerContract_v1_3_0(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as CompatibilityFallbackHandlerContract_v1_3_0_Abi,
        deploymentType
      )
      break
    default:
      throw new Error('Invalid Safe version')
  }

  await compatibilityFallbackHandlerInstance.init()

  return compatibilityFallbackHandlerInstance
}

export async function getMultiSendContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<MultiSendContract_v1_4_1 | MultiSendContract_v1_3_0 | MultiSendContract_v1_1_1> {
  const chainId = await safeProvider.getChainId()
  let multiSendContractInstance

  switch (safeVersion) {
    case '1.4.1':
      multiSendContractInstance = new MultiSendContract_v1_4_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as MultiSendContract_v1_4_1_Abi,
        deploymentType
      )
      break
    case '1.3.0':
      multiSendContractInstance = new MultiSendContract_v1_3_0(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as MultiSendContract_v1_3_0_Abi,
        deploymentType
      )
      break
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      multiSendContractInstance = new MultiSendContract_v1_1_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as MultiSendContract_v1_1_1_Abi,
        deploymentType
      )
      break
    default:
      throw new Error('Invalid Safe version')
  }

  await multiSendContractInstance.init()

  return multiSendContractInstance
}

export async function getMultiSendCallOnlyContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<MultiSendCallOnlyContract_v1_4_1 | MultiSendCallOnlyContract_v1_3_0> {
  const chainId = await safeProvider.getChainId()
  let multiSendCallOnlyContractInstance

  switch (safeVersion) {
    case '1.4.1':
      multiSendCallOnlyContractInstance = new MultiSendCallOnlyContract_v1_4_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as MultiSendCallOnlyContract_v1_4_1_Abi,
        deploymentType
      )
      break
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      multiSendCallOnlyContractInstance = new MultiSendCallOnlyContract_v1_3_0(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as MultiSendCallOnlyContract_v1_3_0_Abi,
        deploymentType
      )
      break
    default:
      throw new Error('Invalid Safe version')
  }

  await multiSendCallOnlyContractInstance.init()

  return multiSendCallOnlyContractInstance
}

export async function getSafeProxyFactoryContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<
  | SafeProxyFactoryContract_v1_4_1
  | SafeProxyFactoryContract_v1_3_0
  | SafeProxyFactoryContract_v1_1_1
  | SafeProxyFactoryContract_v1_0_0
> {
  const chainId = await safeProvider.getChainId()
  let safeProxyFactoryContractInstance

  switch (safeVersion) {
    case '1.4.1':
      safeProxyFactoryContractInstance = new SafeProxyFactoryContract_v1_4_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as SafeProxyFactoryContract_v1_4_1_Abi,
        deploymentType
      )
      break
    case '1.3.0':
      safeProxyFactoryContractInstance = new SafeProxyFactoryContract_v1_3_0(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as SafeProxyFactoryContract_v1_3_0_Abi,
        deploymentType
      )
      break
    case '1.2.0':
    case '1.1.1':
      safeProxyFactoryContractInstance = new SafeProxyFactoryContract_v1_1_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as SafeProxyFactoryContract_v1_1_1_Abi,
        deploymentType
      )
      break
    case '1.0.0':
      safeProxyFactoryContractInstance = new SafeProxyFactoryContract_v1_0_0(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as SafeProxyFactoryContract_v1_0_0_Abi,
        deploymentType
      )
      break
    default:
      throw new Error('Invalid Safe version')
  }

  await safeProxyFactoryContractInstance.init()

  return safeProxyFactoryContractInstance
}

export async function getSignMessageLibContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<SignMessageLibContract_v1_4_1 | SignMessageLibContract_v1_3_0> {
  const chainId = await safeProvider.getChainId()
  let signMessageLibContractInstance

  switch (safeVersion) {
    case '1.4.1':
      signMessageLibContractInstance = new SignMessageLibContract_v1_4_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as SignMessageLibContract_v1_4_1_Abi,
        deploymentType
      )
      break
    case '1.3.0':
      signMessageLibContractInstance = new SignMessageLibContract_v1_3_0(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as SignMessageLibContract_v1_3_0_Abi,
        deploymentType
      )
      break
    default:
      throw new Error('Invalid Safe version')
  }

  await signMessageLibContractInstance.init()

  return signMessageLibContractInstance
}

export async function getCreateCallContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<CreateCallContract_v1_4_1 | CreateCallContract_v1_3_0> {
  const chainId = await safeProvider.getChainId()
  let createCallContractInstance

  switch (safeVersion) {
    case '1.4.1':
      createCallContractInstance = new CreateCallContract_v1_4_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as CreateCallContract_v1_4_1_Abi,
        deploymentType
      )
      break
    case '1.3.0':
    case '1.2.0':
    case '1.1.1':
    case '1.0.0':
      createCallContractInstance = new CreateCallContract_v1_3_0(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as CreateCallContract_v1_3_0_Abi,
        deploymentType
      )
      break
    default:
      throw new Error('Invalid Safe version')
  }

  await createCallContractInstance.init()

  return createCallContractInstance
}

export async function getSimulateTxAccessorContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<SimulateTxAccessorContract_v1_4_1 | SimulateTxAccessorContract_v1_3_0> {
  const chainId = await safeProvider.getChainId()
  let simulateTxAccessorContractInstance

  switch (safeVersion) {
    case '1.4.1':
      simulateTxAccessorContractInstance = new SimulateTxAccessorContract_v1_4_1(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as SimulateTxAccessorContract_v1_4_1_Abi,
        deploymentType
      )
      break
    case '1.3.0':
      simulateTxAccessorContractInstance = new SimulateTxAccessorContract_v1_3_0(
        chainId,
        safeProvider,
        contractAddress,
        customContractAbi as SimulateTxAccessorContract_v1_3_0_Abi,
        deploymentType
      )
      break
    default:
      throw new Error('Invalid Safe version')
  }

  await simulateTxAccessorContractInstance.init()

  return simulateTxAccessorContractInstance
}

export async function getSafeWebAuthnSignerFactoryContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<SafeWebAuthnSignerFactoryContract_v0_2_1> {
  const chainId = await safeProvider.getChainId()

  switch (safeVersion) {
    case '1.4.1':
    case '1.3.0':
      const safeWebAuthnSignerFactoryContractInstance =
        new SafeWebAuthnSignerFactoryContract_v0_2_1(
          chainId,
          safeProvider,
          safeVersion,
          contractAddress,
          customContractAbi as SafeWebAuthnSignerFactoryContract_v0_2_1_Abi,
          deploymentType
        )

      await safeWebAuthnSignerFactoryContractInstance.init()

      return safeWebAuthnSignerFactoryContractInstance

    default:
      throw new Error('Invalid Safe version')
  }
}

export async function getSafeWebAuthnSharedSignerContractInstance(
  safeVersion: SafeVersion,
  safeProvider: SafeProvider,
  contractAddress?: string,
  customContractAbi?: Abi,
  deploymentType?: DeploymentType
): Promise<SafeWebAuthnSharedSignerContract_v0_2_1> {
  const chainId = await safeProvider.getChainId()

  switch (safeVersion) {
    case '1.4.1':
    case '1.3.0':
      const safeWebAuthnSharedSignerContractInstance = new SafeWebAuthnSharedSignerContract_v0_2_1(
        chainId,
        safeProvider,
        safeVersion,
        contractAddress,
        customContractAbi as SafeWebAuthnSharedSignerContract_v0_2_1_Abi,
        deploymentType
      )

      await safeWebAuthnSharedSignerContractInstance.init()

      return safeWebAuthnSharedSignerContractInstance

    default:
      throw new Error('Invalid Safe version')
  }
}
