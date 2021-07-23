const { execSync } = require('child_process')
const { readdir, mkdirSync, existsSync } = require('fs')
const path = require('path')

// Directories where the Typechain files will be generated
const outDirSrc = 'typechain/src/'
const typeChainDirectorySrcPath = path.join(__dirname, `../${outDirSrc}`)

const outDirTests = 'typechain/tests/'
const typeChainDirectoryTestsPath = path.join(__dirname, `../${outDirTests}`)

const outDirBuild = 'dist/typechain/src/'
const typeChainDirectoryBuildPath = path.join(__dirname, `../${outDirBuild}`)

// Contract list for which the Typechain files will be generated
// Will be included in dist/ folder
const safeContractsPath = '../../node_modules/@gnosis.pm/safe-contracts/build/contracts'
const openZeppelinContractsPath = '../../node_modules/openzeppelin-solidity/build/contracts'
const safeContracts = [
  `${safeContractsPath}/GnosisSafe.json`,
  `${safeContractsPath}/GnosisSafeProxyFactory.json`,
  `${safeContractsPath}/MultiSend.json`,
].join(' ')
// Won't be included in dist/ folder
const testContracts = [
  `${safeContractsPath}/DailyLimitModule.json`,
  `${safeContractsPath}/SocialRecoveryModule.json`,
  `${openZeppelinContractsPath}/ERC20Mintable.json`
].join(' ')

// Remove existing Typechain files
execSync(`rimraf ${outDirSrc} ${outDirTests}`, (error) => {
  if (error) {
    console.log(error.message)
    return
  }
})

// Generate Typechain files
function generateTypechainFiles(typechainVersion, outDir, contractList) {
  execSync(`typechain --target ${typechainVersion} --out-dir ${outDir}${typechainVersion} ${contractList}`, (error) => {
    if (error) {
      console.log(error.message)
    }
  })
  console.log(`Generated typechain ${typechainVersion} at ${outDir}`)
}

// Copy Typechain files with the right extension (.d.ts -> .ts) allows them to be included in the build folder
function moveTypechainFiles(typechainVersion, inDir, outDir) {
  readdir(`${inDir}${typechainVersion}`, (error, files) => {
    if (error) {
      console.log(error)
    }
    if (!existsSync(`${outDir}${typechainVersion}`)) {
      mkdirSync(`${outDir}${typechainVersion}`, { recursive: true })
    }
    files.forEach(file => {
      const pattern = /.d.ts/
      if (!file.match(pattern)) {
        return
      }
      execSync(`cp ${inDir}${typechainVersion}/${file} ${outDir}${typechainVersion}/${file}`)
    })
  })
}

const web3V1 = 'web3-v1'
const ethersV5 = 'ethers-v5'

// Src: Web3 V1 types
generateTypechainFiles(web3V1, outDirSrc, safeContracts)
moveTypechainFiles(web3V1, typeChainDirectorySrcPath, typeChainDirectoryBuildPath)

// Src: Ethers V5 types
generateTypechainFiles(ethersV5, outDirSrc, safeContracts)
moveTypechainFiles(ethersV5, typeChainDirectorySrcPath, typeChainDirectoryBuildPath)

// Tests: Ethers V5 types
generateTypechainFiles(ethersV5, outDirTests, testContracts)
