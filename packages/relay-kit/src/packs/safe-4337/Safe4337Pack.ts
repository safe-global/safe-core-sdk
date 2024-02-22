import { ethers } from 'ethers'
import Safe, {
  EthSafeSignature,
  EthersAdapter,
  SigningMethod,
  encodeMultiSendData
} from '@safe-global/protocol-kit'
import { RelayKitTransaction } from '@safe-global/relay-kit/types'
import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import { MetaTransactionData, OperationType, SafeSignature } from '@safe-global/safe-core-sdk-types'

import SafeOperation from './SafeOperation'
import {
  EstimateUserOperationGas,
  FeeData,
  Safe4337InitOptions,
  Safe4337Options,
  SafeUserOperation,
  UserOperation
} from './types'
import {
  EIP712_SAFE_OPERATION_TYPE,
  INTERFACES,
  SAFE_ADDRESSES_MAP,
  RPC_4337_CALLS
} from './constants'

const MINIMUM_SAFE_VERSION = '1.4.1'

/**
 * Safe4337Pack class that extends RelayKitBasePack.
 * This class provides an implementation of the ERC-4337 that enables Safe accounts to wrk with UserOperations.
 * It allows to create, sign and execute transactions using the Safe 4337 Module.
 *
 * @class
 * @property {string} #bundlerUrl - Bundler URL.
 * @property {string} #paymasterUrl - Paymaster URL.
 * @property {string} #rpcUrl - RPC URL.
 * @link https://github.com/safe-global/safe-modules/blob/main/modules/4337/contracts/Safe4337Module.sol
 * @link https://eips.ethereum.org/EIPS/eip-4337
 */
export class Safe4337Pack extends RelayKitBasePack {
  #bundlerUrl: string
  #paymasterUrl?: string // TODO: Paymasters feature
  #rpcUrl: string

  /**
   * Creates an instance of the Safe4337Pack.
   *
   * @param {Safe4337Options} params - The initialization parameters.
   */
  constructor({ protocolKit, bundlerUrl, paymasterUrl, rpcUrl }: Safe4337Options) {
    super(protocolKit)

    this.#bundlerUrl = bundlerUrl
    this.#paymasterUrl = paymasterUrl
    this.#rpcUrl = rpcUrl
  }

  /**
   * Initializes a Safe4337Pack class.
   * This method creates the protocolKit instance based on the input parameters.
   * When the Safe address is provided, it will use the existing Safe.
   * When the Safe address is not provided, it will use the predictedSafe feature with the provided owners and threshold.
   * It will use the correct contract addresses for the fallbackHandler and the module and will add the data to enable the 4337 module.
   *
   * @param {Safe4337InitOptions} initOptions - The initialization parameters.
   * @return {Promise<Safe4337Pack>} The Promise object that will be resolved into an instance of Safe4337Pack.
   */
  static async init(initOptions: Safe4337InitOptions): Promise<Safe4337Pack> {
    const { ethersAdapter, options, bundlerUrl, paymasterUrl, rpcUrl } = initOptions
    let protocolKit: Safe

    // Existing Safe
    if ('safeAddress' in options) {
      protocolKit = await Safe.create({
        ethAdapter: ethersAdapter,
        safeAddress: options.safeAddress
      })
    } else {
      // New Safe will be created based on the provided configuration when bundling a new UserOperation
      if (!options.owners || !options.threshold) {
        throw new Error('Owners and threshold are required to deploy a new Safe')
      }

      protocolKit = await Safe.create({
        ethAdapter: ethersAdapter,
        predictedSafe: {
          safeDeploymentConfig: {
            safeVersion: options.safeVersion || MINIMUM_SAFE_VERSION,
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

  /**
   * Estimates gas for an UserOperation.
   *
   * @param {UserOperation}userOperation - The user operation to estimate.
   * @return {Promise<EstimateUserOperationGas>} The Promise object that will be resolved into the gas estimation.
   */
  async getEstimateFee(userOperation: UserOperation): Promise<EstimateUserOperationGas> {
    const gasEstimate = await this.#getEip4337BundlerProvider().send(
      RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS,
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

  /**
   * Creates a relayed transaction based on the provided parameters.
   *
   * @param {RelayKitTransaction} relayKitTransaction - The transaction object params required to create a relayed transaction.
   * @return {Promise<SafeOperation>} The Promise object will resolve a SafeOperation.
   */
  async createRelayedTransaction({ transactions }: RelayKitTransaction): Promise<SafeOperation> {
    const safeAddress = await this.protocolKit.getAddress()
    const nonce = await this.#getAccountNonce(safeAddress)

    const isBatch = transactions.length > 1

    const callData = isBatch
      ? this.#encodeExecuteUserOpCallData({
          to: SAFE_ADDRESSES_MAP.MULTISEND_ADDRESS,
          value: '0',
          data: this.#encodeMultiSendCallData(transactions),
          operation: OperationType.DelegateCall
        })
      : this.#encodeExecuteUserOpCallData(transactions[0])

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
    const feeEstimations = await this.#getFeeData()

    return new SafeOperation({
      ...userOperation,
      ...gasEstimations,
      verificationGasLimit: this.#addExtraSafetyGas(
        gasEstimations.verificationGasLimit
        // TODO: review this parse
      ) as unknown as bigint,
      maxFeePerGas: feeEstimations.maxFeePerGas,
      maxPriorityFeePerGas: feeEstimations.maxPriorityFeePerGas
    })
  }

  /**
   * Signs a safe operation.
   *
   * @param {SafeOperation} safeOperation - The SafeOperation to sign.
   * @param {SigningMethod} signingMethod - The signing method to use.
   * @return {Promise<SafeOperation>} The Promise object will resolve to the signed SafeOperation.
   */
  async signSafeUserOperation(
    safeOperation: SafeOperation,
    signingMethod: SigningMethod = SigningMethod.ETH_SIGN_TYPED_DATA_V4
  ): Promise<SafeOperation> {
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
      signature = await this.#signTypedData(safeOperation.data)
    } else {
      const chainId = await this.protocolKit.getEthAdapter().getChainId()
      const safeOpHash = this.#getSafeUserOperationHash(safeOperation.data, chainId)

      signature = await this.protocolKit.signHash(safeOpHash)
    }

    const signedSafeOperation = new SafeOperation(safeOperation.toUserOperation())

    signedSafeOperation.signatures.forEach((signature: SafeSignature) => {
      signedSafeOperation.addSignature(signature)
    })

    signedSafeOperation.addSignature(signature)

    return signedSafeOperation
  }

  /**
   * Executes the relay transaction.
   *
   * @param {SafeOperation} safeOperation - The SafeOperation to execute.
   * @return {Promise<string>} The user operation hash.
   */
  async executeRelayTransaction(safeOperation: SafeOperation): Promise<string> {
    const userOperation = safeOperation.toUserOperation()

    return this.sendUserOperation(userOperation)
  }

  /**
   * Gets the safe user operation hash.
   *
   * @param {SafeUserOperation} safeUserOperation - The SafeUserOperation.
   * @param {bigint} chainId - The chain id.
   * @return {string} The hash of the safe operation.
   */
  #getSafeUserOperationHash(safeUserOperation: SafeUserOperation, chainId: bigint): string {
    return ethers.TypedDataEncoder.hash(
      {
        chainId,
        verifyingContract: SAFE_ADDRESSES_MAP.SAFE_4337_MODULE_ADDRESS
      },
      EIP712_SAFE_OPERATION_TYPE,
      safeUserOperation
    )
  }

  /**
   * Send the UserOperation to the bundler.
   *
   * @param {UserOperation} userOpWithSignature - The signed UserOperation to send to the bundler.
   * @return {Promise<string>} The hash.
   */
  async sendUserOperation(userOpWithSignature: UserOperation): Promise<string> {
    return await this.#getEip4337BundlerProvider().send(RPC_4337_CALLS.SEND_USER_OPERATION, [
      {
        ...userOpWithSignature,
        maxFeePerGas: ethers.toBeHex(userOpWithSignature.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(userOpWithSignature.maxPriorityFeePerGas)
      },
      SAFE_ADDRESSES_MAP.ENTRY_POINT_ADDRESS
    ])
  }

  /**
   * Signs typed data.
   *  This is currently only EthersAdapter compatible (Reflected in the init() props). If I want to make it compatible with any EthAdapter I need to either:
   *   - Add a SafeOp type to the protocol-kit (createSafeOperation, signSafeOperation, etc)
   *   - Allow to pass the data types (SafeOp, SafeMessage, SafeTx) to the signTypedData method and refactor the protocol-kit to allow any kind of data signing from outside (Currently only SafeTx and SafeMessage)
   *
   * @param {SafeUserOperation} safeUserOperation - Safe user operation to sign.
   * @return {Promise<SafeSignature>} The SafeSignature object containing the data and the signatures.
   */
  async #signTypedData(safeUserOperation: SafeUserOperation): Promise<SafeSignature> {
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

  /**
   * Gets the EIP-4337 bundler provider.
   *
   * @return {Provider} The EIP-4337 bundler provider.
   */
  #getEip4337BundlerProvider(): ethers.JsonRpcProvider {
    const provider = new ethers.JsonRpcProvider(this.#bundlerUrl, undefined, {
      batchMaxCount: 1
    })

    return provider
  }

  /**
   * Gets the EIP-1193 provider from the bundler url.
   *
   * @return {Provider} The EIP-1193 provider.
   */
  #getEip1193Provider(): ethers.JsonRpcProvider {
    const provider = new ethers.JsonRpcProvider(this.#rpcUrl, undefined, {
      batchMaxCount: 1
    })

    return provider
  }

  /**
   * Gets account nonce from the bundler.
   *
   * @param {string} sender - Account address for which the nonce is to be fetched.
   * @returns {Promise<string>} The Promise object will resolve to the account nonce.
   */
  async #getAccountNonce(sender: string): Promise<string> {
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

    const newNonce = await contract.getNonce(sender, BigInt(0))

    return newNonce.toString()
  }

  /**
   * Get the current gas fees for transactions
   *
   * @returns {Promise<FeeData>} The estimations for the current gas fees.
   */
  async #getFeeData(): Promise<FeeData> {
    // TODO: review this
    // const feeData = (await this.getEip1193Provider().getFeeData()) as FeeData

    const { fast } = await this.#getEip4337BundlerProvider().send(
      'pimlico_getUserOperationGasPrice',
      []
    )

    return fast as FeeData
  }

  /**
   * Adds an extra amount of gas to the estimations for safety.
   * TODO: Review this, Currently this increase the gas limit by 50%, otherwise the user op will fail during
   * simulation with "verification more than gas limit" error
   *
   * @param {UserOperation} gasEstimationValue - The UserOperation to which extra gas is to be added.
   * @return {string} The adjusted gal limit.
   */
  #addExtraSafetyGas(gasEstimationValue: bigint): string {
    return ethers.toBeHex((BigInt(gasEstimationValue) * 20n) / 10n)
  }

  /**
   * Encode the UserOperation execution from a transaction.
   *
   * @param {MetaTransactionData} transaction - The transaction data to encode.
   * @return {string} The encoded call data string.
   */
  #encodeExecuteUserOpCallData(transaction: MetaTransactionData): string {
    return INTERFACES.encodeFunctionData('executeUserOp', [
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation || OperationType.Call
    ])
  }

  /**
   * Encodes multi-send data from transactions batch.
   *
   * @param {MetaTransactionData[]} transactions - an array of transaction to to be encoded.
   * @return {string} The encoded data string.
   */
  #encodeMultiSendCallData(transactions: MetaTransactionData[]): string {
    return INTERFACES.encodeFunctionData('multiSend', [
      encodeMultiSendData(
        transactions.map((tx) => ({ ...tx, operation: tx.operation ?? OperationType.Call }))
      )
    ])
  }
}
