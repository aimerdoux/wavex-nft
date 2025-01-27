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

    // Events
    event BenefitAdded(uint256 indexed tokenId, BenefitType benefitType, uint256 value);
    event BenefitRedeemed(uint256 indexed tokenId, BenefitType benefitType, uint256 value);
    event TokenURIUpdated(uint256 indexed tokenId, string newURI);

    constructor() ERC721("WaveX NFT", "WAVEX") Ownable(msg.sender) {
        _nextTokenId.increment(); // Start from 1
    }

    // Mint function
    function mint() public payable returns (uint256) {
        require(_nextTokenId.current() <= MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = _nextTokenId.current();
        _safeMint(msg.sender, tokenId);
        _nextTokenId.increment();

        return tokenId;
    }

    // Set individual token URI
    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = uri;
        emit TokenURIUpdated(tokenId, uri);
    }

    // Override tokenURI function
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        // First check for individual token URI
        string memory individualURI = _tokenURIs[tokenId];
        if (bytes(individualURI).length > 0) {
            return individualURI;
        }

        // Fallback to base URI
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? baseURI : "";
    }

    // Set base URI
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // Get base URI
    function getBaseURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    // Base URI
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // Add benefit
    function addBenefit(
        uint256 tokenId,
        BenefitType benefitType,
        uint256 value,
        uint256 durationInDays
    ) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");

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

    // Get benefits
    function getBenefits(uint256 tokenId) external view returns (Benefit[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenBenefits[tokenId];
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