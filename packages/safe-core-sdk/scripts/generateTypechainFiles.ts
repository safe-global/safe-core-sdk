const { exec } = require('child_process')

// Directory where the Typechain files will be generated
const outDir = 'src/types/typechain/'

// Contract list for which the Typechain files will be generated
const safeContractsPath = '../../node_modules/@gnosis.pm/safe-contracts/build/contracts'
const safeContracts = [
  `${safeContractsPath}/GnosisSafe.json`,
  `${safeContractsPath}/GnosisSafeProxyFactory.json`,
  `${safeContractsPath}/MultiSend.json`,
  `${safeContractsPath}/DailyLimitModule.json`,
  `${safeContractsPath}/SocialRecoveryModule.json`
]
const openZeppelinContractsPath = '../../node_modules/openzeppelin-solidity/build/contracts'
const openZeppelinContracts = [
  `${openZeppelinContractsPath}/ERC20Mintable.json`
]
const contractList = [...safeContracts, ...openZeppelinContracts].join(' ')

// Remove existing Typechain files
exec('rimraf src/types/typechain', (error, stdout) => {
  if (error) {
    console.log(error.message)
    return
  }
  console.log(stdout)
})

// Generate Web3 types
const web3V1 = 'web3-v1'
exec(`typechain --target ${web3V1} --out-dir ${outDir}${web3V1} ${contractList}`, (error, stdout) => {
  if (error) {
    console.log(error.message)
    return
  }
  console.log(stdout)
})

// Generate Ethers types
const ethersV5 = 'ethers-v5'
exec(`typechain --target ${ethersV5} --out-dir ${outDir}${ethersV5} ${contractList}`, (error, stdout) => {
  if (error) {
    console.log(error.message)
    return
  }
  console.log(stdout)
})
