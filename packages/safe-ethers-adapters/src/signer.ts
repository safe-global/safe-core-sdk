
import { ethers, utils, BigNumber } from "ethers";
import { VoidSigner, Signer } from "@ethersproject/abstract-signer";
import { Provider, TransactionResponse, TransactionRequest, TransactionReceipt } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { getCreateCallDeployment } from "@gnosis.pm/safe-deployments";
import EthersSafe, { Safe, SafeSignature, SafeTransaction, SafeTransactionDataPartial } from "@gnosis.pm/safe-core-sdk";
import axios, { AxiosInstance } from "axios";
import { SafeTransactionData } from "@gnosis.pm/safe-core-sdk/dist/src/utils/transactions/SafeTransaction";

export class SafeService {

    serviceUrl: string
    network: AxiosInstance

    constructor(serviceUrl: string, network?: AxiosInstance) {
        this.serviceUrl = serviceUrl
        this.network = network ?? axios;
    }

    async estimateSafeTx(safe: string, safeTx: SafeTransactionDataPartial): Promise<any> {
        const url = `${this.serviceUrl}/api/v1/safes/${safe}/multisig-transactions/estimations/`
        const resp = await this.network.post(url, safeTx)
        return resp.data
    }

    async getSafeTxDetails(safeTxHash: string): Promise<any> {
        const url = `${this.serviceUrl}/api/v1/multisig-transactions/${safeTxHash}`
        const resp = await this.network.get(url)
        return resp.data
    }

    async proposeTx(safeAddress: string, safeTxHash: string, safeTx: SafeTransaction, signature: SafeSignature): Promise<String> {
        const url = `${this.serviceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/`
        const data = {
            ...safeTx,
            contractTransactionHash: safeTxHash,
            sender: signature.signer,
            signature: signature.data
        }
        const resp = await this.network.post(url, data)
        return resp.data
    }
}

export interface SafeTransactionResponse extends TransactionResponse {
    operation: number
}

export class SafeEthersSigner extends VoidSigner {

    createLibAddress: string
    createLibInterface: utils.Interface
    service: SafeService
    safe: Safe

    static async create(address: string, signer: Signer, service: SafeService, provider?: Provider): Promise<SafeEthersSigner> { 
        const safe = await EthersSafe.create({ethers, safeAddress: address, providerOrSigner: signer})
        return new SafeEthersSigner(safe, service, provider)
    }
    
    constructor(safe: Safe, service: SafeService, provider?: Provider) {
        super(safe.getAddress(), provider)
        const createLibDeployment = getCreateCallDeployment()
        this.service = service
        this.createLibAddress = createLibDeployment!!.defaultAddress 
        this.createLibInterface = new utils.Interface(createLibDeployment!!.abi) 
        this.safe = safe
    }

    async buildTransactionResponse(safeTxHash: string, safeTx: SafeTransactionData): Promise<SafeTransactionResponse> {
        const connectedSafe = this.safe;
        return {
            to: safeTx.to,
            value: BigNumber.from(safeTx.value), 
            data: safeTx.data,
            operation: safeTx.operation,
            gasLimit: BigNumber.from(safeTx.safeTxGas),
            gasPrice: BigNumber.from(0),
            nonce: safeTx.nonce,
            chainId: await connectedSafe.getChainId(),
            hash: safeTxHash,
            from: this.address,
            confirmations: 0,
            wait: async (confirmations?: number): Promise<TransactionReceipt> => { 
                return this._fail("SafeEthersSigner cannot wait yet", "wait") 
            }
        }
    }

    // Populates all fields in a transaction, signs it and sends it to the network
    async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<SafeTransactionResponse> {
        this._checkProvider("sendTransaction");

        const tx = await transaction
        let operation = 0
        let to = await tx.to
        let data = (await tx.data)?.toString() ?? "0x"
        let value = BigNumber.from(await tx.value ?? 0)
        if (!to) {
            to = this.createLibAddress
            data = this.createLibInterface.encodeFunctionData("performCreate", [value, data])
            if (!value.eq(0)) return this._fail("SafeEthersSigner cannot deploy contract with value", "sendTransaction");
            operation = 1
        }
        const baseTx = {
            to: to!!,
            data,
            value: value.toString(),
            operation
        }
        const safeTxGas = await this.service.estimateSafeTx(this.address, baseTx)
        const safeTx = await this.safe.createTransaction({
            ...baseTx,
            safeTxGas
        })
        const safeTxHash = await this.safe.getTransactionHash(safeTx)
        const signature = await this.safe.signTransactionHash(safeTxHash)
        await this.service.proposeTx(this.address, safeTxHash, safeTx, signature)
        // TODO: maybe use original tx information
        return this.buildTransactionResponse(safeTxHash, safeTx.data)
    }
}