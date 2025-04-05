// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Swap {
    IERC20 public immutable IdleToken;
    mapping(address => uint256) public tokenBalances;
    uint256 public ethBalance;

    event LiquidityAdded(
        address indexed provider,
        address token,
        uint256 amount
    );
    event LiquidityRemoved(
        address indexed provider,
        address token,
        uint256 amount
    );
    event Swapped(
        address indexed user,
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _idleTokenAddress) {
        require(_idleTokenAddress != address(0), "Invalid token address");
        IdleToken = IERC20(_idleTokenAddress);
    }

    function addLiquidity(address token, uint256 amount) external payable {
        if (token == address(0)) {
            require(msg.value > 0, "ETH amount required");
            ethBalance += msg.value;
        } else {
            require(amount > 0, "Token amount required");
            require(msg.value == 0, "ETH not required for tokens");
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            tokenBalances[token] += amount;
        }
        emit LiquidityAdded(msg.sender, token, amount);
    }

    function removeLiquidity(address token, uint256 amount) external {
        if (token == address(0)) {
            require(ethBalance >= amount, "Insufficient ETH liquidity");
            ethBalance -= amount;
            payable(msg.sender).transfer(amount);
        } else {
            require(
                tokenBalances[token] >= amount,
                "Insufficient token liquidity"
            );
            tokenBalances[token] -= amount;
            IERC20(token).transfer(msg.sender, amount);
        }
        emit LiquidityRemoved(msg.sender, token, amount);
    }

    function calculateSwap(
        address fromToken,
        address toToken,
        uint256 amountIn
    ) public view returns (uint256) {
        uint256 fromBalance = fromToken == address(0)
            ? ethBalance
            : tokenBalances[fromToken];
        uint256 toBalance = toToken == address(0)
            ? ethBalance
            : tokenBalances[toToken];

        require(fromBalance > 0 && toBalance > 0, "No liquidity");
        return (amountIn * toBalance) / (fromBalance + amountIn);
    }

    function swap(
        address fromToken,
        address toToken,
        uint256 amountIn
    ) external payable {
        require(fromToken != toToken, "Cannot swap same token");
        require(amountIn > 0, "Invalid amount");

        uint256 amountOut = calculateSwap(fromToken, toToken, amountIn);
        require(amountOut > 0, "Zero output amount");

        if (fromToken == address(0)) {
            require(msg.value == amountIn, "Incorrect ETH sent");
            ethBalance += amountIn;
        } else {
            require(msg.value == 0, "ETH not needed");
            IERC20(fromToken).transferFrom(msg.sender, address(this), amountIn);
            tokenBalances[fromToken] += amountIn;
        }

        if (toToken == address(0)) {
            require(ethBalance >= amountOut, "Insufficient ETH liquidity");
            ethBalance -= amountOut;
            payable(msg.sender).transfer(amountOut);
        } else {
            require(
                tokenBalances[toToken] >= amountOut,
                "Insufficient token liquidity"
            );
            tokenBalances[toToken] -= amountOut;
            IERC20(toToken).transfer(msg.sender, amountOut);
        }

        emit Swapped(msg.sender, fromToken, toToken, amountIn, amountOut);
    }
}
