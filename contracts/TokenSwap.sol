// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSwap is Ownable(msg.sender) {
    struct Pair {
        uint256 rate; // Rate of token2 per token1
        uint256 liquidity1;
        uint256 liquidity2;
    }

    mapping(address => mapping(address => Pair)) public pairs;

    event Swap(
        address indexed swapper,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event PairAdded(address token1, address token2, uint256 rate);
    event LiquidityAdded(
        address token1,
        address token2,
        uint256 amount1,
        uint256 amount2
    );

    function addPair(address token1, address token2, uint256 rate) public {
        require(pairs[token1][token2].rate == 0, "Pair already exists");
        pairs[token1][token2] = Pair(rate, 0, 0);
        emit PairAdded(token1, token2, rate);
    }

    function addLiquidity(
        address token1,
        address token2,
        uint256 amount1,
        uint256 amount2
    ) external onlyOwner {
        IERC20(token1).transferFrom(msg.sender, address(this), amount1);
        IERC20(token2).transferFrom(msg.sender, address(this), amount2);
        pairs[token1][token2].liquidity1 += amount1;
        pairs[token1][token2].liquidity2 += amount2;
        emit LiquidityAdded(token1, token2, amount1, amount2);
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external {
        Pair storage pair = pairs[tokenIn][tokenOut];
        require(pair.rate > 0, "Pair does not exist");
        uint256 amountOut = (amountIn * pair.rate) / (10 ** 18);
        require(pair.liquidity2 >= amountOut, "Insufficient liquidity");

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        pair.liquidity1 += amountIn;
        pair.liquidity2 -= amountOut;

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
}
