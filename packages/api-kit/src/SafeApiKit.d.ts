import { Signer } from '@ethersproject/abstract-signer';
import { EthAdapter, SafeMultisigConfirmationListResponse, SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { AllTransactionsListResponse, AllTransactionsOptions, MasterCopyResponse, ModulesResponse, OwnerResponse, ProposeTransactionProps, SafeCreationInfoResponse, SafeDelegate, SafeDelegateConfig, SafeDelegateDeleteConfig, SafeDelegateListResponse, SafeInfoResponse, SafeModuleTransactionListResponse, SafeMultisigTransactionEstimate, SafeMultisigTransactionEstimateResponse, SafeMultisigTransactionListResponse, SafeServiceInfoResponse, SignatureResponse, TokenInfoListResponse, TokenInfoResponse, TransferListResponse } from '@safe-global/api-kit/types/safeTransactionServiceTypes';
export interface SafeApiKitConfig {
    /** txServiceUrl - Safe Transaction Service URL */
    txServiceUrl: string;
    /** ethAdapter - Ethereum adapter */
    ethAdapter: EthAdapter;
}
declare class SafeApiKit {
    #private;
    constructor({ txServiceUrl, ethAdapter }: SafeApiKitConfig);
    /**
     * Returns the information and configuration of the service.
     *
     * @returns The information and configuration of the service
     */
    getServiceInfo(): Promise<SafeServiceInfoResponse>;
    /**
     * Returns the list of Safe master copies.
     *
     * @returns The list of Safe master copies
     */
    getServiceMasterCopiesInfo(): Promise<MasterCopyResponse[]>;
    /**
     * Decodes the specified Safe transaction data.
     *
     * @param data - The Safe transaction data
     * @returns The transaction data decoded
     * @throws "Invalid data"
     * @throws "Not Found"
     * @throws "Ensure this field has at least 1 hexadecimal chars (not counting 0x)."
     */
    decodeData(data: string): Promise<any>;
    /**
     * Returns the list of Safes where the address provided is an owner.
     *
     * @param ownerAddress - The owner address
     * @returns The list of Safes where the address provided is an owner
     * @throws "Invalid owner address"
     * @throws "Checksum address validation failed"
     */
    getSafesByOwner(ownerAddress: string): Promise<OwnerResponse>;
    /**
     * Returns the list of Safes where the module address provided is enabled.
     *
     * @param moduleAddress - The Safe module address
     * @returns The list of Safe addresses where the module provided is enabled
     * @throws "Invalid module address"
     * @throws "Module address checksum not valid"
     */
    getSafesByModule(moduleAddress: string): Promise<ModulesResponse>;
    /**
     * Returns all the information of a Safe transaction.
     *
     * @param safeTxHash - Hash of the Safe transaction
     * @returns The information of a Safe transaction
     * @throws "Invalid safeTxHash"
     * @throws "Not found."
     */
    getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse>;
    /**
     * Returns the list of confirmations for a given a Safe transaction.
     *
     * @param safeTxHash - The hash of the Safe transaction
     * @returns The list of confirmations
     * @throws "Invalid safeTxHash"
     */
    getTransactionConfirmations(safeTxHash: string): Promise<SafeMultisigConfirmationListResponse>;
    /**
     * Adds a confirmation for a Safe transaction.
     *
     * @param safeTxHash - Hash of the Safe transaction that will be confirmed
     * @param signature - Signature of the transaction
     * @returns
     * @throws "Invalid safeTxHash"
     * @throws "Invalid signature"
     * @throws "Malformed data"
     * @throws "Error processing data"
     */
    confirmTransaction(safeTxHash: string, signature: string): Promise<SignatureResponse>;
    /**
     * Returns the information and configuration of the provided Safe address.
     *
     * @param safeAddress - The Safe address
     * @returns The information and configuration of the provided Safe address
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    getSafeInfo(safeAddress: string): Promise<SafeInfoResponse>;
    /**
     * Returns the list of delegates for a given Safe address.
     *
     * @param safeAddress - The Safe address
     * @returns The list of delegates
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    getSafeDelegates(safeAddress: string): Promise<SafeDelegateListResponse>;
    /**
     * Adds a new delegate for a given Safe address.
     *
     * @param delegateConfig - The configuration of the new delegate
     * @returns
     * @throws "Invalid Safe address"
     * @throws "Invalid Safe delegate address"
     * @throws "Checksum address validation failed"
     * @throws "Address <delegate_address> is not checksumed"
     * @throws "Safe=<safe_address> does not exist or it's still not indexed"
     * @throws "Signing owner is not an owner of the Safe"
     */
    addSafeDelegate({ safe, delegate, label, signer }: SafeDelegateConfig): Promise<SafeDelegate>;
    /**
     * Removes all delegates for a given Safe address.
     *
     * @param safeAddress - The Safe address
     * @param signer - A Signer that owns the Safe
     * @returns
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     * @throws "Safe=<safe_address> does not exist or it's still not indexed"
     * @throws "Signing owner is not an owner of the Safe"
     */
    removeAllSafeDelegates(safeAddress: string, signer: Signer): Promise<void>;
    /**
     * Removes a delegate for a given Safe address.
     *
     * @param delegateConfig - The configuration for the delegate that will be removed
     * @returns
     * @throws "Invalid Safe address"
     * @throws "Invalid Safe delegate address"
     * @throws "Checksum address validation failed"
     * @throws "Signing owner is not an owner of the Safe"
     * @throws "Not found"
     */
    removeSafeDelegate({ safe, delegate, signer }: SafeDelegateDeleteConfig): Promise<void>;
    /**
     * Returns the creation information of a Safe.
     *
     * @param safeAddress - The Safe address
     * @returns The creation information of a Safe
     * @throws "Invalid Safe address"
     * @throws "Safe creation not found"
     * @throws "Checksum address validation failed"
     * @throws "Problem connecting to Ethereum network"
     */
    getSafeCreationInfo(safeAddress: string): Promise<SafeCreationInfoResponse>;
    /**
     * Estimates the safeTxGas for a given Safe multi-signature transaction.
     *
     * @param safeAddress - The Safe address
     * @param safeTransaction - The Safe transaction to estimate
     * @returns The safeTxGas for the given Safe transaction
     * @throws "Invalid Safe address"
     * @throws "Data not valid"
     * @throws "Safe not found"
     * @throws "Tx not valid"
     */
    estimateSafeTransaction(safeAddress: string, safeTransaction: SafeMultisigTransactionEstimate): Promise<SafeMultisigTransactionEstimateResponse>;
    /**
     * Creates a new multi-signature transaction with its confirmations and stores it in the Safe Transaction Service.
     *
     * @param proposeTransactionConfig - The configuration of the proposed transaction
     * @returns The hash of the Safe transaction proposed
     * @throws "Invalid Safe address"
     * @throws "Invalid safeTxHash"
     * @throws "Invalid data"
     * @throws "Invalid ethereum address/User is not an owner/Invalid signature/Nonce already executed/Sender is not an owner"
     */
    proposeTransaction({ safeAddress, safeTransactionData, safeTxHash, senderAddress, senderSignature, origin }: ProposeTransactionProps): Promise<void>;
    /**
     * Returns the history of incoming transactions of a Safe account.
     *
     * @param safeAddress - The Safe address
     * @returns The history of incoming transactions
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    getIncomingTransactions(safeAddress: string): Promise<TransferListResponse>;
    /**
     * Returns the history of module transactions of a Safe account.
     *
     * @param safeAddress - The Safe address
     * @returns The history of module transactions
     * @throws "Invalid Safe address"
     * @throws "Invalid data"
     * @throws "Invalid ethereum address"
     */
    getModuleTransactions(safeAddress: string): Promise<SafeModuleTransactionListResponse>;
    /**
     * Returns the history of multi-signature transactions of a Safe account.
     *
     * @param safeAddress - The Safe address
     * @returns The history of multi-signature transactions
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    getMultisigTransactions(safeAddress: string): Promise<SafeMultisigTransactionListResponse>;
    /**
     * Returns the list of multi-signature transactions that are waiting for the confirmation of the Safe owners.
     *
     * @param safeAddress - The Safe address
     * @param currentNonce - Current nonce of the Safe
     * @returns The list of transactions waiting for the confirmation of the Safe owners
     * @throws "Invalid Safe address"
     * @throws "Invalid data"
     * @throws "Invalid ethereum address"
     */
    getPendingTransactions(safeAddress: string, currentNonce?: number): Promise<SafeMultisigTransactionListResponse>;
    /**
     * Returns a list of transactions for a Safe. The list has different structures depending on the transaction type
     *
     * @param safeAddress - The Safe address
     * @returns The list of transactions waiting for the confirmation of the Safe owners
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    getAllTransactions(safeAddress: string, options?: AllTransactionsOptions): Promise<AllTransactionsListResponse>;
    /**
     * Returns the right nonce to propose a new transaction after the last pending transaction.
     *
     * @param safeAddress - The Safe address
     * @returns The right nonce to propose a new transaction after the last pending transaction
     * @throws "Invalid Safe address"
     * @throws "Invalid data"
     * @throws "Invalid ethereum address"
     */
    getNextNonce(safeAddress: string): Promise<number>;
    /**
     * Returns the list of all the ERC20 tokens handled by the Safe.
     *
     * @returns The list of all the ERC20 tokens
     */
    getTokenList(): Promise<TokenInfoListResponse>;
    /**
     * Returns the information of a given ERC20 token.
     *
     * @param tokenAddress - The token address
     * @returns The information of the given ERC20 token
     * @throws "Invalid token address"
     * @throws "Checksum address validation failed"
     */
    getToken(tokenAddress: string): Promise<TokenInfoResponse>;
}
export default SafeApiKit;
