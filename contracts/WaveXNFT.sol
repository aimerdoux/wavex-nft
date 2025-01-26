// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract WaveXNFT is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _nextTokenId;

    // Benefit types
    enum BenefitType { MERCHANT_ALLOWANCE, YACHT_EVENT, DISCOUNT }

    // Benefit structure
    struct Benefit {
        BenefitType benefitType;
        uint256 value;
        uint256 expirationTime;
        bool isRedeemed;
    }

    // Maximum supply of NFTs
    uint256 public constant MAX_SUPPLY = 10000;

    // Batch minting configuration
    uint256 public constant MAX_BATCH_MINT = 20;

    // Base URI for metadata
    string private _baseTokenURI;

    // Mapping from token ID to its benefits
    mapping(uint256 => Benefit[]) private _tokenBenefits;

    // Mapping to track merchant addresses
    mapping(address => bool) public authorizedMerchants;

    // Events
    event BenefitAdded(uint256 indexed tokenId, BenefitType benefitType, uint256 value);
    event BenefitModified(uint256 indexed tokenId, uint256 indexed benefitIndex, uint256 newValue, uint256 newExpiration);
    event BenefitRedeemed(uint256 indexed tokenId, BenefitType benefitType, uint256 value);
    event MerchantStatusUpdated(address merchant, bool status);
    event BatchMinted(address indexed minter, uint256[] tokenIds);

    constructor() ERC721("WaveX NFT", "WAVEX") Ownable(msg.sender) {
        _nextTokenId.increment(); // Start from 1
    }

    // Helper function to check if token exists
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }

    // Minting function
    function mint() public payable returns (uint256) {
        require(_nextTokenId.current() <= MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = _nextTokenId.current();
        _safeMint(msg.sender, tokenId);
        _nextTokenId.increment();

        return tokenId;
    }

    // Batch mint multiple NFTs in a single transaction
    function batchMint(uint256 numberOfTokens) public payable returns (uint256[] memory) {
        require(numberOfTokens > 0, "Must mint at least one token");
        require(numberOfTokens <= MAX_BATCH_MINT, "Exceeds max batch mint limit");
        require(_nextTokenId.current() + numberOfTokens - 1 <= MAX_SUPPLY, "Exceeds max supply");

        uint256[] memory mintedTokenIds = new uint256[](numberOfTokens);

        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 tokenId = _nextTokenId.current();
            _safeMint(msg.sender, tokenId);
            mintedTokenIds[i] = tokenId;
            _nextTokenId.increment();
        }

        emit BatchMinted(msg.sender, mintedTokenIds);
        return mintedTokenIds;
    }

    // Returns the current token ID counter
    function getCurrentTokenId() public view returns (uint256) {
        return _nextTokenId.current() - 1;
    }

    // Add benefit to a token
    function addBenefit(
        uint256 tokenId,
        BenefitType benefitType,
        uint256 value,
        uint256 durationInDays
    ) external onlyOwner {
        require(_tokenExists(tokenId), "Token does not exist");

        uint256 expirationTime = block.timestamp + (durationInDays * 1 days);

        Benefit memory newBenefit = Benefit({
            benefitType: benefitType,
            value: value,
            expirationTime: expirationTime,
            isRedeemed: false
        });

        _tokenBenefits[tokenId].push(newBenefit);

        emit BenefitAdded(tokenId, benefitType, value);
    }

    // Modify an existing benefit
    function modifyBenefit(
        uint256 tokenId,
        uint256 benefitIndex,
        uint256 newValue,
        uint256 durationInDays
    ) external onlyOwner {
        require(_tokenExists(tokenId), "Token does not exist");
        require(benefitIndex < _tokenBenefits[tokenId].length, "Benefit index out of bounds");

        Benefit storage benefit = _tokenBenefits[tokenId][benefitIndex];
        require(!benefit.isRedeemed, "Cannot modify redeemed benefit");

        // Update benefit values
        benefit.value = newValue;
        benefit.expirationTime = block.timestamp + (durationInDays * 1 days);

        emit BenefitModified(tokenId, benefitIndex, newValue, benefit.expirationTime);
    }

    // Redeem benefit with optional partial redemption
    function redeemBenefit(
        uint256 tokenId,
        uint256 benefitIndex,
        uint256 amount
    ) external {
        require(_tokenExists(tokenId), "Token does not exist");

        // For MERCHANT_ALLOWANCE, allow merchants to redeem
        Benefit storage benefit = _tokenBenefits[tokenId][benefitIndex];

        if (benefit.benefitType == BenefitType.MERCHANT_ALLOWANCE) {
            require(authorizedMerchants[msg.sender], "Not an authorized merchant");
        } else {
            require(ownerOf(tokenId) == msg.sender, "Not token owner");
        }

        require(benefitIndex < _tokenBenefits[tokenId].length, "Benefit index out of bounds");
        require(!benefit.isRedeemed, "Benefit already redeemed");
        require(block.timestamp <= benefit.expirationTime, "Benefit expired");

        // Partial redemption logic for MERCHANT_ALLOWANCE
        if (benefit.benefitType == BenefitType.MERCHANT_ALLOWANCE) {
            uint256 redeemAmount = amount == 0 ? benefit.value : amount;
            require(redeemAmount <= benefit.value, "Insufficient allowance");

            benefit.value -= redeemAmount;
            if (benefit.value == 0) {
                benefit.isRedeemed = true;
            }
        } else {
            benefit.isRedeemed = true;
        }

        emit BenefitRedeemed(tokenId, benefit.benefitType, amount);
    }

    // Manage merchants
    function setMerchantStatus(address merchant, bool status) external onlyOwner {
        authorizedMerchants[merchant] = status;
        emit MerchantStatusUpdated(merchant, status);
    }

    // Get benefits for a token
    function getBenefits(uint256 tokenId) external view returns (Benefit[] memory) {
        require(_tokenExists(tokenId), "Token does not exist");
        return _tokenBenefits[tokenId];
    }

    // Base URI
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // Override functions to resolve inheritance conflicts
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
