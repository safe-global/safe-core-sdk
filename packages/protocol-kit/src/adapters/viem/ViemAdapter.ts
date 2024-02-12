import {
  call,
  estimateGas,
  getBalance,
  getBytecode,
  getChainId,
  getStorageAt,
  getTransaction,
  getTransactionCount,
  signMessage,
  signTypedData
} from 'viem/actions'
import {
  Address,
  BlockTag,
  Client,
  EstimateGasParameters,
  Hash,
  decodeAbiParameters,
  encodeAbiParameters,
  getAddress,
  isAddress,
  parseAbiParameter,
  parseAbiParameters,
  type Transport,
  type Chain,
  type Account
} from 'viem'
import { validateEip3770Address } from '../..'
import {
  CreateCallContract,
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  MultiSendCallOnlyContract,
  MultiSendContract,
  SafeContract,
  SafeProxyFactoryContract,
  SignMessageLibContract,
  SimulateTxAccessorContract,
  type SafeEIP712Args,
  type EIP712TypedDataMessage,
  type EIP712TypedDataTx
} from '@safe-global/safe-core-sdk-types'
import {
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance,
  getCompatibilityFallbackHandlerContractInstance,
  getMultiSendContractInstance,
  getMultiSendCallOnlyContractInstance,
  getCreateCallContractInstance,
  getSignMessageLibContractInstance,
  getSimulateTxAccessorContractInstance
} from './contracts/contractInstancesViem'
import { Hex } from 'viem'
import { ViemContractBaseArgs } from './ViemContract'
import { toBigInt } from './utils'
import { generateTypedData } from '@safe-global/protocol-kit/utils'

export class ViemAdapter<const TClient extends Client<Transport, Chain>> implements EthAdapter {
  constructor(public readonly config: { client: TClient }) {}

  get client() {
    return this.config.client
  }

  get walletClient() {
    if (this.config.client.account == null) {
      throw new Error('No wallet client found')
    }
    return this.config.client as Client<Transport, Chain, Account>
  }

  isAddress = isAddress

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, BigInt(chainId))
  }

  getBalance(address: Address, defaultBlock?: BlockTag | undefined): Promise<bigint> {
    return getBalance(this.client, {
      address,
      blockTag: defaultBlock
    })
  }

  getNonce(address: Address, defaultBlock?: BlockTag | undefined): Promise<number> {
    return getTransactionCount(this.client, {
      address,
      blockTag: defaultBlock
    })
  }

  getChainId(): Promise<bigint> {
    return getChainId(this.client).then(BigInt)
  }

  getChecksummedAddress = getAddress

  async getSafeContract(config: GetContractProps): Promise<SafeContract> {
    return getSafeContractInstance(
      config.safeVersion,
      await this.getViemContractArgs('Safe', config)
    )
  }

  async getMultiSendContract(config: GetContractProps): Promise<MultiSendContract> {
    return getMultiSendContractInstance(
      config.safeVersion,
      await this.getViemContractArgs('MultiSend', config)
    )
  }

  async getMultiSendCallOnlyContract(config: GetContractProps): Promise<MultiSendCallOnlyContract> {
    return getMultiSendCallOnlyContractInstance(
      config.safeVersion,
      await this.getViemContractArgs('MultiSendcallOnly', config)
    )
  }

  async getCompatibilityFallbackHandlerContract(config: GetContractProps) {
    return getCompatibilityFallbackHandlerContractInstance(
      config.safeVersion,
      await this.getViemContractArgs('CompatibilityFallbackHandler', config)
    )
  }

  async getSafeProxyFactoryContract(config: GetContractProps): Promise<SafeProxyFactoryContract> {
    return getSafeProxyFactoryContractInstance(
      config.safeVersion,
      await this.getViemContractArgs('SafeProxyFactory', config)
    )
  }

  async getSignMessageLibContract(config: GetContractProps): Promise<SignMessageLibContract> {
    return getSignMessageLibContractInstance(
      config.safeVersion,
      await this.getViemContractArgs('SignMessageLib', config)
    )
  }

  async getCreateCallContract(config: GetContractProps): Promise<CreateCallContract> {
    return getCreateCallContractInstance(
      config.safeVersion,
      await this.getViemContractArgs('CreateCall', config)
    )
  }

  async getSimulateTxAccessorContract(
    config: GetContractProps
  ): Promise<SimulateTxAccessorContract> {
    return getSimulateTxAccessorContractInstance(
      config.safeVersion,
      await this.getViemContractArgs('SimulateTxAccesssor', config)
    )
  }

  async getContractCode(address: string, defaultBlock?: string | number | undefined): Promise<Hex> {
    return getBytecode(this.client, {
      address: address as Address,
      blockNumber: defaultBlock == null ? undefined : BigInt(defaultBlock)
    }).then((res) => res ?? '0x')
  }

  async isContractDeployed(
    address: string,
    defaultBlock?: string | number | undefined
  ): Promise<boolean> {
    return this.getContractCode(address, defaultBlock).then((code) => code !== '0x')
  }

  async getStorageAt(address: string, position: string): Promise<Hex> {
    const content = await getStorageAt(this.client, {
      address: address as Address,
      slot: position as Hex
    })
    const decodedContent = this.decodeParameters(['address'], content ?? '0x')
    return decodedContent[0]
  }

  getTransaction(transactionHash: string) {
    return getTransaction(this.client, {
      hash: transactionHash as Hash
    })
  }

  async getSignerAddress() {
    return this.walletClient.account.address
  }

  signMessage(message: string): Promise<Hash> {
    return signMessage(this.walletClient, {
      message: message
    })
  }

  signTypedData(safeTransactionEIP712Args: SafeEIP712Args): Promise<Hex> {
    const typedData = generateTypedData(safeTransactionEIP712Args)
    return signTypedData(this.walletClient, {
      primaryType: typedData.primaryType,
      domain: {
        chainId: typedData.domain.chainId == null ? undefined : Number(typedData.domain.chainId),
        verifyingContract: typedData.domain.verifyingContract as Address
      },
      types:
        typedData.primaryType === 'SafeMessage'
          ? { SafeMessage: (typedData as EIP712TypedDataMessage).types.SafeMessage }
          : { SafeTx: (typedData as EIP712TypedDataTx).types.SafeTx },
      message: typedData.message
    })
  }

  async estimateGas(transaction: EthAdapterTransaction) {
    return estimateGas(this.client, {
      account: transaction.from as Address,
      to: transaction.to as Address,
      data: transaction.data as Hex,
      value: toBigInt(transaction.value),
      gasPrice: toBigInt(transaction.gasPrice),
      gas: toBigInt(transaction.gasLimit),
      maxFeePerGas: toBigInt(transaction.maxFeePerGas),
      maxPriorityFeePerGas: toBigInt(transaction.maxPriorityFeePerGas)
    } as EstimateGasParameters).then(String)
  }

  async call(
    transaction: EthAdapterTransaction,
    defaultBlock?: string | number | undefined
  ): Promise<string> {
    return call(this.client, {
      to: transaction.to as Address,
      account: transaction.from as Address,
      data: transaction.data as Hex,
      value: toBigInt(transaction.value),
      gasPrice: toBigInt(transaction.gasPrice),
      gas: toBigInt(transaction.gasLimit),
      blockNumber: toBigInt(defaultBlock)
    }).then((res) => res.data ?? '0x')
  }

  encodeParameters(types: string[], values: any[]): string {
    return encodeAbiParameters(formatAbi(types), values)
  }

  decodeParameters(types: any[], values: string): { [key: string]: any } {
    return decodeAbiParameters(formatAbi(types), values as Hex)
  }

  private async getViemContractArgs(
    contractName: string,
    config: GetContractProps
  ): Promise<ViemContractBaseArgs> {
    const chainId = await this.getChainId()
    const address =
      config.customContractAddress ??
      config.singletonDeployment?.networkAddresses[chainId.toString()]
    if (address == null || !isAddress(address)) {
      throw new Error(`Invalid ${contractName} contract address`)
    }
    return { address, client: this.config.client } as ViemContractBaseArgs
  }
}

function formatAbi(types: string[]) {
  if (types.length === 1) return [parseAbiParameter(types[0])]
  return parseAbiParameters(types.join(', '))
}
