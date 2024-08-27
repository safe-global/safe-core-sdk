// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.9.0;

import { ProxyFactory } from "./safe_V1_1_1/proxies/ProxyFactory.sol";
import { GnosisSafe } from "./safe_V1_1_1/GnosisSafe.sol";
import { MultiSend } from "./safe_V1_1_1/libraries/MultiSend.sol";
import { CreateCall } from "./safe_V1_1_1/libraries/CreateCall.sol";

contract SafeProxyFactory_SV1_1_1 is ProxyFactory {}
contract Safe_SV1_1_1 is GnosisSafe {}
contract MultiSend_SV1_1_1 is GnosisSafe {}
contract CreateCall_SV1_1_1 is GnosisSafe {}
