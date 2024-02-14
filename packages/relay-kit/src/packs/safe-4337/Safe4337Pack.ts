import { ethers } from 'ethers'
import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import {
  EstimateUserOperationGas,
  Safe4337Options,
  SafeUserOperation,
  UserOperation
} from './types'
import { SafeSignature } from '@safe-global/safe-core-sdk-types'
import { EthSafeSignature, EthersAdapter, SigningMethod } from '@safe-global/protocol-kit'
import EthSafeOperation from './EthSafeOperation'
import { EIP712_SAFE_OPERATION_TYPE, SAFE_ADDRESSES_MAP } from './constants'
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

  async getEstimateFee(): Promise<string> {
    throw new Error('Method not implemented.')
  }

  async encodeCallData(params: { to: string; value: bigint; data: string }) {
    const functionAbi =
      'function executeUserOp(address to, uint256 value, bytes data, uint8 operation)'

    const iface = new ethers.Interface([functionAbi])

    return iface.encodeFunctionData('executeUserOp', [params.to, params.value, params.data, 0])
  }

  async createRelayedTransaction({ transactions }: RelayKitTransaction): Promise<EthSafeOperation> {
    const safeAddress = await this.protocolKit.getAddress()
    const nonce = await this.getAccountNonce(safeAddress)
    const batch = await this.protocolKit.createTransactionBatch(transactions)
    console.log('batch', batch)
    const callData = await this.encodeCallData({
      to: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526', //TODO: This should be the multisend address
      value: 0n,
      data: batch.data as string
    })
    console.log('callData', callData)
    const userOperation: UserOperation = {
      sender: safeAddress,
      nonce: nonce,
      initCode: '0x', // TODO: conterfactual deploment feature
      callData,
      callGasLimit: 1n,
      verificationGasLimit: 1n,
      preVerificationGas: 1n,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      paymasterAndData: '0x', // TODO: Paymasters feature
      signature: '0x'
    }
    console.log('userOperation', userOperation)
    const gasEstimations = await this.estimateUserOperation(userOperation)
    console.log('gasEstimations', gasEstimations)
    return new EthSafeOperation({
      ...userOperation,
      ...gasEstimations
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
    const signer = ethAdapter.getSigner() as any

    const chainId = await ethAdapter.getChainId()
    const signerAddress = await signer.getAddress()
    const signature = await signer.signTypedData({
      domain: {
        chainId,
        verifyingContract: SAFE_ADDRESSES_MAP.SAFE_4337_MODULE_ADDRESS
      },
      types: EIP712_SAFE_OPERATION_TYPE,
      primaryType: 'SafeOp',
      message: {
        ...safeUserOperation
      }
    })
    return new EthSafeSignature(signerAddress, signature)
  }

  getEip4337BundlerProvider(): ethers.JsonRpcProvider {
    const provider = new ethers.JsonRpcProvider(this.#bundlerUrl, undefined, {
      batchMaxCount: 1
    })

    return provider
  }

  async sendUserOperation(userOpWithSignature: UserOperation): Promise<string> {
    return await this.getEip4337BundlerProvider().send('eth_sendUserOperation', [
      userOpWithSignature,
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

  async estimateUserOperation(userOperation: UserOperation): Promise<EstimateUserOperationGas> {
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
}
