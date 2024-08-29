// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.9.0;

import { GnosisSafeProxyFactory } from "./safe_V1_2_0/proxies/GnosisSafeProxyFactory.sol";
import { GnosisSafe } from "./safe_V1_2_0/GnosisSafe.sol";
import { MultiSend } from "./safe_V1_2_0/libraries/MultiSend.sol";

// Testing contracts
import { DailyLimitModule } from "./safe_V1_2_0/modules/DailyLimitModule.sol";
import { SocialRecoveryModule } from "./safe_V1_2_0/modules/SocialRecoveryModule.sol";
import { ERC20Mintable } from "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

contract SafeProxyFactory_SV1_2_0 is GnosisSafeProxyFactory {}
contract Safe_SV1_2_0 is GnosisSafe {}
contract MultiSend_SV1_2_0 is MultiSend {}
