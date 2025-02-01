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

    struct Booking {
        bool isActive;
        uint256 eventId;
        uint256 entranceNumber;
    }

    IERC721 public waveXNFT;  // Reference to the existing WaveXNFT contract
    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(uint256 => bool)) public nftEventBookings;
    // Track multiple bookings per token
    mapping(uint256 => Booking[]) public tokenBookings;
    mapping(uint256 => uint256) public tokenEntrancesAvailable;
    mapping(uint256 => mapping(uint256 => uint256)) public cancellationCount;
    
    uint256 public _eventCounter;
    uint256 public maxCancellationsAllowed = 1;

    event EventCreated(uint256 indexed eventId, string name, string location, uint256 date, uint256 maxCapacity);
    event EntranceBooked(uint256 indexed tokenId, uint256 indexed eventId, uint256 entranceNumber);
    event CheckedIn(uint256 indexed tokenId, uint256 indexed eventId, uint256 entranceNumber);
    event TicketTransferred(uint256 indexed tokenId, uint256 indexed fromEventId, uint256 indexed toEventId);
    event EventExpired(uint256 indexed eventId);
    event TicketCancelled(uint256 indexed tokenId, uint256 indexed eventId, uint256 entranceNumber);
    event MaxCancellationsUpdated(uint256 newMax);
    event EntrancesSet(uint256 indexed tokenId, uint256 entrances);

    constructor(address _waveXNFT) Ownable(msg.sender) {
        waveXNFT = IERC721(_waveXNFT);
    }

    function setTokenEntrances(uint256 tokenId, uint256 entrances) external onlyOwner {
        tokenEntrancesAvailable[tokenId] = entrances;
        emit EntrancesSet(tokenId, entrances);
    }

    function getAvailableEntrances(uint256 tokenId) public view returns (uint256) {
        uint256 totalEntrances = tokenEntrancesAvailable[tokenId];
        uint256 usedEntrances = 0;
        for (uint i = 0; i < tokenBookings[tokenId].length; i++) {
            if (tokenBookings[tokenId][i].isActive) {
                usedEntrances++;
            }
        }
        return totalEntrances - usedEntrances;
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
        require(getAvailableEntrances(tokenId) > 0, "No available entrances");
        require(cancellationCount[tokenId][eventId] < maxCancellationsAllowed, "Maximum cancellations reached");

        uint256 entranceNumber = tokenBookings[tokenId].length;
        tokenBookings[tokenId].push(Booking(true, eventId, entranceNumber));
        nftEventBookings[tokenId][eventId] = true;
        events[eventId].bookedCount++;
        
        emit EntranceBooked(tokenId, eventId, entranceNumber);
    }

    function cancelBooking(uint256 tokenId, uint256 eventId, uint256 entranceNumber) external {
        require(waveXNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(entranceNumber < tokenBookings[tokenId].length, "Invalid entrance number");
        require(tokenBookings[tokenId][entranceNumber].isActive, "Booking not active");
        require(tokenBookings[tokenId][entranceNumber].eventId == eventId, "Incorrect event ID");
        require(block.timestamp <= events[eventId].date - 48 hours, "Cancellation window closed");

        tokenBookings[tokenId][entranceNumber].isActive = false;
        events[eventId].bookedCount--;
        cancellationCount[tokenId][eventId]++;
        
        // Only remove the general booking if no other entrances are booked for this event
        bool hasOtherBookings = false;
        for (uint i = 0; i < tokenBookings[tokenId].length; i++) {
            if (i != entranceNumber && 
                tokenBookings[tokenId][i].isActive && 
                tokenBookings[tokenId][i].eventId == eventId) {
                hasOtherBookings = true;
                break;
            }
        }
        if (!hasOtherBookings) {
            nftEventBookings[tokenId][eventId] = false;
        }
        
        emit TicketCancelled(tokenId, eventId, entranceNumber);
    }

    function checkIn(uint256 tokenId, uint256 eventId, uint256 entranceNumber) external onlyOwner {
        require(entranceNumber < tokenBookings[tokenId].length, "Invalid entrance number");
        require(tokenBookings[tokenId][entranceNumber].isActive, "Booking not active");
        require(tokenBookings[tokenId][entranceNumber].eventId == eventId, "Incorrect event ID");
        require(block.timestamp >= events[eventId].date, "Event not started");
        
        emit CheckedIn(tokenId, eventId, entranceNumber);
    }

    function getTokenBookings(uint256 tokenId) external view returns (Booking[] memory) {
        return tokenBookings[tokenId];
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