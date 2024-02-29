import { ethers } from 'ethers'
import Safe, {
  EthSafeSignature,
  EthersAdapter,
  SigningMethod,
  encodeMultiSendData
} from '@safe-global/protocol-kit'
import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import { MetaTransactionData, OperationType, SafeSignature } from '@safe-global/safe-core-sdk-types'
import {
  getAddModulesLibDeployment,
  getSafe4337ModuleDeployment
} from '@safe-global/safe-modules-deployments'

import SafeOperation from './SafeOperation'
import {
  EstimateFeeOptions,
  Safe4337CreateTransactionOptions,
  Safe4337InitOptions,
  Safe4337Options,
  SafeUserOperation,
  UserOperation,
  UserOperationReceipt,
  UserOperationWithPayload
} from './types'
import { EIP712_SAFE_OPERATION_TYPE, INTERFACES, RPC_4337_CALLS } from './constants'
import { getEip1193Provider, getEip4337BundlerProvider } from './utils'

const DEFAULT_SAFE_VERSION = '1.4.1'
const DEFAULT_SAFE_MODULES_VERSION = '0.2.0'

/**
 * Safe4337Pack class that extends RelayKitBasePack.
 * This class provides an implementation of the ERC-4337 that enables Safe accounts to wrk with UserOperations.
 * It allows to create, sign and execute transactions using the Safe 4337 Module.
 *
 * @class
 * @link https://github.com/safe-global/safe-modules/blob/main/modules/4337/contracts/Safe4337Module.sol
 * @link https://eips.ethereum.org/EIPS/eip-4337
 */
export class Safe4337Pack extends RelayKitBasePack<
  EstimateFeeOptions,
  SafeOperation,
  Safe4337CreateTransactionOptions,
  SafeOperation,
  undefined,
  string
> {
  #BUNDLER_URL: string
  #RPC_URL: string

  #ENTRYPOINT_ADDRESS: string
  #ADD_MODULES_LIB_ADDRESS: string = '0x'
  #SAFE_4337_MODULE_ADDRESS: string = '0x'

  #bundlerClient: ethers.JsonRpcProvider
  #publicClient: ethers.JsonRpcProvider

  /**
   * Creates an instance of the Safe4337Pack.
   *
   * @param {Safe4337Options} params - The initialization parameters.
   */
  constructor({
    protocolKit,
    bundlerClient,
    publicClient,
    bundlerUrl,
    rpcUrl,
    entryPointAddress,
    addModulesLibAddress,
    safe4337ModuleAddress
  }: Safe4337Options) {
    super(protocolKit)

    this.#BUNDLER_URL = bundlerUrl
    this.#RPC_URL = rpcUrl

    this.#bundlerClient = bundlerClient
    this.#publicClient = publicClient

    this.#ENTRYPOINT_ADDRESS = entryPointAddress
    this.#ADD_MODULES_LIB_ADDRESS = addModulesLibAddress
    this.#SAFE_4337_MODULE_ADDRESS = safe4337ModuleAddress
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
    const { ethersAdapter, options, bundlerUrl, rpcUrl, customContracts } = initOptions
    let protocolKit: Safe
    const bundlerClient = getEip4337BundlerProvider(bundlerUrl)
    const publicClient = getEip1193Provider(rpcUrl)
    const chainId = await bundlerClient.send(RPC_4337_CALLS.CHAIN_ID, [])

    let addModulesLibAddress = customContracts?.addModulesLibAddress
    const network = parseInt(chainId, 16).toString()

    if (!addModulesLibAddress) {
      const addModulesDeployment = getAddModulesLibDeployment({
        released: true,
        version: initOptions.safeModulesVersion || DEFAULT_SAFE_MODULES_VERSION,
        network
      })
      addModulesLibAddress = addModulesDeployment?.networkAddresses[network]
    }

    let safe4337ModuleAddress = customContracts?.safe4337ModuleAddress
    if (!safe4337ModuleAddress) {
      const safe4337ModuleDeployment = getSafe4337ModuleDeployment({
        released: true,
        version: initOptions.safeModulesVersion || DEFAULT_SAFE_MODULES_VERSION,
        network
      })
      safe4337ModuleAddress = safe4337ModuleDeployment?.networkAddresses[network]
    }

    if (!addModulesLibAddress || !safe4337ModuleAddress) {
      throw new Error(
        `Safe4337Module and/or AddModulesLib not available for chain ${network} and modules version ${DEFAULT_SAFE_MODULES_VERSION}`
      )
    }

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
            safeVersion: options.safeVersion || DEFAULT_SAFE_VERSION,
            saltNonce: options.saltNonce || undefined
          },
          safeAccountConfig: {
            owners: options.owners,
            threshold: options.threshold,
            to: addModulesLibAddress,
            data: INTERFACES.encodeFunctionData('enableModules', [[safe4337ModuleAddress]]),
            fallbackHandler: safe4337ModuleAddress,
            paymentToken: ethers.ZeroAddress,
            payment: 0,
            paymentReceiver: ethers.ZeroAddress
          }
        }
      })
    }

    let supportedEntryPoints

    if (!customContracts?.entryPointAddress) {
      supportedEntryPoints = await bundlerClient.send(RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS, [])

      if (!supportedEntryPoints.length) {
        throw new Error('No entrypoint provided or available through the bundler')
      }
    }

    return new Safe4337Pack({
      protocolKit,
      bundlerClient,
      publicClient,
      bundlerUrl,
      rpcUrl,
      entryPointAddress: customContracts?.entryPointAddress || supportedEntryPoints[0],
      addModulesLibAddress,
      safe4337ModuleAddress
    })
  }

  /**
   * Estimates gas for the SafeOperation.
   *
   * @param {EstimateFeeOptions{SafeOperation}} safeOperation - The SafeOperation to estimate the gas.
   * @param {EstimateFeeOptions{EstimateFeeFn}} estimateFeeFn - The function to estimate the gas.
   * @return {Promise<SafeOperation>} The Promise object that will be resolved into the gas estimation.
   */
  async getEstimateFee({
    safeOperation,
    prepareGasEstimation,
    adjustGasEstimation
  }: EstimateFeeOptions): Promise<SafeOperation> {
    const prepareGasEstimationData = await prepareGasEstimation?.({
      bundlerUrl: this.#BUNDLER_URL,
      entryPoint: this.#ENTRYPOINT_ADDRESS,
      userOperation: safeOperation.toUserOperation()
    })

    if (prepareGasEstimationData) {
      safeOperation.addEstimations(prepareGasEstimationData)
    }

    const userOperation = safeOperation.toUserOperation()

    const estimateUserOperationGas = await this.#bundlerClient.send(
      RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS,
      [this.#userOperationToHexValues(userOperation), this.#ENTRYPOINT_ADDRESS]
    )

    if (estimateUserOperationGas) {
      safeOperation.addEstimations({
        preVerificationGas: BigInt(estimateUserOperationGas.preVerificationGas),
        verificationGasLimit: BigInt(estimateUserOperationGas.verificationGasLimit),
        callGasLimit: BigInt(estimateUserOperationGas.callGasLimit)
      })
    }

    const adjustGasEstimationData = await adjustGasEstimation?.({
      bundlerUrl: this.#BUNDLER_URL,
      entryPoint: this.#ENTRYPOINT_ADDRESS,
      userOperation: safeOperation.toUserOperation()
    })

    if (adjustGasEstimationData) {
      safeOperation.addEstimations(adjustGasEstimationData)
    }

    return safeOperation
  }

  /**
   * Creates a relayed transaction based on the provided parameters.
   *
   * @param {MetaTransactionData[]} transactions - The transactions to batch in a SafeOperation.
   * @return {Promise<SafeOperation>} The Promise object will resolve a SafeOperation.
   */
  async createTransaction({
    transactions
  }: Safe4337CreateTransactionOptions): Promise<SafeOperation> {
    const safeAddress = await this.protocolKit.getAddress()
    const nonce = await this.#getAccountNonce(safeAddress)

    const isBatch = transactions.length > 1
    const multiSendAddress = await this.protocolKit.getMultiSendAddress()

    const callData = isBatch
      ? this.#encodeExecuteUserOpCallData({
          to: multiSendAddress,
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

    return new SafeOperation(userOperation, this.#ENTRYPOINT_ADDRESS)
  }

  /**
   * Signs a safe operation.
   *
   * @param {SafeOperation} safeOperation - The SafeOperation to sign.
   * @param {SigningMethod} signingMethod - The signing method to use.
   * @return {Promise<SafeOperation>} The Promise object will resolve to the signed SafeOperation.
   */
  async signSafeOperation(
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

    const signedSafeOperation = new SafeOperation(
      safeOperation.toUserOperation(),
      this.#ENTRYPOINT_ADDRESS
    )

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
  async executeTransaction(safeOperation: SafeOperation): Promise<string> {
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
        verifyingContract: this.#SAFE_4337_MODULE_ADDRESS
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
      this.#userOperationToHexValues(userOpWithSignature),
      this.#ENTRYPOINT_ADDRESS
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
        verifyingContract: this.#SAFE_4337_MODULE_ADDRESS
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

    const contract = new ethers.Contract(this.#ENTRYPOINT_ADDRESS || '0x', abi, this.#publicClient)

    const newNonce = await contract.getNonce(sender, BigInt(0))

    return newNonce.toString()
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

  #userOperationToHexValues(userOperation: UserOperation) {
    const userOperationWithHexValues = {
      ...userOperation,
      nonce: ethers.toBeHex(userOperation.nonce),
      callGasLimit: ethers.toBeHex(userOperation.callGasLimit),
      verificationGasLimit: ethers.toBeHex(userOperation.verificationGasLimit),
      preVerificationGas: ethers.toBeHex(userOperation.preVerificationGas),
      maxFeePerGas: ethers.toBeHex(userOperation.maxFeePerGas),
      maxPriorityFeePerGas: ethers.toBeHex(userOperation.maxPriorityFeePerGas)
    }

    return userOperationWithHexValues
  }
}
