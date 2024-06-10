import { ethers } from 'ethers'
import semverSatisfies from 'semver/functions/satisfies'
import Safe, {
  EthSafeSignature,
  SafeProvider,
  SigningMethod,
  encodeMultiSendData,
  getMultiSendContract
} from '@safe-global/protocol-kit'
import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import {
  MetaTransactionData,
  OperationType,
  SafeSignature,
  UserOperation,
  SafeOperationResponse,
  SafeOperationConfirmation,
  isSafeOperationResponse
} from '@safe-global/safe-core-sdk-types'
import {
  getAddModulesLibDeployment,
  getSafe4337ModuleDeployment
} from '@safe-global/safe-modules-deployments'
import EthSafeOperation from './SafeOperation'
import {
  EstimateFeeProps,
  Safe4337CreateTransactionProps,
  Safe4337ExecutableProps,
  Safe4337InitOptions,
  Safe4337Options,
  UserOperationReceipt,
  UserOperationWithPayload,
  PaymasterOptions
} from './types'
import {
  DEFAULT_SAFE_VERSION,
  DEFAULT_SAFE_MODULES_VERSION,
  INTERFACES,
  RPC_4337_CALLS
} from './constants'
import {
  addDummySignature,
  calculateSafeUserOperationHash,
  encodeMultiSendCallData,
  getEip4337BundlerProvider,
  signSafeOp,
  userOperationToHexValues
} from './utils'
import { entryPointToSafeModules, EQ_OR_GT_0_3_0 } from './utils/entrypoint'
import { PimlicoFeeEstimator } from './estimators/PimlicoFeeEstimator'

const MAX_ERC20_AMOUNT_TO_APPROVE =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn

const EQ_OR_GT_1_4_1 = '>=1.4.1'

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
  EstimateFeeResult: EthSafeOperation
  CreateTransactionProps: Safe4337CreateTransactionProps
  CreateTransactionResult: EthSafeOperation
  ExecuteTransactionProps: Safe4337ExecutableProps
  ExecuteTransactionResult: string
}> {
  #BUNDLER_URL: string

  #ENTRYPOINT_ADDRESS: string
  #SAFE_4337_MODULE_ADDRESS: string = '0x'

  #bundlerClient: ethers.JsonRpcProvider

  #paymasterOptions?: PaymasterOptions

  /**
   * Creates an instance of the Safe4337Pack.
   *
   * @param {Safe4337Options} options - The initialization parameters.
   */
  constructor({
    protocolKit,
    bundlerClient,
    bundlerUrl,
    paymasterOptions,
    entryPointAddress,
    safe4337ModuleAddress
  }: Safe4337Options) {
    super(protocolKit)

    this.#BUNDLER_URL = bundlerUrl
    this.#bundlerClient = bundlerClient
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
    const { provider, signer, options, bundlerUrl, customContracts, paymasterOptions } = initOptions
    let protocolKit: Safe
    const bundlerClient = getEip4337BundlerProvider(bundlerUrl)
    const chainId = await bundlerClient.send(RPC_4337_CALLS.CHAIN_ID, [])

    let addModulesLibAddress = customContracts?.addModulesLibAddress
    const network = parseInt(chainId, 16).toString()

    const safeModulesVersion = initOptions.safeModulesVersion || DEFAULT_SAFE_MODULES_VERSION

    if (semverSatisfies(safeModulesVersion, EQ_OR_GT_0_3_0)) {
      throw new Error(
        `Incompatibility detected: Safe modules version ${safeModulesVersion} is not supported. The SDK can use 0.2.0 only.`
      )
    }

    if (!addModulesLibAddress) {
      const addModulesDeployment = getAddModulesLibDeployment({
        released: true,
        version: safeModulesVersion,
        network
      })
      addModulesLibAddress = addModulesDeployment?.networkAddresses[network]
    }

    let safe4337ModuleAddress = customContracts?.safe4337ModuleAddress
    if (!safe4337ModuleAddress) {
      const safe4337ModuleDeployment = getSafe4337ModuleDeployment({
        released: true,
        version: safeModulesVersion,
        network
      })
      safe4337ModuleAddress = safe4337ModuleDeployment?.networkAddresses[network]
    }

    if (!addModulesLibAddress || !safe4337ModuleAddress) {
      throw new Error(
        `Safe4337Module and/or AddModulesLib not available for chain ${network} and modules version ${safeModulesVersion}`
      )
    }

    // Existing Safe
    if ('safeAddress' in options) {
      protocolKit = await Safe.init({
        provider,
        signer,
        safeAddress: options.safeAddress
      })

      const safeVersion = await protocolKit.getContractVersion()
      const isSafeVersion4337Compatible = semverSatisfies(safeVersion, EQ_OR_GT_1_4_1)

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
          safeProvider: new SafeProvider({ provider, signer }),
          safeVersion: options.safeVersion || DEFAULT_SAFE_VERSION
        })

        deploymentTo = await multiSendContract.getAddress()
        deploymentData = batchData
      }

      protocolKit = await Safe.init({
        provider,
        signer,
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

    let selectedEntryPoint

    if (customContracts?.entryPointAddress) {
      const requiredSafeModulesVersion = entryPointToSafeModules(customContracts?.entryPointAddress)
      if (!semverSatisfies(safeModulesVersion, requiredSafeModulesVersion))
        throw new Error(
          `The selected entrypoint ${customContracts?.entryPointAddress} is not compatible with version ${safeModulesVersion} of Safe modules`
        )

      selectedEntryPoint = customContracts?.entryPointAddress
    } else {
      const supportedEntryPoints = await bundlerClient.send(
        RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS,
        []
      )

      if (!supportedEntryPoints.length) {
        throw new Error('No entrypoint provided or available through the bundler')
      }

      selectedEntryPoint = supportedEntryPoints.find((entryPoint: string) => {
        const requiredSafeModulesVersion = entryPointToSafeModules(entryPoint)
        return semverSatisfies(safeModulesVersion, requiredSafeModulesVersion)
      })

      if (!selectedEntryPoint) {
        throw new Error(
          `Incompatibility detected: None of the entrypoints provided by the bundler is compatible with the Safe modules version ${safeModulesVersion}`
        )
      }
    }

    return new Safe4337Pack({
      protocolKit,
      bundlerClient,
      paymasterOptions,
      bundlerUrl,
      entryPointAddress: selectedEntryPoint!,
      safe4337ModuleAddress
    })
  }

  /**
   * Estimates gas for the SafeOperation.
   *
   * @param {EstimateFeeProps} props - The parameters for the gas estimation.
   * @param {EthSafeOperation} props.safeOperation - The SafeOperation to estimate the gas.
   * @param {IFeeEstimator} props.feeEstimator - The function to estimate the gas.
   * @return {Promise<EthSafeOperation>} The Promise object that will be resolved into the gas estimation.
   */

  async getEstimateFee({
    safeOperation,
    feeEstimator = new PimlicoFeeEstimator()
  }: EstimateFeeProps): Promise<EthSafeOperation> {
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
      [
        userOperationToHexValues(
          addDummySignature(safeOperation.toUserOperation(), await this.protocolKit.getOwners())
        ),
        this.#ENTRYPOINT_ADDRESS
      ]
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
   * @return {Promise<EthSafeOperation>} The Promise object will resolve a SafeOperation.
   */
  async createTransaction({
    transactions,
    options = {}
  }: Safe4337CreateTransactionProps): Promise<EthSafeOperation> {
    const safeAddress = await this.protocolKit.getAddress()
    const nonce = await this.#getSafeNonceFromEntrypoint(safeAddress)

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
          data: encodeMultiSendCallData(transactions),
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

    const safeOperation = new EthSafeOperation(userOperation, {
      moduleAddress: this.#SAFE_4337_MODULE_ADDRESS,
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
   * Converts a SafeOperationResponse to an EthSafeOperation.
   *
   * @param {SafeOperationResponse} safeOperationResponse - The SafeOperationResponse to convert to EthSafeOperation
   * @returns {EthSafeOperation} - The EthSafeOperation object
   */
  #toSafeOperation(safeOperationResponse: SafeOperationResponse): EthSafeOperation {
    const { validUntil, validAfter, userOperation } = safeOperationResponse

    const safeOperation = new EthSafeOperation(
      {
        sender: userOperation?.sender || '0x',
        nonce: userOperation?.nonce?.toString() || '0',
        initCode: userOperation?.initCode || '',
        callData: userOperation?.callData || '',
        callGasLimit: BigInt(userOperation?.callGasLimit || 0n),
        verificationGasLimit: BigInt(userOperation?.verificationGasLimit || 0),
        preVerificationGas: BigInt(userOperation?.preVerificationGas || 0),
        maxFeePerGas: BigInt(userOperation?.maxFeePerGas || 0),
        maxPriorityFeePerGas: BigInt(userOperation?.maxPriorityFeePerGas || 0),
        paymasterAndData: userOperation?.paymasterData || '0x',
        signature: userOperation?.signature || '0x'
      },
      {
        moduleAddress: this.#SAFE_4337_MODULE_ADDRESS,
        entryPoint: userOperation?.entryPoint || this.#ENTRYPOINT_ADDRESS,
        validAfter: validAfter ? new Date(validAfter).getTime() : undefined,
        validUntil: validUntil ? new Date(validUntil).getTime() : undefined
      }
    )

    if (safeOperationResponse.confirmations) {
      safeOperationResponse.confirmations.forEach((confirmation: SafeOperationConfirmation) => {
        safeOperation.addSignature(new EthSafeSignature(confirmation.owner, confirmation.signature))
      })
    }

    return safeOperation
  }

  /**
   * Signs a safe operation.
   *
   * @param {EthSafeOperation | SafeOperationResponse} safeOperation - The SafeOperation to sign. It can be:
   * - A response from the API (Tx Service)
   * - An instance of EthSafeOperation
   * @param {SigningMethod} signingMethod - The signing method to use.
   * @return {Promise<EthSafeOperation>} The Promise object will resolve to the signed SafeOperation.
   */
  async signSafeOperation(
    safeOperation: EthSafeOperation | SafeOperationResponse,
    signingMethod: SigningMethod = SigningMethod.ETH_SIGN_TYPED_DATA_V4
  ): Promise<EthSafeOperation> {
    let safeOp: EthSafeOperation

    if (isSafeOperationResponse(safeOperation)) {
      safeOp = this.#toSafeOperation(safeOperation)
    } else {
      safeOp = safeOperation
    }

    const owners = await this.protocolKit.getOwners()
    const signerAddress = await this.protocolKit.getSafeProvider().getSignerAddress()
    if (!signerAddress) {
      throw new Error('There is no signer address available to sign the SafeOperation')
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
      signature = await signSafeOp(
        safeOp.data,
        this.protocolKit.getSafeProvider(),
        this.#SAFE_4337_MODULE_ADDRESS
      )
    } else {
      const chainId = await this.protocolKit.getSafeProvider().getChainId()
      const safeOpHash = calculateSafeUserOperationHash(
        safeOp.data,
        chainId,
        this.#SAFE_4337_MODULE_ADDRESS
      )

      signature = await this.protocolKit.signHash(safeOpHash)
    }

    const signedSafeOperation = new EthSafeOperation(safeOp.toUserOperation(), {
      moduleAddress: this.#SAFE_4337_MODULE_ADDRESS,
      entryPoint: this.#ENTRYPOINT_ADDRESS,
      validUntil: safeOp.data.validUntil,
      validAfter: safeOp.data.validAfter
    })

    safeOp.signatures.forEach((signature: SafeSignature) => {
      signedSafeOperation.addSignature(signature)
    })

    signedSafeOperation.addSignature(signature)

    return signedSafeOperation
  }

  /**
   * Executes the relay transaction.
   *
   * @param {Safe4337ExecutableProps} props - The parameters for the transaction execution.
   * @param {EthSafeOperation | SafeOperationResponse} props.executable - The SafeOperation to execute. It can be:
   * - A response from the API (Tx Service)
   * - An instance of EthSafeOperation
   * @return {Promise<string>} The user operation hash.
   */
  async executeTransaction({ executable }: Safe4337ExecutableProps): Promise<string> {
    let safeOperation: EthSafeOperation

    if (isSafeOperationResponse(executable)) {
      safeOperation = this.#toSafeOperation(executable)
    } else {
      safeOperation = executable
    }

    const userOperation = safeOperation.toUserOperation()

    return this.#bundlerClient.send(RPC_4337_CALLS.SEND_USER_OPERATION, [
      userOperationToHexValues(userOperation),
      this.#ENTRYPOINT_ADDRESS
    ])
  }

  /**
   * Return a UserOperation based on a hash (userOpHash) returned by eth_sendUserOperation
   *
   * @param {string} userOpHash - The hash of the user operation to fetch. Returned from the #sendUserOperation method
   * @returns {UserOperation} - null in case the UserOperation is not yet included in a block, or a full UserOperation, with the addition of entryPoint, blockNumber, blockHash and transactionHash
   */
  async getUserOperationByHash(userOpHash: string): Promise<UserOperationWithPayload> {
    return this.#bundlerClient.send(RPC_4337_CALLS.GET_USER_OPERATION_BY_HASH, [userOpHash])
  }

  /**
   * Return a UserOperation receipt based on a hash (userOpHash) returned by eth_sendUserOperation
   *
   * @param {string} userOpHash - The hash of the user operation to fetch. Returned from the #sendUserOperation method
   * @returns {UserOperationReceipt} - null in case the UserOperation is not yet included in a block, or UserOperationReceipt object
   */
  async getUserOperationReceipt(userOpHash: string): Promise<UserOperationReceipt | null> {
    return this.#bundlerClient.send(RPC_4337_CALLS.GET_USER_OPERATION_RECEIPT, [userOpHash])
  }

  /**
   * Returns an array of the entryPoint addresses supported by the client.
   * The first element of the array SHOULD be the entryPoint addressed preferred by the client.
   *
   * @returns {string[]} - The supported entry points.
   */
  async getSupportedEntryPoints(): Promise<string[]> {
    return this.#bundlerClient.send(RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS, [])
  }

  /**
   * Returns EIP-155 Chain ID.
   *
   * @returns {string} - The chain id.
   */
  async getChainId(): Promise<string> {
    return this.#bundlerClient.send(RPC_4337_CALLS.CHAIN_ID, [])
  }

  /**
   * Gets account nonce from the bundler.
   *
   * @param {string} safeAddress - Account address for which the nonce is to be fetched.
   * @returns {Promise<string>} The Promise object will resolve to the account nonce.
   */
  async #getSafeNonceFromEntrypoint(safeAddress: string): Promise<string> {
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

    const contract = new ethers.Contract(
      this.#ENTRYPOINT_ADDRESS || '0x',
      abi,
      this.protocolKit.getSafeProvider().getExternalProvider()
    )

    const newNonce = await contract.getNonce(safeAddress, BigInt(0))

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
}
