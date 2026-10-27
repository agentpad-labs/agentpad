// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PadMarket — marketplace on-chain hari-1 (pola NONCE).
/// Harga dalam USDT (18 des), fee 2% ke treasury, sisanya ke penjual.
contract PadMarket is Ownable, ReentrancyGuard {
    IERC721 public immutable nft;
    IERC20 public immutable usdt;
    address public treasury;
    uint96 public constant FEE_BPS = 200; // 2%

    struct Listing {
        address seller;
        uint256 price;      // dalam USDT (18 desimal)
        uint256 expiry;     // absolut epoch
        uint256 nonce;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public nonces;

    event Listed(uint256 indexed id, address indexed seller, uint256 price, uint256 expiry, uint256 nonce);
    event Cancelled(uint256 indexed id, uint256 nonce);
    event Sold(uint256 indexed id, address seller, address buyer, uint256 price, uint256 fee);

    error BadOwnershipOrInput();
    error NotApproved();
    error NotActive();
    error PaymentFailed();

    constructor(address nft_, address usdt_, address treasury_) Ownable(msg.sender) {
        nft = IERC721(nft_);
        usdt = IERC20(usdt_);
        treasury = treasury_;
    }

    function list(uint256 id, uint256 price, uint256 expiry) external nonReentrant {
        require(nft.ownerOf(id) == msg.sender && price >= 100 && expiry > block.timestamp, "listing");
        require(nft.getApproved(id) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "approve NFT first");
        uint256 nonce = ++nonces[id];
        listings[id] = Listing(msg.sender, price, expiry, nonce, true);
        emit Listed(id, msg.sender, price, expiry, nonce);
    }

    function cancel(uint256 id) external nonReentrant {
        require(listings[id].seller == msg.sender || nft.ownerOf(id) == msg.sender, "seller / owner");
        delete listings[id];
        emit Cancelled(id, ++nonces[id]);
    }

    function buy(uint256 id) external nonReentrant {
        Listing memory l = listings[id];
        require(l.active && l.expiry > block.timestamp, "not active");
        delete listings[id];

        uint256 fee = (l.price * FEE_BPS) / 10000;
        // deployer = proxy ke treasury; tarik USDT dari pembeli
        if (!usdt.transferFrom(msg.sender, treasury, fee)) revert PaymentFailed();
        if (!usdt.transferFrom(msg.sender, l.seller, l.price - fee)) revert PaymentFailed();
        nft.transferFrom(l.seller, msg.sender, id);
        emit Sold(id, l.seller, msg.sender, l.price, fee);
    }

    function setTreasury(address t) external onlyOwner {
        treasury = t;
    }
}
