// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import { SafeProxyFactory } from "@safe-global/safe-contracts-v1.4.1/contracts/proxies/SafeProxyFactory.sol";
import { Safe } from "@safe-global/safe-contracts-v1.4.1/contracts/Safe.sol";
import { CompatibilityFallbackHandler } from "@safe-global/safe-contracts-v1.4.1/contracts/handler/CompatibilityFallbackHandler.sol";
import { MultiSend } from "@safe-global/safe-contracts-v1.4.1/contracts/libraries/MultiSend.sol";
import { MultiSendCallOnly } from "@safe-global/safe-contracts-v1.4.1/contracts/libraries/MultiSendCallOnly.sol";
import { SignMessageLib } from "@safe-global/safe-contracts-v1.4.1/contracts/libraries/SignMessageLib.sol";
import { CreateCall } from "@safe-global/safe-contracts-v1.4.1/contracts/libraries/CreateCall.sol";
import { TokenCallbackHandler } from "@safe-global/safe-contracts-v1.4.1/contracts/handler/TokenCallbackHandler.sol";

contract SafeProxyFactory_SV1_4_1 is SafeProxyFactory {}
contract Safe_SV1_4_1 is Safe {}
contract CompatibilityFallbackHandler_SV1_4_1 is CompatibilityFallbackHandler {}
contract MultiSend_SV1_4_1 is MultiSend {}
contract MultiSendCallOnly_SV1_4_1 is MultiSendCallOnly {}
contract SignMessageLib_SV1_4_1 is SignMessageLib {}
contract CreateCall_SV1_4_1 is CreateCall {}
contract TokenCallbackHandler_SV1_4_1 is TokenCallbackHandler {}
