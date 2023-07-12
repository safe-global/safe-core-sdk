// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.9.0;

import { GnosisSafeProxyFactory } from "@gnosis.pm/safe-contracts-v1.2.0/contracts/proxies/GnosisSafeProxyFactory.sol";
import { GnosisSafe } from "@gnosis.pm/safe-contracts-v1.2.0/contracts/GnosisSafe.sol";
import { MultiSend } from "@gnosis.pm/safe-contracts-v1.2.0/contracts/libraries/MultiSend.sol";

// Testing contracts
import { DailyLimitModule } from "@gnosis.pm/safe-contracts-v1.2.0/contracts/modules/DailyLimitModule.sol";
import { SocialRecoveryModule } from "@gnosis.pm/safe-contracts-v1.2.0/contracts/modules/SocialRecoveryModule.sol";
import { ERC20Mintable } from "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

contract SafeProxyFactory_SV1_2_0 is GnosisSafeProxyFactory {}
contract Safe_SV1_2_0 is GnosisSafe {}
contract MultiSend_SV1_2_0 is MultiSend {}
