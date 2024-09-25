// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.9.0;

import { ProxyFactory } from "./safe_V1_0_0/proxies/ProxyFactory.sol";
import { GnosisSafe } from "./safe_V1_0_0/GnosisSafe.sol";

contract SafeProxyFactory_SV1_0_0 is ProxyFactory {}
contract Safe_SV1_0_0 is GnosisSafe {}
