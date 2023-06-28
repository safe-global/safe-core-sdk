// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import { GnosisSafeProxyFactory } from "@safe-global/safe-contracts-v1.4.1/contracts/proxies/GnosisSafeProxyFactory.sol";
import { GnosisSafe } from "@safe-global/safe-contracts-v1.4.1/contracts/GnosisSafe.sol";
import { CompatibilityFallbackHandler } from "@safe-global/safe-contracts-v1.4.1/contracts/handler/CompatibilityFallbackHandler.sol";
import { MultiSend } from "@safe-global/safe-contracts-v1.4.1/contracts/libraries/MultiSend.sol";
import { MultiSendCallOnly } from "@safe-global/safe-contracts-v1.4.1/contracts/libraries/MultiSendCallOnly.sol";
import { SignMessageLib } from "@safe-global/safe-contracts-v1.4.1/contracts/examples/libraries/SignMessage.sol";
import { CreateCall } from "@safe-global/safe-contracts-v1.4.1/contracts/libraries/CreateCall.sol";
import { DefaultCallbackHandler } from "@safe-global/safe-contracts-v1.4.1/contracts/handler/DefaultCallbackHandler.sol";

contract ProxyFactory_SV1_4_1 is GnosisSafeProxyFactory {}
contract GnosisSafe_SV1_4_1 is GnosisSafe {}
contract CompatibilityFallbackHandler_SV1_4_1 is CompatibilityFallbackHandler {}
contract MultiSend_SV1_4_1 is MultiSend {}
contract MultiSendCallOnly_SV1_4_1 is MultiSendCallOnly {}
contract SignMessageLib_SV1_4_1 is SignMessageLib {}
contract CreateCall_SV1_4_1 is CreateCall {}
contract DefaultCallbackHandler_SV1_4_1 is DefaultCallbackHandler {}
