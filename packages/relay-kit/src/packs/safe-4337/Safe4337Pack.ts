import { ethers } from 'ethers'
import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import { Safe4337Options, SafeOperation, SafeUserOperation } from './types'
import { SafeSignature, SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { EthSafeSignature, EthersAdapter } from 'packages/protocol-kit/dist/src'
import EthSafeOperation from './EthSafeOperation'
import { SigningMethod, SigningMethodType } from 'packages/protocol-kit/dist/src/types'
import { EIP712_SAFE_OPERATION_TYPE, SAFE_ADDRESSES_MAP } from './constants'

export class Safe4337Pack extends RelayKitBasePack {
  #bundlerUrl: string
  #paymasterUrl: string
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

  async createRelayedTransaction(): Promise<SafeTransaction> {
    throw new Error('Method not implemented')
  }

  async executeRelayTransaction(): Promise<unknown> {
    throw new Error('Method not implemented')
  }

  createSafeUserOperation(safeUserOperation: SafeUserOperation): SafeOperation {
    return new EthSafeOperation(safeUserOperation)
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
    signingMethod: SigningMethodType = SigningMethod.ETH_SIGN_TYPED_DATA_V4
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

    const signedSafeOperation = this.createSafeUserOperation(safeOperation.data)

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

  async sendUserOperation(userOpWithSignature: SafeOperation, entryPoint: string): Promise<string> {
    return await this.getEip4337BundlerProvider().send('eth_sendUserOperation', [
      userOpWithSignature,
      entryPoint
    ])
  }
}
