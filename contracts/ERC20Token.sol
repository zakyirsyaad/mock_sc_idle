// ERC20Token.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Token is ERC20, Ownable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        _mint(_owner, _initialSupply); // Mint total supply ke pemilik
    }
}
