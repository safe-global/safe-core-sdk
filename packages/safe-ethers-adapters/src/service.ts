import { BigNumber } from "ethers";
import { SafeSignature, SafeTransaction, SafeTransactionDataPartial } from "@gnosis.pm/safe-core-sdk";
import axios, { AxiosError, AxiosInstance } from "axios";

export interface SafeTxDetails {
    transactionHash?: string
}

export class SafeService {

    serviceUrl: string
    network: AxiosInstance

    constructor(serviceUrl: string, network?: AxiosInstance) {
        this.serviceUrl = serviceUrl
        this.network = network ?? axios;
    }

    async estimateSafeTx(safe: string, safeTx: SafeTransactionDataPartial): Promise<BigNumber> {
        const url = `${this.serviceUrl}/api/v1/safes/${safe}/multisig-transactions/estimations/`
        const resp = await this.network.post(url, safeTx)
        return BigNumber.from(resp.data.safeTxGas)
    }

    async getSafeTxDetails(safeTxHash: string): Promise<SafeTxDetails> {
        const url = `${this.serviceUrl}/api/v1/multisig-transactions/${safeTxHash}`
        const resp = await this.network.get<SafeTxDetails>(url)
        return resp.data
    }

    async proposeTx(safeAddress: string, safeTxHash: string, safeTx: SafeTransaction, signature: SafeSignature): Promise<String> {
        const url = `${this.serviceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/`
        const data = {
            ...safeTx.data,
            contractTransactionHash: safeTxHash,
            sender: signature.signer,
            signature: signature.data
        }
        const resp = await this.network.post(url, data)
        return resp.data
    }
}