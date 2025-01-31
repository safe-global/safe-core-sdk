import {
  Address,
  createPublicClient,
  custom,
  encodeFunctionData,
  formatEther,
  parseAbi
} from 'viem'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { ExternalSigner } from '@safe-global/protocol-kit'
import { getBlock, waitForTransactionReceipt } from 'viem/actions'
import { MetaTransactionData } from 'packages/types-kit/dist/src'
import { sepolia } from 'viem/chains'

export const generateTransferCallData = (to: string, value: bigint) => {
  const functionAbi = parseAbi(['function transfer(address _to, uint256 _value) returns (bool)'])

  return encodeFunctionData({
    abi: functionAbi,
    functionName: 'transfer',
    args: [to, value]
  })
}

export async function waitForOperationToFinish(
  userOperationHash: string,
  chainName: string,
  safe4337Pack: Safe4337Pack
) {
  console.log(`https://jiffyscan.xyz/userOpHash/${userOperationHash}?network=${chainName}`)

  let userOperationReceipt = null
  while (!userOperationReceipt) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    userOperationReceipt = await safe4337Pack.getUserOperationReceipt(userOperationHash)
  }

  console.group('User Operation Receipt and hash')
  console.log('User Operation Receipt', userOperationReceipt)
  console.log(
    'User Operation By Hash',
    await safe4337Pack.getUserOperationByHash(userOperationHash)
  )
  console.groupEnd()
}

export async function transfer(
  signer: ExternalSigner,
  tokenAddress: Address,
  to: Address,
  amount: bigint
) {
  const transferEC20 = {
    to: tokenAddress,
    data: generateTransferCallData(to, amount),
    value: 0n,
    chain: signer.chain
  }

  const hash = await signer.sendTransaction(transferEC20)

  const publicClient = createPublicClient({
    chain: signer.chain,
    transport: custom(signer.transport)
  })

  return await publicClient.waitForTransactionReceipt({ hash })
}

export async function setup4337Playground(
  safe4337Pack: Safe4337Pack,
  {
    nativeTokenAmount,
    erc20TokenAmount,
    erc20TokenContractAddress
  }: {
    nativeTokenAmount?: bigint
    erc20TokenAmount?: bigint
    erc20TokenContractAddress: string
  } = {
    erc20TokenAmount: 200_000n,
    erc20TokenContractAddress: '0xFC3e86566895Fb007c6A0d3809eb2827DF94F751'
  }
): Promise<{ transactions: MetaTransactionData[]; timestamp: bigint }> {
  const senderAddress = await safe4337Pack.protocolKit.getAddress()

  // Log supported entry points and Safe state
  console.log('Supported Entry Points', await safe4337Pack.getSupportedEntryPoints())
  console.log('Chain id', await safe4337Pack.getChainId())
  console.log('Safe Address: ', senderAddress)
  console.log('Safe Owners:', await safe4337Pack.protocolKit.getOwners())
  console.log('is Safe Account deployed: ', await safe4337Pack.protocolKit.isSafeDeployed())

  const externalProvider = safe4337Pack.protocolKit.getSafeProvider().getExternalProvider()
  const externalSigner = await safe4337Pack.protocolKit.getSafeProvider().getExternalSigner()
  const signerAddress = await safe4337Pack.protocolKit.getSafeProvider().getSignerAddress()

  if (!externalSigner || !signerAddress) {
    throw new Error('No signer found!')
  }

  // Fund Safe
  if (nativeTokenAmount) {
    console.log(`sending ${formatEther(nativeTokenAmount)} native tokens...`)

    const hash = await externalSigner?.sendTransaction({
      to: senderAddress,
      value: nativeTokenAmount,
      chain: sepolia
    })

    await waitForTransactionReceipt(externalProvider, { hash })
  }

  if (erc20TokenAmount && erc20TokenContractAddress) {
    console.log(`sending test tokens...`)

    await transfer(externalSigner, erc20TokenContractAddress, senderAddress, erc20TokenAmount)
  }

  // Create transaction batch
  console.log(`creating the Safe batch ...`)

  const transferPIM = {
    to: erc20TokenContractAddress,
    data: generateTransferCallData(signerAddress, 100_000n),
    value: '0'
  }

  const timestamp =
    (await getBlock(safe4337Pack.protocolKit.getSafeProvider().getExternalProvider()))?.timestamp ||
    0n

  return {
    transactions: [transferPIM, transferPIM],
    timestamp
  }
}
