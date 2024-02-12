import {
  Account,
  Address,
  BlockTag,
  Chain,
  Client,
  EstimateGasParameters,
  Hash,
  PublicClient,
  Transport,
  WalletClient,
  decodeAbiParameters,
  encodeAbiParameters,
  getAddress,
  isAddress,
  parseAbiParameter,
  parseAbiParameters
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
import { KeyedClient } from './types'
import { ViemContractBaseArgs } from './ViemContract'
import { toBigInt } from './utils'
import { generateTypedData } from '@safe-global/protocol-kit/utils'

export class ViemAdapter<
  TTransport extends Transport,
  TChain extends Chain,
  TAccount extends Account,
  const TClient extends
    | Client<TTransport, TChain, TAccount>
    | KeyedClient<TTransport, TChain, TAccount> = Client<TTransport, TChain, TAccount>
> implements EthAdapter
{
  private readonly _publicClient: PublicClient<TTransport, TChain> | undefined
  private readonly _walletClient: WalletClient<TTransport, TChain, TAccount> | undefined

  constructor(public readonly config: { client: TClient }) {
    const [publicClient, walletClient] = (() => {
      const { client } = config
      if ('public' in client && 'wallet' in client) return [client.public, client.wallet]
      if ('public' in client) return [client.public, undefined]
      if ('wallet' in client) return [undefined, client.wallet]
      return [client, client]
    })()

    this._publicClient = publicClient as PublicClient<TTransport, TChain>
    this._walletClient = walletClient as WalletClient<TTransport, TChain, TAccount>
  }

  get publicClient() {
    if (!this._publicClient) throw new Error('PublicClient is not configured')
    return this._publicClient
  }

  get walletClient() {
    if (!this._walletClient) throw new Error('WalletClient is not configured')
    return this._walletClient
  }

  isAddress = isAddress

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, BigInt(chainId))
  }

  getBalance(address: Address, defaultBlock?: BlockTag | undefined): Promise<bigint> {
    return this.publicClient.getBalance({
      address,
      blockTag: defaultBlock
    })
  }

  getNonce(address: Address, defaultBlock?: BlockTag | undefined): Promise<number> {
    return this.publicClient.getTransactionCount({
      address,
      blockTag: defaultBlock
    })
  }

  getChainId(): Promise<bigint> {
    return this.publicClient.getChainId().then(BigInt)
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
    return this.publicClient
      .getBytecode({
        address: address as Address,
        blockNumber: defaultBlock == null ? undefined : BigInt(defaultBlock)
      })
      .then((res) => res ?? '0x')
  }

  async isContractDeployed(
    address: string,
    defaultBlock?: string | number | undefined
  ): Promise<boolean> {
    return this.getContractCode(address, defaultBlock).then((code) => code !== '0x')
  }

  async getStorageAt(address: string, position: string): Promise<Hex> {
    const content = await this.publicClient.getStorageAt({
      address: address as Address,
      slot: position as Hex
    })
    const decodedContent = this.decodeParameters(['address'], content ?? '0x')
    return decodedContent[0]
  }

  getTransaction(transactionHash: string) {
    return this.publicClient.getTransaction({
      hash: transactionHash as Hash
    })
  }

  async getSignerAddress() {
    return this.walletClient.account.address
  }

  signMessage(message: string): Promise<Hash> {
    return this.walletClient.signMessage({
      account: this.walletClient.account,
      message: message
    })
  }

  signTypedData(
    safeTransactionEIP712Args: SafeEIP712Args,
    signTypedDataVersion?: string
  ): Promise<Hex> {
    const typedData = generateTypedData(safeTransactionEIP712Args)
    return this.walletClient.signTypedData({
      account: this.walletClient.account,
      primaryType: 'SafeTx',
      domain: {
        chainId: typedData.domain.chainId == null ? undefined : Number(typedData.domain.chainId),
        version: signTypedDataVersion
      },
      types:
        typedData.primaryType === 'SafeMessage'
          ? { SafeMessage: (typedData as EIP712TypedDataMessage).types.SafeMessage }
          : { SafeTx: (typedData as EIP712TypedDataTx).types.SafeTx },
      message: typedData.message
    })
  }

  async estimateGas(transaction: EthAdapterTransaction) {
    return this.publicClient
      .estimateGas({
        account: transaction.from as Address,
        to: transaction.to as Address,
        data: transaction.data as Hex,
        value: toBigInt(transaction.value),
        gasPrice: toBigInt(transaction.gasPrice),
        gas: toBigInt(transaction.gasLimit),
        maxFeePerGas: toBigInt(transaction.maxFeePerGas),
        maxPriorityFeePerGas: toBigInt(transaction.maxPriorityFeePerGas)
      } as EstimateGasParameters)
      .then(String)
  }

  async call(
    transaction: EthAdapterTransaction,
    defaultBlock?: string | number | undefined
  ): Promise<string> {
    return this.publicClient
      .call({
        to: transaction.to as Address,
        account: transaction.from as Address,
        data: transaction.data as Hex,
        value: toBigInt(transaction.value),
        gasPrice: toBigInt(transaction.gasPrice),
        gas: toBigInt(transaction.gasLimit),
        blockNumber: toBigInt(defaultBlock)
      })
      .then((res) => res.data ?? '0x')
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
