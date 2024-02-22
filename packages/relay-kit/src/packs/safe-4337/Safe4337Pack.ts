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
  UserOperation,
  UserOperationReceipt,
  UserOperationWithPayload
} from './types'
import {
  EIP712_SAFE_OPERATION_TYPE,
  INTERFACES,
  SAFE_ADDRESSES_MAP,
  RPC_4337_CALLS
} from './constants'
import { getEip1193Provider, getEip4337BundlerProvider } from './utils'

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
  #bundlerClient: ethers.JsonRpcProvider
  #publicClient: ethers.JsonRpcProvider
  #entryPoint: string

  /**
   * Creates an instance of the Safe4337Pack.
   *
   * @param {Safe4337Options} params - The initialization parameters.
   */
  constructor({ protocolKit, bundlerClient, publicClient, entryPoint }: Safe4337Options) {
    super(protocolKit)

    this.#bundlerClient = bundlerClient
    this.#publicClient = publicClient
    this.#entryPoint = entryPoint
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
    const { ethersAdapter, options, bundlerUrl, rpcUrl, entryPoint } = initOptions
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

    const bundlerClient = getEip4337BundlerProvider(bundlerUrl)
    const publicClient = getEip1193Provider(rpcUrl)
    let supportedEntryPoints

    if (!entryPoint) {
      supportedEntryPoints = await bundlerClient.send(RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS, [])

      if (!supportedEntryPoints.length) {
        throw new Error('No entrypoint provided or available through the bundler')
      }
    }

    return new Safe4337Pack({
      protocolKit,
      bundlerClient,
      publicClient,
      entryPoint: entryPoint || supportedEntryPoints[0]
    })
  }

  /**
   * Estimates gas for an UserOperation.
   *
   * @param {UserOperation}userOperation - The user operation to estimate.
   * @return {Promise<EstimateUserOperationGas>} The Promise object that will be resolved into the gas estimation.
   */
  async getEstimateFee(userOperation: UserOperation): Promise<EstimateUserOperationGas> {
    const gasEstimate = await this.#bundlerClient.send(RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS, [
      {
        ...userOperation,
        nonce: ethers.toBeHex(userOperation.nonce),
        callGasLimit: ethers.toBeHex(userOperation.callGasLimit),
        verificationGasLimit: ethers.toBeHex(userOperation.verificationGasLimit),
        preVerificationGas: ethers.toBeHex(userOperation.preVerificationGas),
        maxFeePerGas: ethers.toBeHex(userOperation.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(userOperation.maxPriorityFeePerGas)
      },
      this.#entryPoint
    ])

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

    return new SafeOperation(
      {
        ...userOperation,
        ...gasEstimations,
        verificationGasLimit: this.#addExtraSafetyGas(
          gasEstimations.verificationGasLimit
          // TODO: review this parse
        ) as unknown as bigint,
        maxFeePerGas: feeEstimations.maxFeePerGas,
        maxPriorityFeePerGas: feeEstimations.maxPriorityFeePerGas
      },
      this.#entryPoint
    )
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

    const signedSafeOperation = new SafeOperation(safeOperation.toUserOperation(), this.#entryPoint)

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
   * Return a UserOperation based on a hash (userOpHash) returned by eth_sendUserOperation
   *
   * @param {string} userOpHash - The hash of the user operation to fetch. Returned from the sendUserOperation method
   * @returns {UserOperation} - null in case the UserOperation is not yet included in a block, or a full UserOperation, with the addition of entryPoint, blockNumber, blockHash and transactionHash
   */
  async getUserOperationByHash(userOpHash: string): Promise<UserOperationWithPayload> {
    const userOperation = await this.#bundlerClient.send(
      RPC_4337_CALLS.GET_USER_OPERATION_BY_HASH,
      [userOpHash]
    )

    return userOperation
  }

  /**
   * Return a UserOperation receipt based on a hash (userOpHash) returned by eth_sendUserOperation
   *
   * @param {string} userOpHash - The hash of the user operation to fetch. Returned from the sendUserOperation method
   * @returns {UserOperationReceipt} - null in case the UserOperation is not yet included in a block, or UserOperationReceipt object
   */
  async getUserOperationReceipt(userOpHash: string): Promise<UserOperationReceipt | null> {
    const userOperationReceipt = await this.#bundlerClient.send(
      RPC_4337_CALLS.GET_USER_OPERATION_RECEIPT,
      [userOpHash]
    )

    return userOperationReceipt
  }

  /**
   * Returns an array of the entryPoint addresses supported by the client.
   * The first element of the array SHOULD be the entryPoint addressed preferred by the client.
   *
   * @returns {string[]} - The supported entry points.
   */
  async getSupportedEntryPoints(): Promise<string[]> {
    const supportedEntryPoints = await this.#bundlerClient.send(
      RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS,
      []
    )

    return supportedEntryPoints
  }

  /**
   * Returns EIP-155 Chain ID.
   *
   * @returns {string} - The chain id.
   */
  async getChainId(): Promise<string> {
    const chainId = await this.#bundlerClient.send(RPC_4337_CALLS.CHAIN_ID, [])

    return chainId
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
    return await this.#bundlerClient.send(RPC_4337_CALLS.SEND_USER_OPERATION, [
      {
        ...userOpWithSignature,
        maxFeePerGas: ethers.toBeHex(userOpWithSignature.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(userOpWithSignature.maxPriorityFeePerGas)
      },
      this.#entryPoint
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
   * Gets account nonce from the bundler.
   *
   * @param {string} sender - Account address for which the nonce is to be fetched.
   * @returns {Promise<string>} The Promise object will resolve to the account nonce.
   */
  async #getAccountNonce(sender: string): Promise<string> {
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

    const contract = new ethers.Contract(this.#entryPoint || '0x', abi, this.#publicClient)

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

    const { fast } = await this.#bundlerClient.send('pimlico_getUserOperationGasPrice', [])

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
