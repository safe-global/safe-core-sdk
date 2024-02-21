import { ethers } from 'ethers'
import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import {
  EstimateUserOperationGas,
  FeeData,
  Safe4337InitOptions,
  Safe4337Options,
  SafeUserOperation,
  UserOperation
} from './types'
import { MetaTransactionData, OperationType, SafeSignature } from '@safe-global/safe-core-sdk-types'
import Safe, {
  EthSafeSignature,
  EthersAdapter,
  SigningMethod,
  encodeMultiSendData
} from '@safe-global/protocol-kit'
import EthSafeOperation from './EthSafeOperation'
import { EIP712_SAFE_OPERATION_TYPE, INTERFACES, SAFE_ADDRESSES_MAP } from './constants'
import { RelayKitTransaction } from '../..'

export class Safe4337Pack extends RelayKitBasePack {
  #bundlerUrl: string
  #paymasterUrl?: string // TODO: Paymasters feature
  #rpcUrl: string

  constructor({ protocolKit, bundlerUrl, paymasterUrl, rpcUrl }: Safe4337Options) {
    super(protocolKit)

    this.#bundlerUrl = bundlerUrl
    this.#paymasterUrl = paymasterUrl
    this.#rpcUrl = rpcUrl
  }

  static async init(initOptions: Safe4337InitOptions): Promise<Safe4337Pack> {
    const { ethersAdapter, options, bundlerUrl, paymasterUrl, rpcUrl } = initOptions
    let protocolKit: Safe

    if ('safeAddress' in options) {
      protocolKit = await Safe.create({
        ethAdapter: ethersAdapter,
        safeAddress: options.safeAddress
      })
    } else {
      if (!options.owners || !options.threshold) {
        throw new Error('Owners and threshold are required to deploy a new Safe')
      }

      protocolKit = await Safe.create({
        ethAdapter: ethersAdapter,
        predictedSafe: {
          safeDeploymentConfig: {
            safeVersion: options.safeVersion || '1.4.1',
            saltNonce: options.saltNonce || undefined
          },
          safeAccountConfig: {
            owners: options.owners,
            threshold: options.threshold,
            to: SAFE_ADDRESSES_MAP.ADD_MODULES_LIB_ADDRESS,
            data: INTERFACES.encodeFunctionData('enableModules', [
              [SAFE_ADDRESSES_MAP.SAFE_4337_MODULE_ADDRESS]
            ]),
            fallbackHandler: SAFE_ADDRESSES_MAP.SAFE_4337_MODULE_ADDRESS,
            paymentToken: ethers.ZeroAddress,
            payment: 0,
            paymentReceiver: ethers.ZeroAddress
          }
        }
      })
    }

    return new Safe4337Pack({
      protocolKit,
      bundlerUrl,
      paymasterUrl,
      rpcUrl
    })
  }

  async getEstimateFee(userOperation: UserOperation): Promise<EstimateUserOperationGas> {
    const gasEstimate = await this.getEip4337BundlerProvider().send(
      'eth_estimateUserOperationGas',
      [
        {
          ...userOperation,
          nonce: ethers.toBeHex(userOperation.nonce),
          callGasLimit: ethers.toBeHex(userOperation.callGasLimit),
          verificationGasLimit: ethers.toBeHex(userOperation.verificationGasLimit),
          preVerificationGas: ethers.toBeHex(userOperation.preVerificationGas),
          maxFeePerGas: ethers.toBeHex(userOperation.maxFeePerGas),
          maxPriorityFeePerGas: ethers.toBeHex(userOperation.maxPriorityFeePerGas)
        },
        SAFE_ADDRESSES_MAP.ENTRY_POINT_ADDRESS
      ]
    )

    return gasEstimate
  }

  encodeMultiSendData(transactions: MetaTransactionData[]) {
    return INTERFACES.encodeFunctionData('multiSend', [
      encodeMultiSendData(
        transactions.map((tx) => ({ ...tx, operation: tx.operation ?? OperationType.Call }))
      )
    ])
  }

  async encodeCallData(params: {
    to: string
    value: string
    data: string
    operation?: OperationType
  }) {
    return INTERFACES.encodeFunctionData('executeUserOp', [
      params.to,
      params.value,
      params.data,
      params.operation || OperationType.Call
    ])
  }

  async createRelayedTransaction({ transactions }: RelayKitTransaction): Promise<EthSafeOperation> {
    const safeAddress = await this.protocolKit.getAddress()
    const nonce = await this.getAccountNonce(safeAddress)

    const isBatch = transactions.length > 1

    const callData = isBatch
      ? await this.encodeCallData({
          to: SAFE_ADDRESSES_MAP.MULTISEND_ADDRESS,
          value: '0',
          data: this.encodeMultiSendData(transactions),
          operation: OperationType.DelegateCall
        })
      : await this.encodeCallData(transactions[0])

    const userOperation: UserOperation = {
      sender: safeAddress,
      nonce: nonce,
      initCode: '0x',
      callData,
      callGasLimit: 1n,
      verificationGasLimit: 1n,
      preVerificationGas: 1n,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      paymasterAndData: '0x', // TODO: Paymasters feature
      signature: '0x'
    }

    const isSafeDeployed = await this.protocolKit.isSafeDeployed()

    if (!isSafeDeployed) {
      userOperation.initCode = await this.protocolKit.getInitCode()
    }

    const gasEstimations = await this.getEstimateFee(userOperation)
    const feeEstimations = await this.estimateFeeData()

    return new EthSafeOperation({
      ...userOperation,
      ...gasEstimations,
      verificationGasLimit: this.addExtraSafetyGas(
        gasEstimations.verificationGasLimit
        // TODO: review this parse
      ) as unknown as bigint,
      maxFeePerGas: feeEstimations.maxFeePerGas,
      maxPriorityFeePerGas: feeEstimations.maxPriorityFeePerGas
    })
  }

  async executeRelayTransaction(safeOperation: EthSafeOperation): Promise<string> {
    const userOperation = safeOperation.toUserOperation()

    return this.sendUserOperation(userOperation)
  }

  getSafeUserOperationHash(safeUserOperation: SafeUserOperation, chainId: bigint) {
    return ethers.TypedDataEncoder.hash(
      {
        chainId,
        verifyingContract: SAFE_ADDRESSES_MAP.SAFE_4337_MODULE_ADDRESS
      },
      EIP712_SAFE_OPERATION_TYPE,
      safeUserOperation
    )
  }

  async signSafeUserOperation(
    safeOperation: EthSafeOperation,
    signingMethod: SigningMethod = SigningMethod.ETH_SIGN_TYPED_DATA_V4
  ): Promise<EthSafeOperation> {
    const owners = await this.protocolKit.getOwners()
    const signerAddress = await this.protocolKit.getEthAdapter().getSignerAddress()
    if (!signerAddress) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }

    const addressIsOwner = owners.some(
      (owner: string) => signerAddress && owner.toLowerCase() === signerAddress.toLowerCase()
    )

    if (!addressIsOwner) {
      throw new Error('UserOperations can only be signed by Safe owners')
    }

    let signature: SafeSignature

    if (
      signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA_V4 ||
      signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA_V3 ||
      signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA
    ) {
      signature = await this.signTypedData(safeOperation.data)
    } else {
      const chainId = await this.protocolKit.getEthAdapter().getChainId()
      const safeOpHash = this.getSafeUserOperationHash(safeOperation.data, chainId)

      signature = await this.protocolKit.signHash(safeOpHash)
    }

    const signedSafeOperation = new EthSafeOperation(safeOperation.toUserOperation())

    signedSafeOperation.signatures.forEach((signature: SafeSignature) => {
      signedSafeOperation.addSignature(signature)
    })

    signedSafeOperation.addSignature(signature)

    return signedSafeOperation
  }

  async signTypedData(safeUserOperation: SafeUserOperation): Promise<SafeSignature> {
    // TODO: This is only EthersAdapter compatible. If I want the ethAdapter.signTypedData to work I need to either:
    // - Add a SafeOp type to the protocol-kit (createSafeOperation, signSafeOperation, etc)
    // - Allow to pass the data types (SafeOp, SafeMessage, SafeTx) to the signTypedData method and refactor the protocol-kit to allow any kind of data signing from outside (Currently only SafeTx and SafeMessage)
    const ethAdapter = this.protocolKit.getEthAdapter() as EthersAdapter
    const signer = ethAdapter.getSigner() as ethers.Signer
    const chainId = await ethAdapter.getChainId()
    const signerAddress = await signer.getAddress()
    const signature = await signer.signTypedData(
      {
        chainId,
        verifyingContract: SAFE_ADDRESSES_MAP.SAFE_4337_MODULE_ADDRESS
      },
      EIP712_SAFE_OPERATION_TYPE,
      {
        ...safeUserOperation,
        nonce: ethers.toBeHex(safeUserOperation.nonce),
        validAfter: ethers.toBeHex(safeUserOperation.validAfter),
        validUntil: ethers.toBeHex(safeUserOperation.validUntil),
        maxFeePerGas: ethers.toBeHex(safeUserOperation.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(safeUserOperation.maxPriorityFeePerGas)
      }
    )
    return new EthSafeSignature(signerAddress, signature)
  }

  getEip4337BundlerProvider(): ethers.JsonRpcProvider {
    const provider = new ethers.JsonRpcProvider(this.#bundlerUrl, undefined, {
      batchMaxCount: 1
    })

    return provider
  }

  getEip1193Provider(): ethers.JsonRpcProvider {
    const provider = new ethers.JsonRpcProvider(this.#rpcUrl, undefined, {
      batchMaxCount: 1
    })

    return provider
  }

  async sendUserOperation(userOpWithSignature: UserOperation): Promise<string> {
    return await this.getEip4337BundlerProvider().send('eth_sendUserOperation', [
      {
        ...userOpWithSignature,
        maxFeePerGas: ethers.toBeHex(userOpWithSignature.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(userOpWithSignature.maxPriorityFeePerGas)
      },
      SAFE_ADDRESSES_MAP.ENTRY_POINT_ADDRESS
    ])
  }

  async getAccountNonce(sender: string, key = BigInt(0)) {
    const provider = new ethers.JsonRpcProvider(this.#rpcUrl)

    const abi = [
      {
        inputs: [
          { name: 'sender', type: 'address' },
          { name: 'key', type: 'uint192' }
        ],
        name: 'getNonce',
        outputs: [{ name: 'nonce', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }
    ]

    const contract = new ethers.Contract(SAFE_ADDRESSES_MAP.ENTRY_POINT_ADDRESS, abi, provider)

    return await contract.getNonce(sender, key)
  }

  async estimateFeeData(): Promise<FeeData> {
    // TODO: review this
    // const feeData = (await this.getEip1193Provider().getFeeData()) as FeeData

    // return feeData
    const { fast } = await this.getEip4337BundlerProvider().send(
      'pimlico_getUserOperationGasPrice',
      []
    )

    return fast as FeeData
  }

  // Increase the gas limit by 50%, otherwise the user op will fail during simulation with "verification more than gas limit" error
  addExtraSafetyGas(gasEstimationValue: bigint) {
    return ethers.toBeHex((BigInt(gasEstimationValue) * 20n) / 10n)
  }
}
