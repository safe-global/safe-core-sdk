import path from 'path'
import '@nomicfoundation/hardhat-viem'
import 'hardhat-deploy'
import 'tsconfig-paths/register'
import { HardhatUserConfig, HardhatNetworkAccountsUserConfig } from 'hardhat/types'

type GetHardHatConfig = {
  testsDir?: string
  testAccounts?: HardhatNetworkAccountsUserConfig
  hardhatAccounts?: HardhatNetworkAccountsUserConfig
}

const HARDHAT_ACCOUNTS = [
  {
    balance: '100000000000000000000',
    privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4'
  },
  {
    balance: '100000000000000000000',
    privateKey: '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
  }
]

export function getHardHatConfig({
  testsDir,
  testAccounts,
  hardhatAccounts = HARDHAT_ACCOUNTS
}: GetHardHatConfig = {}): HardhatUserConfig {
  console.log(__dirname)
  return {
    defaultNetwork: 'hardhat',
    solidity: {
      compilers: [
        { version: '0.5.17' },
        { version: '0.5.3' },
        { version: '0.8.0' },
        {
          version: '0.8.24',
          settings: {
            optimizer: {
              enabled: true,
              runs: 10_000_000
            },
            viaIR: false,
            evmVersion: 'paris'
          }
        }
      ],
      overrides: {
        '@gnosis.pm/safe-contracts-v1.3.0/contracts/handler/CompatibilityFallbackHandler.sol': {
          version: '0.8.0'
        }
      }
    },
    paths: {
      artifacts: path.resolve(__dirname, '../artifacts'),
      deploy: path.resolve(__dirname, './deploy'),
      sources: path.resolve(__dirname, './contracts'),
      tests: testsDir
    },
    networks: {
      localhost: {
        url: 'http://127.0.0.1:8545'
      },
      hardhat: {
        allowUnlimitedContractSize: true,
        blockGasLimit: 100000000,
        gas: 100000000,
        accounts: hardhatAccounts
      },
      sepolia: {
        accounts: testAccounts,
        url: 'https://sepolia.gateway.tenderly.co'
      }
    },
    //@ts-expect-error Type not found
    compilerOptions: {
      paths: { '^@safe-global/testing-kit/(.*)$': ['../testing-kit/src/*'] }
    },
    namedAccounts: {
      deployer: {
        default: 0
      }
    }
  }
}
