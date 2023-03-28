"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SafeApiKit_txServiceBaseUrl, _SafeApiKit_ethAdapter;
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@safe-global/api-kit/utils");
const httpRequests_1 = require("@safe-global/api-kit/utils/httpRequests");
class SafeApiKit {
    constructor({ txServiceUrl, ethAdapter }) {
        _SafeApiKit_txServiceBaseUrl.set(this, void 0);
        _SafeApiKit_ethAdapter.set(this, void 0);
        __classPrivateFieldSet(this, _SafeApiKit_txServiceBaseUrl, (0, utils_1.getTxServiceBaseUrl)(txServiceUrl), "f");
        __classPrivateFieldSet(this, _SafeApiKit_ethAdapter, ethAdapter, "f");
    }
    /**
     * Returns the information and configuration of the service.
     *
     * @returns The information and configuration of the service
     */
    async getServiceInfo() {
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/about`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns the list of Safe master copies.
     *
     * @returns The list of Safe master copies
     */
    async getServiceMasterCopiesInfo() {
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/about/master-copies`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Decodes the specified Safe transaction data.
     *
     * @param data - The Safe transaction data
     * @returns The transaction data decoded
     * @throws "Invalid data"
     * @throws "Not Found"
     * @throws "Ensure this field has at least 1 hexadecimal chars (not counting 0x)."
     */
    async decodeData(data) {
        if (data === '') {
            throw new Error('Invalid data');
        }
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/data-decoder/`,
            method: httpRequests_1.HttpMethod.Post,
            body: { data }
        });
    }
    /**
     * Returns the list of Safes where the address provided is an owner.
     *
     * @param ownerAddress - The owner address
     * @returns The list of Safes where the address provided is an owner
     * @throws "Invalid owner address"
     * @throws "Checksum address validation failed"
     */
    async getSafesByOwner(ownerAddress) {
        if (ownerAddress === '') {
            throw new Error('Invalid owner address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(ownerAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/owners/${address}/safes/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns the list of Safes where the module address provided is enabled.
     *
     * @param moduleAddress - The Safe module address
     * @returns The list of Safe addresses where the module provided is enabled
     * @throws "Invalid module address"
     * @throws "Module address checksum not valid"
     */
    async getSafesByModule(moduleAddress) {
        if (moduleAddress === '') {
            throw new Error('Invalid module address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(moduleAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/modules/${address}/safes/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns all the information of a Safe transaction.
     *
     * @param safeTxHash - Hash of the Safe transaction
     * @returns The information of a Safe transaction
     * @throws "Invalid safeTxHash"
     * @throws "Not found."
     */
    async getTransaction(safeTxHash) {
        if (safeTxHash === '') {
            throw new Error('Invalid safeTxHash');
        }
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/multisig-transactions/${safeTxHash}/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns the list of confirmations for a given a Safe transaction.
     *
     * @param safeTxHash - The hash of the Safe transaction
     * @returns The list of confirmations
     * @throws "Invalid safeTxHash"
     */
    async getTransactionConfirmations(safeTxHash) {
        if (safeTxHash === '') {
            throw new Error('Invalid safeTxHash');
        }
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
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
    async confirmTransaction(safeTxHash, signature) {
        if (safeTxHash === '') {
            throw new Error('Invalid safeTxHash');
        }
        if (signature === '') {
            throw new Error('Invalid signature');
        }
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
            method: httpRequests_1.HttpMethod.Post,
            body: {
                signature
            }
        });
    }
    /**
     * Returns the information and configuration of the provided Safe address.
     *
     * @param safeAddress - The Safe address
     * @returns The information and configuration of the provided Safe address
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    async getSafeInfo(safeAddress) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns the list of delegates for a given Safe address.
     *
     * @param safeAddress - The Safe address
     * @returns The list of delegates
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    async getSafeDelegates(safeAddress) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/delegates/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
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
    async addSafeDelegate({ safe, delegate, label, signer }) {
        if (safe === '') {
            throw new Error('Invalid Safe address');
        }
        if (delegate === '') {
            throw new Error('Invalid Safe delegate address');
        }
        const { address: safeAddress } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safe);
        const { address: delegateAddress } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(delegate);
        const totp = Math.floor(Date.now() / 1000 / 3600);
        const data = delegateAddress + totp;
        const signature = await signer.signMessage(data);
        const body = {
            safe: safeAddress,
            delegate: delegateAddress,
            label,
            signature
        };
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${safeAddress}/delegates/`,
            method: httpRequests_1.HttpMethod.Post,
            body
        });
    }
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
    async removeAllSafeDelegates(safeAddress, signer) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        const totp = Math.floor(Date.now() / 1000 / 3600);
        const data = address + totp;
        const signature = await signer.signMessage(data);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/delegates/`,
            method: httpRequests_1.HttpMethod.Delete,
            body: { signature }
        });
    }
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
    async removeSafeDelegate({ safe, delegate, signer }) {
        if (safe === '') {
            throw new Error('Invalid Safe address');
        }
        if (delegate === '') {
            throw new Error('Invalid Safe delegate address');
        }
        const { address: safeAddress } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safe);
        const { address: delegateAddress } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(delegate);
        const totp = Math.floor(Date.now() / 1000 / 3600);
        const data = delegateAddress + totp;
        const signature = await signer.signMessage(data);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${safeAddress}/delegates/${delegateAddress}`,
            method: httpRequests_1.HttpMethod.Delete,
            body: {
                safe: safeAddress,
                delegate: delegateAddress,
                signature
            }
        });
    }
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
    async getSafeCreationInfo(safeAddress) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/creation/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
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
    async estimateSafeTransaction(safeAddress, safeTransaction) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/multisig-transactions/estimations/`,
            method: httpRequests_1.HttpMethod.Post,
            body: safeTransaction
        });
    }
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
    async proposeTransaction({ safeAddress, safeTransactionData, safeTxHash, senderAddress, senderSignature, origin }) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address: safe } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        const { address: sender } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(senderAddress);
        if (safeTxHash === '') {
            throw new Error('Invalid safeTxHash');
        }
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${safe}/multisig-transactions/`,
            method: httpRequests_1.HttpMethod.Post,
            body: {
                ...safeTransactionData,
                contractTransactionHash: safeTxHash,
                sender,
                signature: senderSignature,
                origin
            }
        });
    }
    /**
     * Returns the history of incoming transactions of a Safe account.
     *
     * @param safeAddress - The Safe address
     * @returns The history of incoming transactions
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    async getIncomingTransactions(safeAddress) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/incoming-transfers/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns the history of module transactions of a Safe account.
     *
     * @param safeAddress - The Safe address
     * @returns The history of module transactions
     * @throws "Invalid Safe address"
     * @throws "Invalid data"
     * @throws "Invalid ethereum address"
     */
    async getModuleTransactions(safeAddress) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/module-transactions/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns the history of multi-signature transactions of a Safe account.
     *
     * @param safeAddress - The Safe address
     * @returns The history of multi-signature transactions
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    async getMultisigTransactions(safeAddress) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/multisig-transactions/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
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
    async getPendingTransactions(safeAddress, currentNonce) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        const nonce = currentNonce ? currentNonce : (await this.getSafeInfo(address)).nonce;
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/multisig-transactions/?executed=false&nonce__gte=${nonce}`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns a list of transactions for a Safe. The list has different structures depending on the transaction type
     *
     * @param safeAddress - The Safe address
     * @returns The list of transactions waiting for the confirmation of the Safe owners
     * @throws "Invalid Safe address"
     * @throws "Checksum address validation failed"
     */
    async getAllTransactions(safeAddress, options) {
        var _a, _b, _c;
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        const url = new URL(`${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/safes/${address}/all-transactions/`);
        const trusted = ((_a = options === null || options === void 0 ? void 0 : options.trusted) === null || _a === void 0 ? void 0 : _a.toString()) || 'true';
        url.searchParams.set('trusted', trusted);
        const queued = ((_b = options === null || options === void 0 ? void 0 : options.queued) === null || _b === void 0 ? void 0 : _b.toString()) || 'true';
        url.searchParams.set('queued', queued);
        const executed = ((_c = options === null || options === void 0 ? void 0 : options.executed) === null || _c === void 0 ? void 0 : _c.toString()) || 'false';
        url.searchParams.set('executed', executed);
        return (0, httpRequests_1.sendRequest)({
            url: url.toString(),
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns the right nonce to propose a new transaction after the last pending transaction.
     *
     * @param safeAddress - The Safe address
     * @returns The right nonce to propose a new transaction after the last pending transaction
     * @throws "Invalid Safe address"
     * @throws "Invalid data"
     * @throws "Invalid ethereum address"
     */
    async getNextNonce(safeAddress) {
        if (safeAddress === '') {
            throw new Error('Invalid Safe address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(safeAddress);
        const pendingTransactions = await this.getPendingTransactions(address);
        if (pendingTransactions.results.length > 0) {
            const nonces = pendingTransactions.results.map((tx) => tx.nonce);
            const lastNonce = Math.max(...nonces);
            return lastNonce + 1;
        }
        const safeInfo = await this.getSafeInfo(address);
        return safeInfo.nonce;
    }
    /**
     * Returns the list of all the ERC20 tokens handled by the Safe.
     *
     * @returns The list of all the ERC20 tokens
     */
    async getTokenList() {
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/tokens/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
    /**
     * Returns the information of a given ERC20 token.
     *
     * @param tokenAddress - The token address
     * @returns The information of the given ERC20 token
     * @throws "Invalid token address"
     * @throws "Checksum address validation failed"
     */
    async getToken(tokenAddress) {
        if (tokenAddress === '') {
            throw new Error('Invalid token address');
        }
        const { address } = await __classPrivateFieldGet(this, _SafeApiKit_ethAdapter, "f").getEip3770Address(tokenAddress);
        return (0, httpRequests_1.sendRequest)({
            url: `${__classPrivateFieldGet(this, _SafeApiKit_txServiceBaseUrl, "f")}/v1/tokens/${address}/`,
            method: httpRequests_1.HttpMethod.Get
        });
    }
}
_SafeApiKit_txServiceBaseUrl = new WeakMap(), _SafeApiKit_ethAdapter = new WeakMap();
exports.default = SafeApiKit;
//# sourceMappingURL=SafeApiKit.js.map