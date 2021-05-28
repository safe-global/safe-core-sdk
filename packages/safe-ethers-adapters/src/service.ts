import { BigNumber } from "ethers";
import { SafeSignature, SafeTransaction, SafeTransactionDataPartial } from "@gnosis.pm/safe-core-sdk";
import axios, { AxiosError, AxiosInstance } from "axios";

export class SafeService {

    serviceUrl: string
    network: AxiosInstance

    constructor(serviceUrl: string, network?: AxiosInstance) {
        this.serviceUrl = serviceUrl
        this.network = network ?? axios;
    }

    async estimateSafeTx(safe: string, safeTx: SafeTransactionDataPartial): Promise<BigNumber> {
        const url = `${this.serviceUrl}/api/v1/safes/${safe}/multisig-transactions/estimations/`
        try {
            console.log({safeTx})
            const resp = await this.network.post(url, safeTx)
            return BigNumber.from(resp.data.safeTxGas)
        } catch (e) {
            console.log((e as AxiosError).response)
            throw e
        }
    }

    async getSafeTxDetails(safeTxHash: string): Promise<any> {
        const url = `${this.serviceUrl}/api/v1/multisig-transactions/${safeTxHash}`
        const resp = await this.network.get(url)
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
        try {
            console.log({data})
            const resp = await this.network.post(url, data)
            return resp.data
        } catch (e) {
            console.log((e as AxiosError).response)
            throw e
        }
    }
}