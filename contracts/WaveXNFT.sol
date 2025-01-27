// contracts/WaveXNFT.sol
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

    // Base URI for metadata
    string private _baseTokenURI;

    // Individual token URIs
    mapping(uint256 => string) private _tokenURIs;

    // Mapping from token ID to its benefits
    mapping(uint256 => Benefit[]) private _tokenBenefits;

    // Mapping to track merchant addresses
    mapping(address => bool) public authorizedMerchants;

    // Events
    event BenefitAdded(uint256 indexed tokenId, BenefitType benefitType, uint256 value);
    event BenefitRedeemed(uint256 indexed tokenId, BenefitType benefitType, uint256 value);
    event MerchantStatusUpdated(address merchant, bool status);
    event TokenURIUpdated(uint256 indexed tokenId, string newURI);

    constructor() ERC721("WaveX NFT", "WAVEX") Ownable(msg.sender) {
        _nextTokenId.increment(); // Start from 1
    }

    // Helper function to check if token exists
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }

    // Set individual token URI
    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        require(_tokenExists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = uri;
        emit TokenURIUpdated(tokenId, uri);
    }

    // Override tokenURI function
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_tokenExists(tokenId), "Token does not exist");

        // First check for individual token URI
        string memory individualURI = _tokenURIs[tokenId];
        if (bytes(individualURI).length > 0) {
            return individualURI;
        }

        // Fallback to base URI
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? baseURI : "";
    }

    // Mint function
    function mint() public payable returns (uint256) {
        require(_nextTokenId.current() <= MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId.current();
        _safeMint(msg.sender, tokenId);
        _nextTokenId.increment();

        return tokenId;
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

    // Redeem benefit with optional partial redemption
    function redeemBenefit(
        uint256 tokenId,
        uint256 benefitIndex,
        uint256 amount
    ) external {
        require(_tokenExists(tokenId), "Token does not exist");
        require(benefitIndex < _tokenBenefits[tokenId].length, "Benefit index out of bounds");
        
        Benefit storage benefit = _tokenBenefits[tokenId][benefitIndex];
        
        if (benefit.benefitType == BenefitType.MERCHANT_ALLOWANCE) {
            require(authorizedMerchants[msg.sender], "Not an authorized merchant");
        } else {
            require(ownerOf(tokenId) == msg.sender, "Not token owner");
        }

        require(!benefit.isRedeemed, "Benefit already redeemed");
        require(block.timestamp <= benefit.expirationTime, "Benefit expired");

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

    // Get benefits for a token
    function getBenefits(uint256 tokenId) external view returns (Benefit[] memory) {
        require(_tokenExists(tokenId), "Token does not exist");
        return _tokenBenefits[tokenId];
    }

    // Manage merchants
    function setMerchantStatus(address merchant, bool status) external onlyOwner {
        authorizedMerchants[merchant] = status;
        emit MerchantStatusUpdated(merchant, status);
    }

    // Base URI functions
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // Get base URI
    function getBaseURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    // Required overrides
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