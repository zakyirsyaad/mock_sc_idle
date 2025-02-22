// FactoryToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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

        // // Kirim 10% dari jumlah yang diterima contract ke wallet
        // uint256 fee = _paymentAmount / 10;
        // idleToken.transfer(0xB53F9688e99D34EF93392F88fD01d6E5651d8CfA, fee);

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

    // Fungsi untuk membeli token menggunakan IDLE
    function buyTokens(address _tokenAddress, uint256 _amount) external {
        // Ambil informasi token yang ingin dibeli
        TokenInfo memory tokenInfo = tokenDetails[_tokenAddress];
        require(tokenInfo.owner != address(0), "Token tidak ditemukan");

        // Tentukan harga token dalam IDLE (10 IDLE per 1 token)
        uint256 tokenPrice = 10 * 10 ** 18;

        // Perbaiki perhitungan biaya dengan membagi oleh desimal
        uint256 cost = (_amount * tokenPrice) / 10 ** 18; // Add division by 1e18

        // Add allowance check
        require(
            idleToken.allowance(msg.sender, address(this)) >= cost,
            "IDLE allowance insufficient"
        );
        // Transfer IDLE dari pembeli ke kontrak ini
        idleToken.transferFrom(msg.sender, address(this), cost);

        // Transfer token yang dibeli ke pembeli
        ERC20Token token = ERC20Token(_tokenAddress);
        token.transfer(msg.sender, _amount);
        emit TokensBought(msg.sender, _amount, cost);
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
}
