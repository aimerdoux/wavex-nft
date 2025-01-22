// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WaveXNFT is ERC721, ERC721Enumerable, Ownable {
    // Counter for token IDs
    uint256 private _nextTokenId;

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

    // Mapping from token ID to its benefits
    mapping(uint256 => Benefit[]) private _tokenBenefits;
    
    // Mapping to track merchant addresses
    mapping(address => bool) public authorizedMerchants;

    // Events
    event BenefitAdded(uint256 indexed tokenId, BenefitType benefitType, uint256 value);
    event BenefitRedeemed(uint256 indexed tokenId, BenefitType benefitType, uint256 value);
    event MerchantStatusUpdated(address merchant, bool status);

    constructor() ERC721("WaveX NFT", "WAVEX") Ownable(msg.sender) {}

    // Helper function to check if token exists
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }

    // Minting function
    function mint() public payable returns (uint256) {
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

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

    // Redeem benefit
    function redeemBenefit(
        uint256 tokenId,
        uint256 benefitIndex
    ) external {
        require(_tokenExists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(benefitIndex < _tokenBenefits[tokenId].length, "Benefit index out of bounds");
        
        Benefit storage benefit = _tokenBenefits[tokenId][benefitIndex];
        require(!benefit.isRedeemed, "Benefit already redeemed");
        require(block.timestamp <= benefit.expirationTime, "Benefit expired");

        if (benefit.benefitType == BenefitType.MERCHANT_ALLOWANCE) {
            require(authorizedMerchants[msg.sender], "Not an authorized merchant");
        }

        benefit.isRedeemed = true;
        emit BenefitRedeemed(tokenId, benefit.benefitType, benefit.value);
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