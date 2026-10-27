// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Genesis Passport — keping "agent-earned" ala NONCE, profil ringan.
/// Mint gratis, kuota lifetime 2/wallet, pintu Agent ID, server-sign auth 1x-pakai.
contract GenesisPassport is ERC721, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint256 public constant MAX_SUPPLY = 7777;
    uint256 public constant MAX_PER_WALLET = 2;

    address public signer;          // signer pad (terbit MintAuthorization)
    address public agentRegistry;   // registry Binance Agent ID (0x60B9…022F)
    IERC20 public usdt;             // pembayaran mint ke-2
    address public treasury;        // tujuan pembayaran
    uint256 public constant PAID_PRICE = 0.5 ether; // 0,5 USDT (18 des)
    uint256 public totalMinted;
    uint256 public challengeEpoch;  // bump = invalidasi auth lama
    mapping(address => uint256) public mintedByWallet;
    mapping(bytes32 => bool) public usedAuth;

    event PassportMinted(address indexed to, uint256 indexed tokenId, bytes32 authHash);
    event SignerChanged(address oldSigner, address newSigner);

    error SoldOut();
    error QuotaReached();
    error NotAgentHolder();
    error BadAuth();
    error AuthUsed();
    error PaymentFailed();

    constructor(address initialSigner_, address agentRegistry_, address usdt_, address treasury_)
        ERC721("Agent Pad Genesis", "PASG")
        Ownable(msg.sender)
    {
        signer = initialSigner_;
        agentRegistry = agentRegistry_;
        usdt = IERC20(usdt_);
        treasury = treasury_;
    }

    // ---- ABI registry Agent ID (minimal, 2 fungsi yang dipakai NONCE-gate)
    function _isAgentHolder(address w) internal view returns (bool) {
        // registry SPACE ID Agent ID: balanceOf(w) > 0 = punya entitas terikat
        try this._registryBalance(w) returns (uint256 b) {
            return b > 0;
        } catch { return true; } // registry gak sesuai ABI → jangan blokir (fail-open saat dev)
    }

    function _registryBalance(address w) external view returns (uint256) {
        (bool ok, bytes memory ret) = agentRegistry.staticcall(
            abi.encodeWithSignature("balanceOf(address)", w)
        );
        if (!ok || ret.length < 32) revert NotAgentHolder();
        return abi.decode(ret, (uint256));
    }

    /// auth = hash keccak(abi.encodePacked(wallet, tokenId-free epoch, challengeEpoch, promptId))
    function mint(
        uint256 epoch,
        uint256 promptId,
        bytes calldata signature
    ) external {
        if (totalMinted + 1 > MAX_SUPPLY) revert SoldOut();
        if (mintedByWallet[msg.sender] >= MAX_PER_WALLET) revert QuotaReached();
        if (epoch != challengeEpoch) revert BadAuth();

        bytes32 authHash = keccak256(
            abi.encodePacked(msg.sender, epoch, promptId, address(this), block.chainid)
        );
        if (usedAuth[authHash]) revert AuthUsed();
        address rec = authHash.recover(signature); // ttd langsung atas digest (pola NONCE)
        if (rec != signer) revert BadAuth();

        usedAuth[authHash] = true;
        if (!_isAgentHolder(msg.sender)) revert NotAgentHolder();

        uint256 tid = ++totalMinted; // tokenId 1..7777
        mintedByWallet[msg.sender] += 1;
        _mint(msg.sender, tid);
        emit PassportMinted(msg.sender, tid, authHash);
    }

    /// @notice mint ke-2: bayar 0,5 USDT, gak butuh signature (kuota total tetap 2)
    function mintPaid() external {
        if (totalMinted + 1 > MAX_SUPPLY) revert SoldOut();
        if (mintedByWallet[msg.sender] >= MAX_PER_WALLET) revert QuotaReached();
        if (!usdt.transferFrom(msg.sender, treasury, PAID_PRICE)) revert PaymentFailed();
        mintedByWallet[msg.sender] += 1;
        uint256 tid = ++totalMinted;
        _mint(msg.sender, tid);
    }

    // ---- admin
    function setSigner(address s) external onlyOwner {
        emit SignerChanged(signer, s);
        signer = s;
    }
    function bumpEpoch() external onlyOwner {
        challengeEpoch += 1;
    }
    function setAgentRegistry(address r) external onlyOwner {
        agentRegistry = r;
    }
    function setTreasury(address t) external onlyOwner {
        treasury = t;
    }
}
