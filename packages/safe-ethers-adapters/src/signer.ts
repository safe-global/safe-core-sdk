import { ethers, utils, BigNumber } from "ethers";
import { VoidSigner, Signer } from "@ethersproject/abstract-signer";
import { Provider, TransactionResponse, TransactionRequest, TransactionReceipt } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { getCreateCallDeployment } from "@gnosis.pm/safe-deployments";
import EthersSafe, { Safe } from "@gnosis.pm/safe-core-sdk";
import { SafeTransactionData } from "@gnosis.pm/safe-core-sdk/dist/src/utils/transactions/SafeTransaction";
import { SafeService } from "service";

const sleep = (duration: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, duration))

export interface SafeTransactionResponse extends TransactionResponse {
    operation: number
}

export interface SafeEthersSignerOptions {
    pollingDelay?: number
}

export class SafeEthersSigner extends VoidSigner {

    readonly createLibAddress: string
    readonly createLibInterface: utils.Interface
    readonly service: SafeService
    readonly safe: Safe
    readonly options?: SafeEthersSignerOptions

    static async create(address: string, signer: Signer, service: SafeService, provider?: Provider, options?: SafeEthersSignerOptions): Promise<SafeEthersSigner> { 
        const safe = await EthersSafe.create({ethers, safeAddress: address, providerOrSigner: signer})
        return new SafeEthersSigner(safe, service, provider, options)
    }
    
    constructor(safe: Safe, service: SafeService, provider?: Provider, options?: SafeEthersSignerOptions) {
        super(safe.getAddress(), provider)
        const createLibDeployment = getCreateCallDeployment()
        this.service = service
        this.createLibAddress = createLibDeployment!!.defaultAddress 
        this.createLibInterface = new utils.Interface(createLibDeployment!!.abi) 
        this.safe = safe
        this.options = options
    }

    async buildTransactionResponse(safeTxHash: string, safeTx: SafeTransactionData): Promise<SafeTransactionResponse> {
        const connectedSafe = this.safe;
        const connectedService = this.service;
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
                while (true) {
                    try {
                        const txDetails = await connectedService.getSafeTxDetails(safeTxHash)
                        if (txDetails.transactionHash) {
                            this._checkProvider("sendTransaction")
                            const receipt = await this.provider!!.waitForTransaction(txDetails.transactionHash, confirmations)
                            // update status with Safe tx status and extract created contract
                            // TODO load topic strings from abi
                            const success = receipt.logs.find((log: any) => log.topics[0] === "0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e")
                            receipt.status = !!success ? 1 : 0
                            if (safeTx.to.toLowerCase() === this.createLibAddress.toLowerCase()) {
                                const creationLog = receipt.logs.find((log: any) => log.topics[0] === "0x4db17dd5e4732fb6da34a148104a592783ca119a1e7bb8829eba6cbadef0b511")
                                if(creationLog)
                                    receipt.contractAddress = utils.getAddress("0x" + creationLog.data.slice(creationLog.data.length - 40))
                            }
                            return receipt
                        }
                    } catch (e) {
                    }
                    await sleep(this.options?.pollingDelay ?? 5000)
                }
            }
        }
    }

    // Populates all fields in a transaction, signs it and sends it to the network
    async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<SafeTransactionResponse> {
        const tx = await transaction
        let operation = 0
        let to = await tx.to
        let data = (await tx.data)?.toString() ?? "0x"
        let value = BigNumber.from(await tx.value ?? 0)
        if (!to) {
            to = this.createLibAddress
            data = this.createLibInterface.encodeFunctionData("performCreate", [value, data])
            value = BigNumber.from(0)
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
            safeTxGas: safeTxGas.toNumber()
        })
        const safeTxHash = await this.safe.getTransactionHash(safeTx)
        const signature = await this.safe.signTransactionHash(safeTxHash)
        await this.service.proposeTx(this.address, safeTxHash, safeTx, signature)
        // TODO: maybe use original tx information
        return this.buildTransactionResponse(safeTxHash, safeTx.data)
    }
}