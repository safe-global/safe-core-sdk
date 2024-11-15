#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// Resolve the root directory of the package
const packageRoot = path.resolve(__dirname, '../')
const projectRoot = process.cwd()

// Capture the command and arguments
const args = process.argv.slice(2)
const command = args[0]
const directory = args[1]

if (!command) {
  console.error('No command specified')
  process.exit(1)
}

const validCommands = ['compile', 'deploy', 'test']

if (!validCommands.includes(command)) {
  console.error(`Invalid command: ${command}`)
  process.exit(1)
}

// Ensure the script always runs from the package root directory
process.chdir(packageRoot)

const hardhatConfigPath = path.join(packageRoot, 'hardhat.config.ts')

if (!fs.existsSync(hardhatConfigPath)) {
  console.error('No Hardhat configuration file found in the target project')
  process.exit(1)
}

try {
  process.env.TS_NODE_PROJECT = `${projectRoot}/tsconfig.json`

  if (command === 'test' && directory) {
    execSync(`yarn ${command} ${path.join(projectRoot, directory)}`, { stdio: 'inherit' })
  } else {
    execSync(`yarn ${command}`, { stdio: 'inherit' })
  }
} catch (error) {
  console.error(`Failed to execute Hardhat command: ${error.message}`)
  process.exit(1)
}
