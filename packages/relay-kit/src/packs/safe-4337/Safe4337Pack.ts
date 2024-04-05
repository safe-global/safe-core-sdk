import { ethers } from 'ethers'
import semverSatisfies from 'semver/functions/satisfies'
import Safe, {
  EthSafeSignature,
  EthersAdapter,
  SigningMethod,
  encodeMultiSendData,
  getMultiSendContract
} from '@safe-global/protocol-kit'
import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import { MetaTransactionData, OperationType, SafeSignature } from '@safe-global/safe-core-sdk-types'
import {
  getAddModulesLibDeployment,
  getSafe4337ModuleDeployment
} from '@safe-global/safe-modules-deployments'

import SafeOperation from './SafeOperation'
import {
  EstimateFeeProps,
  Safe4337CreateTransactionProps,
  Safe4337ExecutableProps,
  Safe4337InitOptions,
  Safe4337Options,
  SafeUserOperation,
  UserOperation,
  UserOperationReceipt,
  UserOperationWithPayload,
  PaymasterOptions
} from './types'
import {
  DEFAULT_SAFE_VERSION,
  DEFAULT_SAFE_MODULES_VERSION,
  EIP712_SAFE_OPERATION_TYPE,
  INTERFACES,
  RPC_4337_CALLS
} from './constants'
import { getEip1193Provider, getEip4337BundlerProvider, userOperationToHexValues } from './utils'
import { PimlicoFeeEstimator } from './estimators/PimlicoFeeEstimator'

const MAX_ERC20_AMOUNT_TO_APPROVE =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn

/**
 * Safe4337Pack class that extends RelayKitBasePack.
 * This class provides an implementation of the ERC-4337 that enables Safe accounts to wrk with UserOperations.
 * It allows to create, sign and execute transactions using the Safe 4337 Module.
 *
 * @class
 * @link https://github.com/safe-global/safe-modules/blob/main/modules/4337/contracts/Safe4337Module.sol
 * @link https://eips.ethereum.org/EIPS/eip-4337
 */
export class Safe4337Pack extends RelayKitBasePack<{
  EstimateFeeProps: EstimateFeeProps
  EstimateFeeResult: SafeOperation
  CreateTransactionProps: Safe4337CreateTransactionProps
  CreateTransactionResult: SafeOperation
  ExecuteTransactionProps: Safe4337ExecutableProps
  ExecuteTransactionResult: string
}> {
  #BUNDLER_URL: string

  #ENTRYPOINT_ADDRESS: string
  #SAFE_4337_MODULE_ADDRESS: string = '0x'

  #bundlerClient: ethers.JsonRpcProvider
  #publicClient: ethers.JsonRpcProvider

  #paymasterOptions?: PaymasterOptions

  /**
   * Creates an instance of the Safe4337Pack.
   *
   * @param {Safe4337Options} options - The initialization parameters.
   */
  constructor({
    protocolKit,
    bundlerClient,
    publicClient,
    bundlerUrl,
    paymasterOptions,
    entryPointAddress,
    safe4337ModuleAddress
  }: Safe4337Options) {
    super(protocolKit)

    this.#BUNDLER_URL = bundlerUrl

    this.#bundlerClient = bundlerClient
    this.#publicClient = publicClient

    this.#paymasterOptions = paymasterOptions

    this.#ENTRYPOINT_ADDRESS = entryPointAddress
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
    const { ethersAdapter, options, bundlerUrl, rpcUrl, customContracts, paymasterOptions } =
      initOptions
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

      const safeVersion = await protocolKit.getContractVersion()
      const isSafeVersion4337Compatible = semverSatisfies(safeVersion, '>=1.4.1')

      if (!isSafeVersion4337Compatible) {
        throw new Error(
          `Incompatibility detected: The current Safe Account version (${safeVersion}) is not supported. EIP-4337 requires the Safe to use at least v1.4.1.`
        )
      }

      const safeModules = (await protocolKit.getModules()) as string[]
      const is4337ModulePresent = safeModules.some((module) => module === safe4337ModuleAddress)

      if (!is4337ModulePresent) {
        throw new Error(
          `Incompatibility detected: The EIP-4337 module is not enabled in the provided Safe Account. Enable this module (address: ${safe4337ModuleAddress}) to add compatibility.`
        )
      }

      const safeFallbackhandler = await protocolKit.getFallbackHandler()
      const is4337FallbackhandlerPresent = safeFallbackhandler === safe4337ModuleAddress

      if (!is4337FallbackhandlerPresent) {
        throw new Error(
          `Incompatibility detected: The EIP-4337 fallbackhandler is not attached to the Safe Account. Attach this fallbackhandler (address: ${safe4337ModuleAddress}) to ensure compatibility.`
        )
      }
    } else {
      // New Safe will be created based on the provided configuration when bundling a new UserOperation
      if (!options.owners || !options.threshold) {
        throw new Error('Owners and threshold are required to deploy a new Safe')
      }

      let deploymentTo = addModulesLibAddress
      let deploymentData = INTERFACES.encodeFunctionData('enableModules', [[safe4337ModuleAddress]])

      const { isSponsored, paymasterTokenAddress } = paymasterOptions || {}

      const isApproveTransactionRequired =
        !!paymasterOptions && !isSponsored && !!paymasterTokenAddress

      if (isApproveTransactionRequired) {
        const { paymasterAddress, amountToApprove = MAX_ERC20_AMOUNT_TO_APPROVE } = paymasterOptions

        const enable4337ModulesTransaction = {
          to: addModulesLibAddress,
          value: '0',
          data: INTERFACES.encodeFunctionData('enableModules', [[safe4337ModuleAddress]]),
          operation: OperationType.DelegateCall // DelegateCall required for enabling the 4337 module
        }

        const approveToPaymasterTransaction = {
          to: paymasterTokenAddress,
          data: INTERFACES.encodeFunctionData('approve', [paymasterAddress, amountToApprove]),
          value: '0',
          operation: OperationType.Call // Call for approve
        }

        const setupBatch = [enable4337ModulesTransaction, approveToPaymasterTransaction]

        const batchData = INTERFACES.encodeFunctionData('multiSend', [
          encodeMultiSendData(setupBatch)
        ])

        const multiSendContract = await getMultiSendContract({
          ethAdapter: ethersAdapter,
          safeVersion: options.safeVersion || DEFAULT_SAFE_VERSION
        })

        deploymentTo = await multiSendContract.getAddress()
        deploymentData = batchData
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
            to: deploymentTo,
            data: deploymentData,
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
      paymasterOptions,
      bundlerUrl,
      entryPointAddress: customContracts?.entryPointAddress || supportedEntryPoints[0],
      safe4337ModuleAddress
    })
  }

  /**
   * Estimates gas for the SafeOperation.
   *
   * @param {EstimateFeeProps} props - The parameters for the gas estimation.
   * @param {SafeOperation} props.safeOperation - The SafeOperation to estimate the gas.
   * @param {IFeeEstimator} props.feeEstimator - The function to estimate the gas.
   * @return {Promise<SafeOperation>} The Promise object that will be resolved into the gas estimation.
   */

  async getEstimateFee({
    safeOperation,
    feeEstimator = new PimlicoFeeEstimator()
  }: EstimateFeeProps): Promise<SafeOperation> {
    const userOperation = safeOperation.toUserOperation()

    const setupEstimationData = await feeEstimator?.setupEstimation?.({
      bundlerUrl: this.#BUNDLER_URL,
      entryPoint: this.#ENTRYPOINT_ADDRESS,
      userOperation: safeOperation.toUserOperation()
    })

    if (setupEstimationData) {
      safeOperation.addEstimations(setupEstimationData)
    }

    const estimateUserOperationGas = await this.#bundlerClient.send(
      RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS,
      [userOperationToHexValues(userOperation), this.#ENTRYPOINT_ADDRESS]
    )

    if (estimateUserOperationGas) {
      safeOperation.addEstimations({
        preVerificationGas: BigInt(estimateUserOperationGas.preVerificationGas),
        verificationGasLimit: BigInt(estimateUserOperationGas.verificationGasLimit),
        callGasLimit: BigInt(estimateUserOperationGas.callGasLimit)
      })
    }

    const adjustEstimationData = await feeEstimator?.adjustEstimation?.({
      bundlerUrl: this.#BUNDLER_URL,
      entryPoint: this.#ENTRYPOINT_ADDRESS,
      userOperation: safeOperation.toUserOperation()
    })

    if (adjustEstimationData) {
      safeOperation.addEstimations(adjustEstimationData)
    }

    if (this.#paymasterOptions?.isSponsored) {
      if (!this.#paymasterOptions.paymasterUrl) {
        throw new Error('No paymaster url provided for a sponsored transaction')
      }

      const paymasterEstimation = await feeEstimator?.getPaymasterEstimation?.({
        userOperation: safeOperation.toUserOperation(),
        paymasterUrl: this.#paymasterOptions.paymasterUrl,
        entryPoint: this.#ENTRYPOINT_ADDRESS,
        sponsorshipPolicyId: this.#paymasterOptions.sponsorshipPolicyId
      })

      safeOperation.data.paymasterAndData =
        paymasterEstimation?.paymasterAndData || safeOperation.data.paymasterAndData

      if (paymasterEstimation) {
        safeOperation.addEstimations(paymasterEstimation)
      }
    }

    return safeOperation
  }

  /**
   * Creates a relayed transaction based on the provided parameters.
   *
   * @param {MetaTransactionData[]} transactions - The transactions to batch in a SafeOperation.
   * @param options - Optional configuration options for the transaction creation.
   * @return {Promise<SafeOperation>} The Promise object will resolve a SafeOperation.
   */
  async createTransaction({
    transactions,
    options = {}
  }: Safe4337CreateTransactionProps): Promise<SafeOperation> {
    const safeAddress = await this.protocolKit.getAddress()
    const nonce = await this.#getAccountNonce(safeAddress)

    const { amountToApprove, validUntil, validAfter, feeEstimator } = options

    if (amountToApprove) {
      if (!this.#paymasterOptions || !this.#paymasterOptions.paymasterTokenAddress) {
        throw new Error('Paymaster must be initialized')
      }

      const paymasterAddress = this.#paymasterOptions.paymasterAddress
      const paymasterTokenAddress = this.#paymasterOptions.paymasterTokenAddress

      const approveToPaymasterTransaction = {
        to: paymasterTokenAddress,
        data: INTERFACES.encodeFunctionData('approve', [paymasterAddress, amountToApprove]),
        value: '0',
        operation: OperationType.Call // Call for approve
      }

      transactions.push(approveToPaymasterTransaction)
    }

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

    const paymasterAndData = this.#paymasterOptions?.paymasterAddress || '0x'

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
      paymasterAndData,
      signature: '0x'
    }

    const isSafeDeployed = await this.protocolKit.isSafeDeployed()

    if (!isSafeDeployed) {
      userOperation.initCode = await this.protocolKit.getInitCode()
    }

    const safeOperation = new SafeOperation(userOperation, {
      entryPoint: this.#ENTRYPOINT_ADDRESS,
      validUntil,
      validAfter
    })

    return await this.getEstimateFee({
      safeOperation,
      feeEstimator
    })
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

    const signedSafeOperation = new SafeOperation(safeOperation.toUserOperation(), {
      entryPoint: this.#ENTRYPOINT_ADDRESS,
      validUntil: safeOperation.data.validUntil,
      validAfter: safeOperation.data.validAfter
    })

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
  async executeTransaction({
    executable: safeOperation
  }: Safe4337ExecutableProps): Promise<string> {
    const userOperation = safeOperation.toUserOperation()

    return this.#sendUserOperation(userOperation)
  }

  /**
   * Return a UserOperation based on a hash (userOpHash) returned by eth_sendUserOperation
   *
   * @param {string} userOpHash - The hash of the user operation to fetch. Returned from the #sendUserOperation method
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
   * @param {string} userOpHash - The hash of the user operation to fetch. Returned from the #sendUserOperation method
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
  async #sendUserOperation(userOpWithSignature: UserOperation): Promise<string> {
    return await this.#bundlerClient.send(RPC_4337_CALLS.SEND_USER_OPERATION, [
      userOperationToHexValues(userOpWithSignature),
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
}
