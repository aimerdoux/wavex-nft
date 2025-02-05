// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract WaveXNFTV2 is ERC721, Pausable, Ownable, ERC721URIStorage {
    using Counters for Counters.Counter;

    // Counter for token IDs
    Counters.Counter private _tokenIds;

    // Template system
    struct Template {
        string name;
        uint256 baseBalance;
        uint256 price;
        bool active;
    }

    // Event structure
    struct Event {
        string name;
        uint256 price;
        uint256 capacity;
        uint256 soldCount;
        bool active;
        uint256 eventType;
    }

    // Transaction structure
    struct Transaction {
        uint256 timestamp;
        address merchant;
        uint256 amount;
        string transactionType; // "PAYMENT" or "TOPUP"
        string metadata;
    }

    // Mapping for templates
    mapping(uint256 => Template) public templates;
    mapping(uint256 => Event) public events;
    mapping(uint256 => uint256) public tokenBalance;
    mapping(uint256 => Transaction[]) public transactions;
    mapping(uint256 => uint256[]) public tokenEvents; // Stores Event IDs per token
    mapping(address => bool) public authorizedMerchants;

    // Supported payment tokens (USDT/USDC)
    mapping(address => bool) public supportedTokens;

    // Events
    event BalanceUpdated(uint256 indexed tokenId, uint256 newBalance, string updateType);
    event EventPurchased(uint256 indexed tokenId, uint256 indexed eventId);
    event TransactionRecorded(uint256 indexed tokenId, string transactionType, uint256 amount);
    event SupportedTokenAdded(address indexed tokenAddress);

    constructor() ERC721("WaveX NFT V2", "WAVEX2") {
        // Initialize with default templates
        _addTemplate(1, "Gold", 2000 ether, 2000 ether, true);
        _addTemplate(2, "Platinum", 5000 ether, 5000 ether, true);
        _addTemplate(3, "Black", 10000 ether, 10000 ether, true);
        _addTemplate(4, "EventBrite", 0, 0, true);
    }

    // Add a supported token
    function addSupportedToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        supportedTokens[tokenAddress] = true;
        emit SupportedTokenAdded(tokenAddress);
    }

    // Add a new template
    function addTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        bool active
    ) external onlyOwner {
        _addTemplate(templateId, name, baseBalance, price, active);
    }

    // Internal function to add a template
    function _addTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        bool active
    ) internal {
        templates[templateId] = Template(name, baseBalance, price, active);
    }

    // Mint a new NFT from a template
    function mintFromTemplate(
        uint256 templateId,
        address to,
        string memory uri
    ) external payable returns (uint256) {
        require(templates[templateId].active, "Template not active");
        require(msg.value >= templates[templateId].price, "Insufficient payment");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        // Set initial balance from template
        tokenBalance[newTokenId] = templates[templateId].baseBalance;

        emit BalanceUpdated(newTokenId, templates[templateId].baseBalance, "MINT");

        return newTokenId;
    }

    // Top up the balance of a token
    function topUpBalance(uint256 tokenId, uint256 amount, address paymentToken) external {
        require(_exists(tokenId), "Token does not exist");
        require(supportedTokens[paymentToken], "Token not supported");

        IERC20 token = IERC20(paymentToken);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        tokenBalance[tokenId] += amount;

        // Record transaction
        transactions[tokenId].push(Transaction({
            timestamp: block.timestamp,
            merchant: address(0), // No merchant for top-ups
            amount: amount,
            transactionType: "TOPUP",
            metadata: ""
        }));

        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "TOPUP");
        emit TransactionRecorded(tokenId, "TOPUP", amount);
    }

    // Process a payment from a token
    function processPayment(
        uint256 tokenId,
        uint256 amount,
        string memory metadata
    ) external {
        require(_exists(tokenId), "Token does not exist");
        require(authorizedMerchants[msg.sender], "Not authorized merchant");
        require(tokenBalance[tokenId] >= amount, "Insufficient balance");

        tokenBalance[tokenId] -= amount;

        // Record transaction
        transactions[tokenId].push(Transaction({
            timestamp: block.timestamp,
            merchant: msg.sender,
            amount: amount,
            transactionType: "PAYMENT",
            metadata: metadata
        }));

        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "PAYMENT");
        emit TransactionRecorded(tokenId, "PAYMENT", amount);
    }

    // Create a new event
    function createEvent(
        string memory name,
        uint256 price,
        uint256 capacity,
        uint256 eventType
    ) external onlyOwner returns (uint256) {
        uint256 eventId = uint256(keccak256(abi.encodePacked(name, block.timestamp)));
        events[eventId] = Event(name, price, capacity, 0, true, eventType);
        return eventId;
    }

    // Purchase entrance to an event
    function purchaseEventEntrance(uint256 tokenId, uint256 eventId) external {
        require(_exists(tokenId), "Token does not exist");
        require(events[eventId].active, "Event not active");
        require(events[eventId].soldCount < events[eventId].capacity, "Event full");
        require(tokenBalance[tokenId] >= events[eventId].price, "Insufficient balance");

        tokenBalance[tokenId] -= events[eventId].price;
        events[eventId].soldCount++;
        tokenEvents[tokenId].push(eventId);

        emit EventPurchased(tokenId, eventId);
        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "EVENT_PURCHASE");
    }

    // Authorize a merchant
    function authorizeMerchant(address merchant) external onlyOwner {
        authorizedMerchants[merchant] = true;
    }

    // Revoke a merchant's authorization
    function revokeMerchant(address merchant) external onlyOwner {
        authorizedMerchants[merchant] = false;
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // Add the supportsInterface override
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Utility functions
    function getTransactionCount(uint256 tokenId) external view returns (uint256) {
        return transactions[tokenId].length;
    }

    function getTransaction(uint256 tokenId, uint256 index) external view returns (
        uint256 timestamp,
        address merchant,
        uint256 amount,
        string memory transactionType,
        string memory metadata
    ) {
        Transaction memory txn = transactions[tokenId][index];
        return (txn.timestamp, txn.merchant, txn.amount, txn.transactionType, txn.metadata);
    }

    function getTokenEvents(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenEvents[tokenId];
    }
}