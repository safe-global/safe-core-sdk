import { BigNumber } from '@ethersproject/bignumber'
import { arrayify, BytesLike } from '@ethersproject/bytes'
import { pack as solidityPack } from '@ethersproject/solidity'
import { BigNumberish, ethers, Signer } from 'ethers'
import { GnosisSafe } from '../../typechain/GnosisSafe'
import { GnosisSafeProxyFactory } from '../../typechain/proxies/GnosisSafeProxyFactory'
import { PREDETERMINED_SALT_NONCE, ZERO_ADDRESS } from '../constants'
import { MetaTransactionData, SafeTransactionData } from '../types'
import {
  getCompatibilityFallbackHandlerAddress,
  getSafeContract,
  getSafeProxyFactoryContract
} from './deployments'

export function encodeCreateProxyWithNonce(
  safeProxyFactoryContract: GnosisSafeProxyFactory,
  safeSingletonAddress: string,
  initializer: string
) {
  return safeProxyFactoryContract.interface.encodeFunctionData('createProxyWithNonce', [
    safeSingletonAddress,
    initializer,
    PREDETERMINED_SALT_NONCE
  ])
}

export function encodeSetupCallData(
  safeContract: GnosisSafe,
  owners: string[],
  chainId: number
): string {
  return safeContract.interface.encodeFunctionData('setup', [
    owners,
    BigNumber.from(1) as BigNumberish,
    ZERO_ADDRESS,
    '0x' as BytesLike,
    getCompatibilityFallbackHandlerAddress(chainId),
    ZERO_ADDRESS,
    BigNumber.from(0) as BigNumberish,
    ZERO_ADDRESS
  ])
}

export function encodeExecTransaction(
  safeContract: GnosisSafe,
  transaction: SafeTransactionData,
  signature: string
): string {
  return safeContract.interface.encodeFunctionData('execTransaction', [
    transaction.to,
    transaction.value,
    transaction.data,
    transaction.operation,
    transaction.safeTxGas,
    transaction.baseGas,
    transaction.gasPrice,
    transaction.gasToken,
    transaction.refundReceiver,
    signature
  ])
}

function encodeMetaTransaction(tx: MetaTransactionData): string {
  const data = arrayify(tx.data)
  const encoded = solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [tx.operation, tx.to, tx.value, data.length, data]
  )
  return encoded.slice(2)
}

export function encodeMultiSendData(txs: MetaTransactionData[]): string {
  return '0x' + txs.map((tx) => encodeMetaTransaction(tx)).join('')
}

export async function getSafeInitializer(
  safeContract: GnosisSafe,
  signerAddress: string,
  chainId: number
): Promise<string> {
  const initializer = await encodeSetupCallData(safeContract, [signerAddress], chainId)
  return initializer
}

export async function calculateChainSpecificProxyAddress(
  safeProxyFactoryContract: GnosisSafeProxyFactory,
  signer: Signer,
  chainId: number
): Promise<string> {
  const safeSingletonContract = getSafeContract(chainId, signer)
  const deployer = safeProxyFactoryContract.address
  const signerAddress = await signer.getAddress()

  const deploymentCode = ethers.utils.solidityPack(
    ['bytes', 'uint256'],
    [
      await getSafeProxyFactoryContract(chainId, signer).proxyCreationCode(),
      safeSingletonContract.address
    ]
  )
  const salt = ethers.utils.solidityKeccak256(
    ['bytes32', 'uint256'],
    [
      ethers.utils.solidityKeccak256(
        ['bytes'],
        [await getSafeInitializer(safeSingletonContract, signerAddress, chainId)]
      ),
      PREDETERMINED_SALT_NONCE
    ]
  )
  const derivedAddress = ethers.utils.getCreate2Address(
    deployer,
    salt,
    ethers.utils.keccak256(deploymentCode)
  )
  return derivedAddress
}
