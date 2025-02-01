// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract WaveXEventManager is Ownable {
    struct Event {
        uint256 eventId;
        string name;
        string location;
        uint256 date;
        uint256 maxCapacity;
        uint256 bookedCount;
        bool isActive;
    }

    IERC721 public waveXNFT;  // Reference to the existing WaveXNFT contract
    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(uint256 => bool)) public nftEventBookings;
    mapping(uint256 => uint256) public nftToEvent;
    mapping(uint256 => mapping(uint256 => uint256)) public cancellationCount;
    
    uint256 public _eventCounter;
    uint256 public maxCancellationsAllowed = 1;

    event EventCreated(uint256 indexed eventId, string name, string location, uint256 date, uint256 maxCapacity);
    event EntranceBooked(uint256 indexed tokenId, uint256 indexed eventId);
    event CheckedIn(uint256 indexed tokenId, uint256 indexed eventId);
    event TicketTransferred(uint256 indexed tokenId, uint256 indexed fromEventId, uint256 indexed toEventId);
    event EventExpired(uint256 indexed eventId);
    event TicketCancelled(uint256 indexed tokenId, uint256 indexed eventId);
    event MaxCancellationsUpdated(uint256 newMax);

    constructor(address _waveXNFT) Ownable(msg.sender) {
        waveXNFT = IERC721(_waveXNFT);
    }

    function createEvent(string memory name, string memory location, uint256 date, uint256 maxCapacity) external onlyOwner {
        uint256 eventId = _eventCounter++;
        events[eventId] = Event(eventId, name, location, date, maxCapacity, 0, true);
        emit EventCreated(eventId, name, location, date, maxCapacity);
    }
    
    function getEventCount() public view returns (uint256) {
        return _eventCounter;
    }

    function bookEntrance(uint256 tokenId, uint256 eventId) external {
        require(waveXNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(events[eventId].isActive, "Event not active");
        require(events[eventId].bookedCount < events[eventId].maxCapacity, "Event fully booked");
        require(!nftEventBookings[tokenId][eventId], "Already booked for this event");
        require(cancellationCount[tokenId][eventId] < maxCancellationsAllowed, "Maximum cancellations reached");

        nftEventBookings[tokenId][eventId] = true;
        nftToEvent[tokenId] = eventId;
        events[eventId].bookedCount++;
        
        emit EntranceBooked(tokenId, eventId);
    }

    function cancelBooking(uint256 tokenId, uint256 eventId) external {
        require(waveXNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nftEventBookings[tokenId][eventId], "Not booked for this event");
        require(block.timestamp <= events[eventId].date - 48 hours, "Cancellation window closed");

        nftEventBookings[tokenId][eventId] = false;
        events[eventId].bookedCount--;
        cancellationCount[tokenId][eventId]++;
        
        emit TicketCancelled(tokenId, eventId);
    }

    function checkIn(uint256 tokenId, uint256 eventId) external onlyOwner {
        require(nftEventBookings[tokenId][eventId], "NFT not booked for event");
        require(block.timestamp >= events[eventId].date, "Event not started");
        
        emit CheckedIn(tokenId, eventId);
    }

    function transferTicket(uint256 tokenId, uint256 newEventId) external {
        require(waveXNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(events[newEventId].isActive, "New event not active");
        require(!nftEventBookings[tokenId][newEventId], "Already booked for new event");

        uint256 oldEventId = nftToEvent[tokenId];
        nftEventBookings[tokenId][oldEventId] = false;
        events[oldEventId].bookedCount--;
        nftEventBookings[tokenId][newEventId] = true;
        nftToEvent[tokenId] = newEventId;
        events[newEventId].bookedCount++;

        emit TicketTransferred(tokenId, oldEventId, newEventId);
    }

    function expireEvent(uint256 eventId) external onlyOwner {
        require(events[eventId].isActive, "Event already expired");
        events[eventId].isActive = false;
        emit EventExpired(eventId);
    }

    function getEventDetails(uint256 eventId) external view returns (Event memory) {
        return events[eventId];
    }

    function getCancellationCount(uint256 tokenId, uint256 eventId) external view returns (uint256) {
        return cancellationCount[tokenId][eventId];
    }

    function setMaxCancellationsAllowed(uint256 _newMax) external onlyOwner {
        maxCancellationsAllowed = _newMax;
        emit MaxCancellationsUpdated(_newMax);
    }
}