// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ERC20Token.sol"; // Import ERC20Token contract

contract FactoryToken is Ownable(msg.sender) {
    uint256 constant FIXED_TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18; // 1B dengan 18 desimal
    IERC20 public idleToken; // Alamat kontrak IDLE

    // Struktur untuk menyimpan informasi token yang dibuat
    struct TokenInfo {
        string name;
        string ticker;
        string iconURL;
        string description;
        string Twitter; // New field for Twitter
        string Website; // New field for Website
        // string Telegram; // New field for Telegram
        string Behavior;
        uint256 createdAt; // Updated field name from Timestamp to createdAt
        address owner;
        uint256 totalSupply;
        address tokenAddress;
    }

    TokenInfo[] public tokens;
    mapping(address => TokenInfo) public tokenDetails;

    event TokenCreated(
        address indexed owner,
        address indexed tokenAddress,
        string name,
        string ticker,
        uint256 totalSupply
    );

    event TokensBought(address indexed buyer, uint256 amount, uint256 cost);

    // Inisialisasi alamat kontrak IDLE saat deploy FactoryToken
    constructor(address _idleTokenAddress) {
        idleToken = IERC20(_idleTokenAddress);
    }

    // Fungsi untuk membuat token baru dengan pembayaran menggunakan IDLE
    function createTokenWithPayment(
        string memory _name,
        string memory _ticker,
        string memory _iconURL,
        string memory _description,
        string memory _Twitter,
        string memory _Website,
        // string memory _Telegram,
        string memory _Behavior,
        uint256 _paymentAmount
    ) external {
        // Add allowance check
        require(
            idleToken.allowance(msg.sender, address(this)) >= _paymentAmount,
            "IDLE allowance insufficient"
        );
        // Verifikasi bahwa pengirim memiliki cukup saldo IDLE
        require(
            idleToken.balanceOf(msg.sender) >= _paymentAmount,
            "Saldo IDLE tidak cukup"
        );
        // Transfer full payment amount from user to contract
        idleToken.transferFrom(msg.sender, address(this), _paymentAmount);

        // Hitung jumlah token yang akan diberikan kepada pengguna
        uint256 tokensPerIDLE = 100_000; // 100.000 token per 1 IDLE
        uint256 amountOfTokens = _paymentAmount * tokensPerIDLE; // Jumlah token yang diterima

        // Deploy token baru dengan supply ke factory contract
        ERC20Token newToken = new ERC20Token(
            _name,
            _ticker,
            FIXED_TOTAL_SUPPLY,
            address(this)
        );
        address tokenAddr = address(newToken);

        // Simpan informasi token
        TokenInfo memory newTokenInfo = TokenInfo({
            name: _name,
            ticker: _ticker,
            iconURL: _iconURL,
            description: _description,
            Twitter: _Twitter,
            Website: _Website,
            // Telegram: _Telegram,
            Behavior: _Behavior,
            createdAt: block.timestamp,
            owner: msg.sender,
            totalSupply: FIXED_TOTAL_SUPPLY,
            tokenAddress: tokenAddr
        });

        tokens.push(newTokenInfo);
        tokenDetails[tokenAddr] = newTokenInfo;

        // Transfer token yang baru dibuat kepada pengguna
        newToken.transfer(msg.sender, amountOfTokens); // Transfer sesuai dengan jumlah yang dihitung

        // Transfer token yang baru dibuat kepada Dev
        newToken.transfer(
            0xB53F9688e99D34EF93392F88fD01d6E5651d8CfA,
            (amountOfTokens)
        );

        emit TokenCreated(
            msg.sender,
            tokenAddr,
            _name,
            _ticker,
            FIXED_TOTAL_SUPPLY
        );
    }

    // Fungsi untuk mengambil semua token yang telah dibuat
    function getAllTokens() external view returns (TokenInfo[] memory) {
        return tokens;
    }

    // Fungsi untuk mengambil informasi token berdasarkan alamatnya
    function getTokenByAddress(
        address _tokenAddress
    ) external view returns (TokenInfo memory) {
        return tokenDetails[_tokenAddress];
    }

    // Fungsi untuk mengambil informasi token berdasarkan indeksnya
    function getTokenByIndex(
        uint256 _index
    ) external view returns (TokenInfo memory) {
        require(_index < tokens.length, "Invalid index");
        return tokens[_index];
    }

    // Fungsi baca untuk menghitung jumlah token yang didapat dari swap
    function calculateSwap(
        address fromToken,
        address toToken,
        uint256 amountIn
    ) public view returns (uint256 amountOut) {
        require(fromToken != toToken, "Cannot swap same token");

        uint256 reserveFrom = IERC20(fromToken).balanceOf(address(this));
        uint256 reserveTo = IERC20(toToken).balanceOf(address(this));
        require(reserveFrom > 0 && reserveTo > 0, "Insufficient liquidity");

        // Sederhana: tidak ada fee, gunakan proporsi cadangan
        amountOut = (amountIn * reserveTo) / (reserveFrom + amountIn);
    }

    // Fungsi tulis untuk melakukan swap antar token
    function swapToken(
        address fromToken,
        address toToken,
        uint256 amountIn
    ) external {
        require(fromToken != toToken, "Cannot swap same token");
        require(amountIn > 0, "Amount must be greater than zero");

        IERC20 from = IERC20(fromToken);
        IERC20 to = IERC20(toToken);

        uint256 reserveFrom = from.balanceOf(address(this));
        uint256 reserveTo = to.balanceOf(address(this));
        require(reserveFrom > 0 && reserveTo > 0, "Insufficient liquidity");

        uint256 amountOut = (amountIn * reserveTo) / (reserveFrom + amountIn);
        require(amountOut > 0, "Amount too low");

        // Transfer token dari pengguna ke kontrak
        require(
            from.allowance(msg.sender, address(this)) >= amountIn,
            "Allowance too low"
        );
        from.transferFrom(msg.sender, address(this), amountIn);

        // Transfer token hasil swap ke pengguna
        to.transfer(msg.sender, amountOut);
    }
}
