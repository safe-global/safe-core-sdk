// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ERC20Mintable — TEST-ONLY mock token
/// @notice Mintable ERC20 used exclusively as a fixture by `@safe-global/testing-kit`.
///         Do NOT deploy to any production network. The `mint` function is permissionless
///         by design so tests can fund arbitrary addresses with no setup.
/// @dev    Consumed by protocol-kit e2e tests via `getERC20Mintable()`.
contract ERC20Mintable is ERC20 {
    constructor() ERC20("ERC20Mintable", "ERC20") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
