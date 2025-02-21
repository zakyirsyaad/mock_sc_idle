// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IdleToken is ERC20, Ownable {
    mapping(address => bool) public whitelist;
    string private _tokenURI; 

    event TokenBurned(address indexed burner, uint256 amount);
    event WhitelistUpdated(address indexed user, bool status);
    event TokenURIUpdated(string newURI);

    constructor(
        address initialOwner
    ) ERC20("Idle", "IDL") Ownable(initialOwner) {
        _mint(initialOwner, 1000000000* 10 ** decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external onlyOwner {
        require(balanceOf(_msgSender()) >= amount, "Insufficient balance");
        _burn(_msgSender(), amount);
        emit TokenBurned(_msgSender(), amount);
    }

    function claimToken(address to, uint256 amount) external onlyOwner {
        require(whitelist[to], "Not in whitelist");
        require(balanceOf(owner()) >= amount, "Not enough tokens in owner balance");
        _transfer(owner(), to, amount);
    }

    function addToWhitelist(address _address) external onlyOwner {
        whitelist[_address] = true;
        emit WhitelistUpdated(_address, true);
    }

    function removeFromWhitelist(address _address) external onlyOwner {
        whitelist[_address] = false;
        emit WhitelistUpdated(_address, false);
    }

    function tokenURI() external view returns (string memory) {
        return _tokenURI;
    }

    function setTokenURI(string memory newURI) external onlyOwner {
        _tokenURI = newURI;
        emit TokenURIUpdated(newURI);
    }
}
