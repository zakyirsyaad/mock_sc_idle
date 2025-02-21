// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FactoryToken is Ownable(msg.sender) {
    uint256 constant FIXED_TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18; // 1B dengan 18 desimal
    IERC20 public idleToken; // Alamat kontrak IDLE

    // Struktur untuk menyimpan informasi token yang dibuat
    struct TokenInfo {
        string name;
        string ticker;
        string iconURL;
        string description;
        string socialMedia;
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
        string memory _socialMedia,
        uint256 _paymentAmount
    ) external {
        // Verifikasi bahwa pengirim memiliki cukup saldo IDLE
        require(
            idleToken.balanceOf(msg.sender) >= _paymentAmount,
            "Saldo IDLE tidak cukup"
        );

        // Transfer IDLE dari pengirim ke kontrak ini
        idleToken.transferFrom(msg.sender, address(this), _paymentAmount);

        // Deploy token baru
        ERC20Token newToken = new ERC20Token(
            _name,
            _ticker,
            FIXED_TOTAL_SUPPLY,
            msg.sender
        );
        address tokenAddr = address(newToken);

        // Simpan informasi token
        TokenInfo memory newTokenInfo = TokenInfo({
            name: _name,
            ticker: _ticker,
            iconURL: _iconURL,
            description: _description,
            socialMedia: _socialMedia,
            owner: msg.sender,
            totalSupply: FIXED_TOTAL_SUPPLY,
            tokenAddress: tokenAddr
        });

        tokens.push(newTokenInfo);
        tokenDetails[tokenAddr] = newTokenInfo;

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

        // Tentukan harga token dalam IDLE
        uint256 tokenPrice = 10 * 10 ** 18; // Asumsikan 1 token = 10 IDLE

        // Hitung biaya pembelian token
        uint256 cost = _amount * tokenPrice;

        // Verifikasi bahwa pembeli memiliki cukup saldo IDLE
        require(
            idleToken.balanceOf(msg.sender) >= cost,
            "Saldo IDLE tidak cukup"
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

// ERC20 Token untuk dibuat oleh Factory
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
