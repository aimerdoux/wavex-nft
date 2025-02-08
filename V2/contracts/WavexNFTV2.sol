// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract WaveXNFTV2 is ERC721URIStorage, Pausable, Ownable {
    using Counters for Counters.Counter;

    // Counter for token IDs
    Counters.Counter private _tokenIds;
    // Counter for template IDs
    Counters.Counter private _templateIds;

    // Template system
    struct Template {
        string name;
        uint256 baseBalance;
        uint256 price;
        uint256 discount;      // Added for discount percentages
        bool isVIP;           // Added for VIP access
        string metadataURI;   // Added for template-specific metadata
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
    event TemplateUpdated(
        uint256 indexed templateId,
        string name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string metadataURI,
        bool active
    );
    event TemplateCreated(
        uint256 indexed templateId,
        string name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string metadataURI,
        bool active
    );

    constructor() ERC721("WaveX NFT V2", "WAVEX2") Ownable() {
        // Contract starts unpaused
        // Templates will be initialized later
    }

    // Initialize default templates (to be called after deployment)
    function initializeDefaultTemplates() external onlyOwner {
        require(templates[1].baseBalance == 0, "Templates already initialized");
        
        // Add default templates
        _addTemplate(1, "Gold", 1 ether, 1 ether, 0, false, "", true);
        _addTemplate(2, "Platinum", 2 ether, 2 ether, 0, false, "", true);
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
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) external onlyOwner {
        _addTemplate(templateId, name, baseBalance, price, discount, isVIP, metadataURI, active);
    }

    // Internal function to add a template
    function _addTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) internal {
        require(templateId > 0, "Invalid template ID");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(discount <= 100, "Invalid discount percentage");
        require(templates[templateId].baseBalance == 0, "Template already exists");

        templates[templateId] = Template(
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );

        // Update template counter if needed
        if (templateId > _templateIds.current()) {
            _templateIds.increment();
        }

        emit TemplateCreated(
            templateId,
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );
    }

    // Get template count
    function getTemplateCount() external view returns (uint256) {
        return _templateIds.current();
    }

    // Modify an existing template
    function modifyTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) external onlyOwner {
        require(templateId > 0, "Invalid template ID");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(discount <= 100, "Invalid discount percentage");

        templates[templateId] = Template(
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );

        emit TemplateUpdated(
            templateId,
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );
    }

    // Get template details
    function getTemplate(uint256 templateId) external view returns (
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) {
        Template memory template = templates[templateId];
        require(bytes(template.name).length > 0, "Template does not exist");
        return (
            template.name,
            template.baseBalance,
            template.price,
            template.discount,
            template.isVIP,
            template.metadataURI,
            template.active
        );
    }

    // Mint a new NFT from a template
    function mintFromTemplate(
        uint256 templateId,
        address to,
        string memory uri
    ) external payable whenNotPaused returns (uint256) {
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
    function topUpBalance(uint256 tokenId, uint256 amount, address paymentToken) external whenNotPaused {
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
    ) external whenNotPaused {
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
    ) external onlyOwner whenNotPaused returns (uint256) {
        uint256 eventId = uint256(keccak256(abi.encodePacked(name, block.timestamp)));
        events[eventId] = Event(name, price, capacity, 0, true, eventType);
        return eventId;
    }

    // Purchase entrance to an event
    function purchaseEventEntrance(uint256 tokenId, uint256 eventId) external whenNotPaused {
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

    // Pause contract
    function pause() external onlyOwner {
        _pause();
    }

    // Unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // Add the supportsInterface override
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
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