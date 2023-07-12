import { execSync } from 'child_process'
import { existsSync, mkdirSync, readdir } from 'fs'
import path from 'path'

// Directories where the Typechain files will be generated
const outDirSrc = 'typechain/src/'
const typeChainDirectorySrcPath = path.join(__dirname, `../${outDirSrc}`)

const outDirBuild = 'dist/typechain/src/'
const typeChainDirectoryBuildPath = path.join(__dirname, `../${outDirBuild}`)

const outDirTests = 'typechain/tests/'

// Contract list for which the Typechain files will be generated
// Will be included in dist/ folder
const safeContractsPath = '../../node_modules/@safe-global/safe-deployments/dist/assets'

const safeContracts_V1_4_1 = [
  `${safeContractsPath}/v1.4.1/safe.json`,
  `${safeContractsPath}/v1.4.1/safe_proxy_factory.json`,
  `${safeContractsPath}/v1.4.1/multi_send.json`,
  `${safeContractsPath}/v1.4.1/multi_send_call_only.json`,
  `${safeContractsPath}/v1.4.1/compatibility_fallback_handler.json`,
  `${safeContractsPath}/v1.4.1/sign_message_lib.json`,
  `${safeContractsPath}/v1.4.1/create_call.json`,
  `${safeContractsPath}/v1.4.1/simulate_tx_accessor.json`
].join(' ')
const safeContracts_V1_3_0 = [
  `${safeContractsPath}/v1.3.0/gnosis_safe.json`,
  `${safeContractsPath}/v1.3.0/proxy_factory.json`,
  `${safeContractsPath}/v1.3.0/multi_send.json`,
  `${safeContractsPath}/v1.3.0/multi_send_call_only.json`,
  `${safeContractsPath}/v1.3.0/compatibility_fallback_handler.json`,
  `${safeContractsPath}/v1.3.0/sign_message_lib.json`,
  `${safeContractsPath}/v1.3.0/create_call.json`,
  `${safeContractsPath}/v1.3.0/simulate_tx_accessor.json`
].join(' ')
const safeContracts_V1_2_0 = [`${safeContractsPath}/v1.2.0/gnosis_safe.json`].join(' ')
const safeContracts_V1_1_1 = [
  `${safeContractsPath}/v1.1.1/gnosis_safe.json`,
  `${safeContractsPath}/v1.1.1/proxy_factory.json`,
  `${safeContractsPath}/v1.1.1/multi_send.json`
].join(' ')
const safeContracts_V1_0_0 = [
  `${safeContractsPath}/v1.0.0/gnosis_safe.json`,
  `${safeContractsPath}/v1.0.0/proxy_factory.json`
].join(' ')

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
const safeContractsTestV1_2_0Path =
  '../../node_modules/@gnosis.pm/safe-contracts-v1.2.0/build/contracts'
const openZeppelinContractsPath = '../../node_modules/openzeppelin-solidity/build/contracts'
const testContracts_V1_2_0 = [
  `${safeContractsTestV1_2_0Path}/DailyLimitModule.json`,
  `${safeContractsTestV1_2_0Path}/SocialRecoveryModule.json`,
  `${openZeppelinContractsPath}/ERC20Mintable.json`
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

// Copy Typechain files with the right extension (.d.ts -> .ts) allows them to be included in the build folder
function moveTypechainFiles(inDir: string, outDir: string): void {
  readdir(`${inDir}`, (error, files) => {
    if (error) {
      console.log(error)
    }
    if (!existsSync(`${outDir}`)) {
      mkdirSync(`${outDir}`, { recursive: true })
    }
    files.forEach((file) => {
      const pattern = /.d.ts/
      if (!file.match(pattern)) {
        return
      }
      execSync(`cp ${inDir}/${file} ${outDir}/${file}`)
    })
  })
}

function generateTypes(typechainTarget: string) {
  // Src
  generateTypechainFiles(
    typechainTarget,
    `${outDirSrc}${typechainTarget}/v1.4.1`,
    safeContracts_V1_4_1
  )
  generateTypechainFiles(
    typechainTarget,
    `${outDirSrc}${typechainTarget}/v1.3.0`,
    safeContracts_V1_3_0
  )
  generateTypechainFiles(
    typechainTarget,
    `${outDirSrc}${typechainTarget}/v1.2.0`,
    safeContracts_V1_2_0
  )
  generateTypechainFiles(
    typechainTarget,
    `${outDirSrc}${typechainTarget}/v1.1.1`,
    safeContracts_V1_1_1
  )
  generateTypechainFiles(
    typechainTarget,
    `${outDirSrc}${typechainTarget}/v1.0.0`,
    safeContracts_V1_0_0
  )
  moveTypechainFiles(
    `${typeChainDirectorySrcPath}${typechainTarget}/v1.4.1`,
    `${typeChainDirectoryBuildPath}${typechainTarget}/v1.4.1`
  )
  moveTypechainFiles(
    `${typeChainDirectorySrcPath}${typechainTarget}/v1.3.0`,
    `${typeChainDirectoryBuildPath}${typechainTarget}/v1.3.0`
  )
  moveTypechainFiles(
    `${typeChainDirectorySrcPath}${typechainTarget}/v1.2.0`,
    `${typeChainDirectoryBuildPath}${typechainTarget}/v1.2.0`
  )
  moveTypechainFiles(
    `${typeChainDirectorySrcPath}${typechainTarget}/v1.1.1`,
    `${typeChainDirectoryBuildPath}${typechainTarget}/v1.1.1`
  )
  moveTypechainFiles(
    `${typeChainDirectorySrcPath}${typechainTarget}/v1.0.0`,
    `${typeChainDirectoryBuildPath}${typechainTarget}/v1.0.0`
  )

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

generateTypes('ethers-v5')
generateTypes('web3-v1')
