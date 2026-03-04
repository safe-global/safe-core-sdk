import { toTxResult } from '@safe-global/protocol-kit/contracts/utils'
import ExtensibleFallbackHandlerBaseContract from '@safe-global/protocol-kit/contracts/ExtensibleFallbackHandler/ExtensibleFallbackHandlerBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  extensibleFallbackHandler_1_5_0_ContractArtifacts,
  ExtensibleFallbackHandlerContract_v1_5_0_Abi,
  ExtensibleFallbackHandlerContract_v1_5_0_Contract,
  ExtensibleFallbackHandlerContract_v1_5_0_Function,
  SafeContractFunction
} from '@safe-global/types-kit'

/**
 * ExtensibleFallbackHandlerContract_v1_5_0 is the implementation specific to the ExtensibleFallbackHandler contract version 1.5.0.
 *
 * This class specializes in handling interactions with the ExtensibleFallbackHandler contract version 1.5.0 using Ethers.js v6.
 *
 * @extends ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContract_v1_5_0_Abi> - Inherits from ExtensibleFallbackHandlerBaseContract with ABI specific to ExtensibleFallbackHandler contract version 1.5.0.
 * @implements ExtensibleFallbackHandlerContract_v1_5_0_Contract - Implements the interface specific to ExtensibleFallbackHandler contract version 1.5.0.
 */
class ExtensibleFallbackHandlerContract_v1_5_0
  extends ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContract_v1_5_0_Abi>
  implements ExtensibleFallbackHandlerContract_v1_5_0_Contract
{
  /**
   * Constructs an instance of ExtensibleFallbackHandlerContract_v1_5_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the ExtensibleFallbackHandler deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.5.0 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: ExtensibleFallbackHandlerContract_v1_5_0_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.5.0'
    const defaultAbi = extensibleFallbackHandler_1_5_0_ContractArtifacts.abi

    super(
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      deploymentType
    )
  }

  // Read methods

  /**
   * @param args - Array[safe, domainSeparator]
   * @returns Array[verifier]
   */
  domainVerifiers: ExtensibleFallbackHandlerContract_v1_5_0_Function<'domainVerifiers'> = async (
    args
  ) => {
    return [await this.read('domainVerifiers', args)]
  }

  /**
   * @param args - Array[_hash, signature]
   * @returns Array[magic]
   */
  isValidSignature: ExtensibleFallbackHandlerContract_v1_5_0_Function<'isValidSignature'> = async (
    args
  ) => {
    return [await this.read('isValidSignature', args)]
  }

  /**
   * @param args - Array[safe, interfaceId]
   * @returns Array[isSupported]
   */
  safeInterfaces: ExtensibleFallbackHandlerContract_v1_5_0_Function<'safeInterfaces'> = async (
    args
  ) => {
    return [await this.read('safeInterfaces', args)]
  }

  /**
   * @param args - Array[safe, selector]
   * @returns Array[handler]
   */
  safeMethods: ExtensibleFallbackHandlerContract_v1_5_0_Function<'safeMethods'> = async (args) => {
    return [await this.read('safeMethods', args)]
  }

  /**
   * @param args - Array[interfaceId]
   * @returns Array[isSupported]
   */
  supportsInterface: ExtensibleFallbackHandlerContract_v1_5_0_Function<'supportsInterface'> =
    async (args) => {
      return [await this.read('supportsInterface', args)]
    }

  /**
   * @param args - Array[operator, from, tokenId, data]
   * @returns Array[bytes4]
   */
  onERC721Received: ExtensibleFallbackHandlerContract_v1_5_0_Function<'onERC721Received'> = async (
    args
  ) => {
    return [await this.read('onERC721Received', args)]
  }

  /**
   * @param args - Array[operator, from, id, value, data]
   * @returns Array[bytes4]
   */
  onERC1155Received: ExtensibleFallbackHandlerContract_v1_5_0_Function<'onERC1155Received'> =
    async (args) => {
      return [await this.read('onERC1155Received', args)]
    }

  /**
   * @param args - Array[operator, from, ids, values, data]
   * @returns Array[bytes4]
   */
  onERC1155BatchReceived: ExtensibleFallbackHandlerContract_v1_5_0_Function<'onERC1155BatchReceived'> =
    async (args) => {
      return [await this.read('onERC1155BatchReceived', args)]
    }

  // Write methods (must be called via Safe transactions since msg.sender = Safe address)

  /**
   * @param args - Array[_interfaceId, handlerWithSelectors]
   */
  addSupportedInterfaceBatch: SafeContractFunction<
    ExtensibleFallbackHandlerContract_v1_5_0_Abi,
    'addSupportedInterfaceBatch'
  > = async (args, options) => {
    if (options && !options.gasLimit) {
      options.gasLimit = Number(
        await this.estimateGas('addSupportedInterfaceBatch', args, { ...options })
      )
    }
    return toTxResult(
      this.runner!,
      await this.write('addSupportedInterfaceBatch', args, options),
      options
    )
  }

  /**
   * @param args - Array[_interfaceId, selectors]
   */
  removeSupportedInterfaceBatch: SafeContractFunction<
    ExtensibleFallbackHandlerContract_v1_5_0_Abi,
    'removeSupportedInterfaceBatch'
  > = async (args, options) => {
    if (options && !options.gasLimit) {
      options.gasLimit = Number(
        await this.estimateGas('removeSupportedInterfaceBatch', args, { ...options })
      )
    }
    return toTxResult(
      this.runner!,
      await this.write('removeSupportedInterfaceBatch', args, options),
      options
    )
  }

  /**
   * @param args - Array[domainSeparator, newVerifier]
   */
  setDomainVerifier: SafeContractFunction<
    ExtensibleFallbackHandlerContract_v1_5_0_Abi,
    'setDomainVerifier'
  > = async (args, options) => {
    if (options && !options.gasLimit) {
      options.gasLimit = Number(await this.estimateGas('setDomainVerifier', args, { ...options }))
    }
    return toTxResult(this.runner!, await this.write('setDomainVerifier', args, options), options)
  }

  /**
   * @param args - Array[selector, newMethod]
   */
  setSafeMethod: SafeContractFunction<
    ExtensibleFallbackHandlerContract_v1_5_0_Abi,
    'setSafeMethod'
  > = async (args, options) => {
    if (options && !options.gasLimit) {
      options.gasLimit = Number(await this.estimateGas('setSafeMethod', args, { ...options }))
    }
    return toTxResult(this.runner!, await this.write('setSafeMethod', args, options), options)
  }

  /**
   * @param args - Array[interfaceId, supported]
   */
  setSupportedInterface: SafeContractFunction<
    ExtensibleFallbackHandlerContract_v1_5_0_Abi,
    'setSupportedInterface'
  > = async (args, options) => {
    if (options && !options.gasLimit) {
      options.gasLimit = Number(
        await this.estimateGas('setSupportedInterface', args, { ...options })
      )
    }
    return toTxResult(
      this.runner!,
      await this.write('setSupportedInterface', args, options),
      options
    )
  }
}

export default ExtensibleFallbackHandlerContract_v1_5_0
