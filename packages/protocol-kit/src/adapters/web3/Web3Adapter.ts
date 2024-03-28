import { generateTypedData, validateEip3770Address } from '@safe-global/protocol-kit/utils'
import { SigningMethod } from '@safe-global/protocol-kit/types'
import {
  CompatibilityFallbackHandlerContract,
  CreateCallContract,
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  SafeEIP712Args,
  SignMessageLibContract,
  SimulateTxAccessorContract
} from '@safe-global/safe-core-sdk-types'
import Web3 from 'web3'
import { Transaction } from 'web3-core'
import { ContractOptions } from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'
// TODO remove @types/web3 when migrating to web3@v4
// Deprecated https://www.npmjs.com/package/@types/web3?activeTab=readme
// Migration guide https://docs.web3js.org/docs/guides/web3_migration_guide#types
import type { JsonRPCResponse, Provider } from 'web3/providers'
import SafeContractWeb3 from './contracts/Safe/SafeContractWeb3'
import {
  getCompatibilityFallbackHandlerContractInstance,
  getCreateCallContractInstance,
  getMultiSendCallOnlyContractInstance,
  getMultiSendContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance,
  getSignMessageLibContractInstance,
  getSimulateTxAccessorContractInstance
} from './contracts/contractInstancesWeb3'
import MultiSendContract_v1_1_1_Web3 from './contracts/MultiSend/v1.1.1/MultiSendContract_V1_1_1_Web3'
import MultiSendContract_v1_3_0_Web3 from './contracts/MultiSend/v1.3.0/MultiSendContract_V1_3_0_Web3'
import MultiSendContract_v1_4_1_Web3 from './contracts/MultiSend/v1.4.1/MultiSendContract_V1_4_1_Web3'
import MultiSendCallOnlyContract_v1_3_0_Web3 from './contracts/MultiSend/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Web3'
import MultiSendCallOnlyContract_v1_4_1_Web3 from './contracts/MultiSend/v1.4.1/MultiSendCallOnlyContract_V1_4_1_Web3'

export interface Web3AdapterConfig {
  /** web3 - Web3 library */
  web3: Web3
  /** signerAddress - Address of the signer */
  signerAddress?: string
}

class Web3Adapter implements EthAdapter {
  #web3: Web3
  #signerAddress?: string

  constructor({ web3, signerAddress }: Web3AdapterConfig) {
    if (!web3) {
      throw new Error('web3 property missing from options')
    }
    this.#web3 = web3
    this.#signerAddress = signerAddress
  }

  isAddress(address: string): boolean {
    return this.#web3.utils.isAddress(address)
  }

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, chainId)
  }

  async getBalance(address: string, defaultBlock?: string | number): Promise<bigint> {
    const balance = defaultBlock
      ? await this.#web3.eth.getBalance(address, defaultBlock)
      : await this.#web3.eth.getBalance(address)
    return BigInt(balance)
  }

  async getNonce(address: string, defaultBlock?: string | number): Promise<number> {
    const nonce = defaultBlock
      ? await this.#web3.eth.getTransactionCount(address, defaultBlock)
      : await this.#web3.eth.getTransactionCount(address)
    return nonce
  }

  async getChainId(): Promise<bigint> {
    return BigInt(await this.#web3.eth.getChainId())
  }

  getChecksummedAddress(address: string): string {
    return this.#web3.utils.toChecksumAddress(address)
  }

  async getSafeContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi,
    isL1SafeSingleton
  }: GetContractProps): Promise<SafeContractWeb3> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid SafeProxy contract address')
    }

    return getSafeContractInstance(
      safeVersion,
      contractAddress,
      this,
      customContractAbi,
      isL1SafeSingleton
    )
  }

  async getSafeProxyFactoryContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid SafeProxyFactory contract address')
    }
    return getSafeProxyFactoryContractInstance(
      safeVersion,
      contractAddress,
      this,
      customContractAbi
    )
  }

  async getMultiSendContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<
    MultiSendContract_v1_4_1_Web3 | MultiSendContract_v1_3_0_Web3 | MultiSendContract_v1_1_1_Web3
  > {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid MultiSend contract address')
    }
    return getMultiSendContractInstance(safeVersion, contractAddress, this, customContractAbi)
  }

  async getMultiSendCallOnlyContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<
    MultiSendCallOnlyContract_v1_4_1_Web3 | MultiSendCallOnlyContract_v1_3_0_Web3
  > {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid MultiSendCallOnly contract address')
    }
    return getMultiSendCallOnlyContractInstance(
      safeVersion,
      contractAddress,
      this,
      customContractAbi
    )
  }

  async getCompatibilityFallbackHandlerContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CompatibilityFallbackHandlerContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid Compatibility Fallback Handler contract address')
    }
    return getCompatibilityFallbackHandlerContractInstance(
      safeVersion,
      contractAddress,
      this,
      customContractAbi
    )
  }

  async getSignMessageLibContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SignMessageLibContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid SignMessageLib contract address')
    }

    return getSignMessageLibContractInstance(safeVersion, contractAddress, this, customContractAbi)
  }

  async getCreateCallContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CreateCallContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid CreateCall contract address')
    }
    return getCreateCallContractInstance(safeVersion, contractAddress, this, customContractAbi)
  }

  async getSimulateTxAccessorContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SimulateTxAccessorContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid SimulateTxAccessor contract address')
    }
    return getSimulateTxAccessorContractInstance(
      safeVersion,
      contractAddress,
      this,
      customContractAbi
    )
  }

  getContract(address: string, abi: AbiItem | AbiItem[], options?: ContractOptions): any {
    return new this.#web3.eth.Contract(abi, address, options)
  }

  async getContractCode(address: string, defaultBlock?: string | number): Promise<string> {
    const code = defaultBlock
      ? await this.#web3.eth.getCode(address, defaultBlock)
      : await this.#web3.eth.getCode(address)
    return code
  }

  async isContractDeployed(address: string, defaultBlock?: string | number): Promise<boolean> {
    const contractCode = await this.getContractCode(address, defaultBlock)
    return contractCode !== '0x'
  }

  async getStorageAt(address: string, position: string): Promise<string> {
    const content = await this.#web3.eth.getStorageAt(address, position)
    const decodedContent = this.decodeParameters(['address'], content)
    return decodedContent[0]
  }

  async getTransaction(transactionHash: string): Promise<Transaction> {
    return this.#web3.eth.getTransaction(transactionHash)
  }

  async getSignerAddress(): Promise<string | undefined> {
    return this.#signerAddress
  }

  signMessage(message: string): Promise<string> {
    if (!this.#signerAddress) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    return this.#web3.eth.sign(message, this.#signerAddress)
  }

  async signTypedData(
    safeEIP712Args: SafeEIP712Args,
    methodVersion?: 'v3' | 'v4'
  ): Promise<string> {
    if (!this.#signerAddress) {
      throw new Error('This method requires a signer')
    }
    const typedData = generateTypedData(safeEIP712Args)
    let method = SigningMethod.ETH_SIGN_TYPED_DATA_V3
    if (methodVersion === 'v4') {
      method = SigningMethod.ETH_SIGN_TYPED_DATA_V4
    } else if (!methodVersion) {
      method = SigningMethod.ETH_SIGN_TYPED_DATA
    }
    const jsonTypedData = JSON.stringify(typedData)
    const signedTypedData = {
      jsonrpc: '2.0',
      method,
      params:
        methodVersion === 'v3' || methodVersion === 'v4'
          ? [this.#signerAddress, jsonTypedData]
          : [jsonTypedData, this.#signerAddress],
      from: this.#signerAddress,
      id: new Date().getTime()
    }
    return new Promise((resolve, reject) => {
      const provider = this.#web3.currentProvider as Provider
      function callback(err: Error): void
      function callback(err: null, val: JsonRPCResponse): void
      function callback(err: null | Error, val?: JsonRPCResponse): void {
        if (err) {
          reject(err)
          return
        }

        if (val?.result == null) {
          reject(new Error("EIP-712 is not supported by user's wallet"))
          return
        }
        resolve(val.result)
      }
      provider.send(signedTypedData, callback)
    })
  }

  async estimateGas(
    transaction: EthAdapterTransaction,
    callback?: (error: Error, gas: number) => void
  ): Promise<string> {
    return (await this.#web3.eth.estimateGas(transaction, callback)).toString()
  }

  call(transaction: EthAdapterTransaction, defaultBlock?: string | number): Promise<string> {
    return this.#web3.eth.call(transaction, defaultBlock)
  }

  encodeParameters(types: string[], values: any[]): string {
    return this.#web3.eth.abi.encodeParameters(types, values)
  }

  decodeParameters(types: any[], values: string): { [key: string]: any } {
    return this.#web3.eth.abi.decodeParameters(types, values)
  }
}

export default Web3Adapter
