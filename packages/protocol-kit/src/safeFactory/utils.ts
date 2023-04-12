import { BigNumber } from '@ethersproject/bignumber'
import { generateAddress2, keccak256, toBuffer } from 'ethereumjs-util'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import SafeFactory, { SafeAccountConfig, SafeDeploymentConfig } from './'

export const validateSafeAccountConfig = ({ owners, threshold }: SafeAccountConfig): void => {
  if (owners.length <= 0) throw new Error('Owner list must have at least one owner')
  if (threshold <= 0) throw new Error('Threshold must be greater than or equal to 1')
  if (threshold > owners.length)
    throw new Error('Threshold must be lower than or equal to owners length')
}

export const validateSafeDeploymentConfig = ({ saltNonce }: SafeDeploymentConfig): void => {
  if (BigNumber.from(saltNonce).lt(0))
    throw new Error('saltNonce must be greater than or equal to 0')
}

export interface PredictSafeProps {
  ethAdapter: EthAdapter
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig: SafeDeploymentConfig
}

export async function predictSafeAddress({
  ethAdapter,
  safeAccountConfig,
  safeDeploymentConfig
}: PredictSafeProps): Promise<string> {
  validateSafeAccountConfig(safeAccountConfig)
  validateSafeDeploymentConfig(safeDeploymentConfig)

  const safeFactory = await SafeFactory.create({ ethAdapter })

  const from = safeFactory.getAddress()

  const initializer = await safeFactory.encodeSetupCallData(safeAccountConfig)
  const saltNonce = safeDeploymentConfig.saltNonce

  const encodedNonce = toBuffer(ethAdapter.encodeParameters(['uint256'], [saltNonce])).toString(
    'hex'
  )

  const salt = keccak256(
    toBuffer('0x' + keccak256(toBuffer(initializer)).toString('hex') + encodedNonce)
  )

  const safeProxyFactoryContract = safeFactory.getSafeProxyFactoryContract()
  const safeContract = safeFactory.getSafeContract()
  const safeContractAddress = safeContract.getAddress()

  const proxyCreationCode = await safeProxyFactoryContract.proxyCreationCode()
  const constructorData = toBuffer(
    ethAdapter.encodeParameters(['address'], [safeContractAddress])
  ).toString('hex')

  const initCode = proxyCreationCode + constructorData

  const proxyAddress =
    '0x' + generateAddress2(toBuffer(from), toBuffer(salt), toBuffer(initCode)).toString('hex')

  return ethAdapter.getChecksummedAddress(proxyAddress)
}
