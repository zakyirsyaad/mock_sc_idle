// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Swap is Ownable(msg.sender) {
    IERC20 public token;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    event LiquidityAdded(address indexed provider, uint256 ethAmount, uint256 tokenAmount);
    event LiquidityRemoved(address indexed provider, uint256 ethAmount, uint256 tokenAmount);
    event Swapped(address indexed user, uint256 ethAmount, uint256 tokenAmount);

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    function addLiquidity(uint256 tokenAmount) external payable {
        require(msg.value > 0, "Must provide ETH");
        require(tokenAmount > 0, "Must provide tokens");
        
        token.transferFrom(msg.sender, address(this), tokenAmount);
        liquidity[msg.sender] += msg.value;
        totalLiquidity += msg.value;
        
        emit LiquidityAdded(msg.sender, msg.value, tokenAmount);
    }

    function removeLiquidity(uint256 ethAmount) external {
        require(ethAmount > 0, "Must specify ETH amount");
        require(liquidity[msg.sender] >= ethAmount, "Insufficient liquidity");

        uint256 tokenAmount = (ethAmount * token.balanceOf(address(this))) / address(this).balance;
        liquidity[msg.sender] -= ethAmount;
        totalLiquidity -= ethAmount;
        
        payable(msg.sender).transfer(ethAmount);
        token.transfer(msg.sender, tokenAmount);
        
        emit LiquidityRemoved(msg.sender, ethAmount, tokenAmount);
    }

    function getTokenBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function calculateSwap(uint256 amount, bool isEthToToken) public view returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");

        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 ethReserve = address(this).balance;

        if (isEthToToken) {
            return (amount * tokenReserve) / (ethReserve + amount);
        } else {
            return (amount * ethReserve) / (tokenReserve + amount);
        }
    }

    function swapTokenToEth(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Must send tokens");

        uint256 ethAmount = calculateSwap(tokenAmount, false);
        require(address(this).balance >= ethAmount, "Insufficient ETH in contract");

        token.transferFrom(msg.sender, address(this), tokenAmount);
        payable(msg.sender).transfer(ethAmount);

        emit Swapped(msg.sender, ethAmount, tokenAmount);
    }
}
