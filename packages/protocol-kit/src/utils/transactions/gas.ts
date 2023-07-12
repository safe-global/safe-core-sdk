import { BigNumber } from '@ethersproject/bignumber'
import { ContractNetworksConfig } from '@safe-global/protocol-kit/types'
import {
  EthAdapter,
  OperationType,
  SafeContract,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import { getSimulateTxAccessorContract } from '../../contracts/safeDeploymentContracts'

function estimateDataGasCosts(data: string): number {
  const reducer = (accumulator: number, currentValue: string) => {
    if (currentValue === '0x') {
      return accumulator + 0
    }
    if (currentValue === '00') {
      return accumulator + 4
    }
    return accumulator + 16
  }
  return (data.match(/.{2}/g) as string[]).reduce(reducer, 0)
}

export async function estimateGas(
  safeVersion: SafeVersion,
  safeContract: SafeContract,
  ethAdapter: EthAdapter,
  to: string,
  valueInWei: string,
  data: string,
  operation: OperationType,
  customContracts?: ContractNetworksConfig
) {
  const chainId = await ethAdapter.getChainId()
  const simulateTxAccessorContract = await getSimulateTxAccessorContract({
    ethAdapter,
    safeVersion,
    customContracts: customContracts?.[chainId]
  })

  const transactionDataToEstimate = simulateTxAccessorContract.encode('simulate', [
    to,
    valueInWei,
    data,
    operation
  ])
  const safeFunctionToEstimate = safeContract.encode('simulateAndRevert', [
    await simulateTxAccessorContract.getAddress(),
    transactionDataToEstimate
  ])
  const safeAddress = safeContract.getAddress()
  const transactionToEstimateGas = {
    to: safeAddress,
    value: '0',
    data: safeFunctionToEstimate,
    from: safeAddress
  }

  // TO-DO: Improve decoding
  /*
  const simulateAndRevertResponse = ethAdapter.decodeParameters(
    ['bool', 'bytes'],
    encodedResponse
  )
  const returnedData = ethAdapter.decodeParameters(['uint256', 'bool', 'bytes'], simulateAndRevertResponse[1])
  */
  try {
    const encodedResponse = await ethAdapter.call(transactionToEstimateGas)

    return Number('0x' + encodedResponse.slice(184).slice(0, 10)).toString()
  } catch (error: any) {
    // Ethers
    if (error?.error?.body) {
      const revertData = JSON.parse(error.error.body).error.data
      if (revertData && revertData.startsWith('Reverted ')) {
        const [, encodedResponse] = revertData.split('Reverted ')
        const safeTxGas = Number('0x' + encodedResponse.slice(184).slice(0, 10)).toString()

        return safeTxGas
      }
    }

    // Web3
    const [, encodedResponse] = error.message.split('return data: ')
    const safeTxGas = Number('0x' + encodedResponse.slice(184).slice(0, 10)).toString()

    return safeTxGas
  }
}

export async function estimateTxGas(
  safeContract: SafeContract,
  ethAdapter: EthAdapter,
  to: string,
  valueInWei: string,
  data: string,
  operation: OperationType
): Promise<string> {
  let txGasEstimation = BigNumber.from(0)
  const safeAddress = safeContract.getAddress()

  const estimateData: string = safeContract.encode('requiredTxGas', [
    to,
    valueInWei,
    data,
    operation
  ])
  try {
    const estimateResponse = await ethAdapter.estimateGas({
      to: safeAddress,
      from: safeAddress,
      data: estimateData
    })
    txGasEstimation = BigNumber.from('0x' + estimateResponse.substring(138)).add(10000)
  } catch (error) {}

  if (txGasEstimation.gt(0)) {
    const dataGasEstimation = estimateDataGasCosts(estimateData)
    let additionalGas = 10000
    for (let i = 0; i < 10; i++) {
      try {
        const estimateResponse = await ethAdapter.call({
          to: safeAddress,
          from: safeAddress,
          data: estimateData,
          gasPrice: '0',
          gasLimit: txGasEstimation.add(dataGasEstimation).add(additionalGas).toString()
        })
        if (estimateResponse !== '0x') {
          break
        }
      } catch (error) {}
      txGasEstimation = txGasEstimation.add(additionalGas)
      additionalGas *= 2
    }
    return txGasEstimation.add(additionalGas).toString()
  }

  try {
    const estimateGas = await ethAdapter.estimateGas({
      to,
      from: safeAddress,
      value: valueInWei,
      data
    })
    return estimateGas
  } catch (error) {
    if (operation === OperationType.DelegateCall) {
      return '0'
    }
    return Promise.reject(error)
  }
}
