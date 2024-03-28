import { execSync } from 'child_process'

// Directories where the Typechain files will be generated
const outDirSrc = 'typechain/src/'

const outDirTests = 'typechain/tests/'

// Won't be included in dist/ folder
const safeContractsTestV1_4_1Path =
  '../../node_modules/@safe-global/safe-contracts-v1.4.1/build/artifacts/contracts'
const testContracts_V1_4_1 = [
  `${safeContractsTestV1_4_1Path}/examples/guards/DebugTransactionGuard.sol/DebugTransactionGuard.json`
].join(' ')
const safeContractsTestV1_3_0Path =
  '../../node_modules/@gnosis.pm/safe-contracts-v1.3.0/build/artifacts/contracts'
const testContracts_V1_3_0 = [
  `${safeContractsTestV1_3_0Path}/examples/guards/DebugTransactionGuard.sol/DebugTransactionGuard.json`,
  `${safeContractsTestV1_3_0Path}/examples/guards/DefaultCallbackHandler.sol/DefaultCallbackHandler.json`
].join(' ')
const safeContractsTestV1_2_0Path = './artifacts/contracts/safe_V1_2_0'
const openZeppelinContractsPath = './artifacts/@openzeppelin/contracts'
const testContracts_V1_2_0 = [
  `${safeContractsTestV1_2_0Path}/modules/DailiLimitModule.sol/DailyLimitModule.json`,
  `${safeContractsTestV1_2_0Path}/modules/SocialRecoveryModule.sol/SocialRecoveryModule.json`,
  `${openZeppelinContractsPath}/token/ERC20/ERC20Mintable.sol/ERC20Mintable.json`
].join(' ')

// Remove existing Typechain files
execSync(`rimraf ${outDirSrc} ${outDirTests}`)

// Generate Typechain files
function generateTypechainFiles(
  typechainVersion: string,
  outDir: string,
  contractList: string
): void {
  execSync(`typechain --target ${typechainVersion} --out-dir ${outDir} ${contractList}`)
  console.log(`Generated typechain ${typechainVersion} at ${outDir}`)
}

function generateTypes(typechainTarget: string) {
  // Tests
  generateTypechainFiles(
    typechainTarget,
    `${outDirTests}${typechainTarget}/v1.4.1`,
    testContracts_V1_4_1
  )
  generateTypechainFiles(
    typechainTarget,
    `${outDirTests}${typechainTarget}/v1.3.0`,
    testContracts_V1_3_0
  )
  generateTypechainFiles(
    typechainTarget,
    `${outDirTests}${typechainTarget}/v1.2.0`,
    testContracts_V1_2_0
  )
}

generateTypes('web3-v1')
generateTypes('ethers-v6')
