// test/WaveXEventManager.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { BenefitType } = require("../scripts/utils/benefitTypes");  

describe("WaveXEventManager", function () {
    let waveXNFT;
    let eventManager;
    let owner;
    let user1;
    let user2;
    let futureDate;

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy WaveXNFT first
        const WaveXNFT = await ethers.getContractFactory("WaveXNFT");
        waveXNFT = await WaveXNFT.deploy();
        await waveXNFT.waitForDeployment();

        // Deploy EventManager with WaveXNFT address
        const WaveXEventManager = await ethers.getContractFactory("WaveXEventManager");
        eventManager = await WaveXEventManager.deploy(await waveXNFT.getAddress());
        await eventManager.waitForDeployment();

        // Set future date for events (2 days from now)
        const currentTime = await time.latest();
        futureDate = currentTime + 172800; // 48 hours from now
    });

    describe("Event Creation", function () {
        it("should allow owner to create an event", async function () {
            const eventName = "Tech Conference 2024";
            const location = "Virtual";
            const maxCapacity = 100;

            const tx = await eventManager.createEvent(eventName, location, futureDate, maxCapacity);
            await tx.wait();

            const eventDetails = await eventManager.getEventDetails(0);
            expect(eventDetails.name).to.equal(eventName);
            expect(eventDetails.location).to.equal(location);
            expect(eventDetails.date).to.equal(futureDate);
            expect(eventDetails.maxCapacity).to.equal(maxCapacity);
            expect(eventDetails.bookedCount).to.equal(0);
            expect(eventDetails.isActive).to.be.true;
        });

        it("should not allow non-owner to create an event", async function () {
            await expect(
                eventManager.connect(user1).createEvent("Test Event", "Location", futureDate, 100)
            ).to.be.revertedWithCustomError(eventManager, "OwnableUnauthorizedAccount");
        });
    });

    describe("Entrance Booking", function () {
        beforeEach(async function () {
            // Create an event
            await eventManager.createEvent("Test Event", "Location", futureDate, 100);
            
            // Mint an NFT for user1
            await waveXNFT.connect(user1).mint();
        });

        it("should allow NFT holder to book entrance", async function () {
            const tokenId = 1; // First minted NFT
            const tx = await eventManager.connect(user1).bookEntrance(tokenId, 0);
            await tx.wait();

            const eventDetails = await eventManager.getEventDetails(0);
            expect(eventDetails.bookedCount).to.equal(1);

            // Check if the booking was recorded using the mapping
            expect(await eventManager.nftEventBookings(tokenId, 0)).to.be.true;
        });

        it("should not allow booking with non-owned NFT", async function () {
            await expect(
                eventManager.connect(user2).bookEntrance(1, 0)
            ).to.be.revertedWith("Not token owner");
        });

        it("should not allow double booking", async function () {
            await eventManager.connect(user1).bookEntrance(1, 0);
            await expect(
                eventManager.connect(user1).bookEntrance(1, 0)
            ).to.be.revertedWith("Already booked for this event");
        });
    });

    describe("Check-in", function () {
        beforeEach(async function () {
            // Create an event
            await eventManager.createEvent("Test Event", "Location", futureDate, 100);
            
            // Mint and book
            await waveXNFT.connect(user1).mint();
            await eventManager.connect(user1).bookEntrance(1, 0);
        });

        it("should allow owner to check in attendee", async function () {
            await time.increaseTo(futureDate);

            // Verify the CheckedIn event is emitted with correct parameters
            await expect(eventManager.checkIn(1, 0))
                .to.emit(eventManager, "CheckedIn")
                .withArgs(1, 0);
        });

        it("should not allow check-in before event starts", async function () {
            await expect(
                eventManager.checkIn(1, 0)
            ).to.be.revertedWith("Event not started");
        });

        it("should not allow non-owner to check in attendee", async function () {
            await time.increaseTo(futureDate);
            await expect(
                eventManager.connect(user1).checkIn(1, 0)
            ).to.be.revertedWithCustomError(eventManager, "OwnableUnauthorizedAccount");
        });
    });

    describe("Event Management", function () {
        beforeEach(async function () {
            await eventManager.createEvent("Test Event", "Location", futureDate, 100);
        });

        it("should allow owner to expire an event", async function () {
            const tx = await eventManager.expireEvent(0);
            await tx.wait();

            const eventDetails = await eventManager.getEventDetails(0);
            expect(eventDetails.isActive).to.be.false;
        });

        it("should not allow booking for expired event", async function () {
            await eventManager.expireEvent(0);
            await waveXNFT.connect(user1).mint();

            await expect(
                eventManager.connect(user1).bookEntrance(1, 0)
            ).to.be.revertedWith("Event not active");
        });

        it("should return correct event details", async function () {
            const eventDetails = await eventManager.getEventDetails(0);
            expect(eventDetails.name).to.equal("Test Event");
            expect(eventDetails.location).to.equal("Location");
            expect(eventDetails.date).to.equal(futureDate);
            expect(eventDetails.maxCapacity).to.equal(100);
            expect(eventDetails.bookedCount).to.equal(0);
            expect(eventDetails.isActive).to.be.true;
        });
    });
});

// In test/WaveXEventManager.test.js

describe("Yacht Benefit Check-in", function () {
    beforeEach(async function () {
        [owner, user1, merchant] = await ethers.getSigners();
        
        // Deploy WaveXNFT first
        const WaveXNFT = await ethers.getContractFactory("WaveXNFT");
        waveXNFT = await WaveXNFT.deploy();
        await waveXNFT.waitForDeployment();
        
        // Deploy EventManager with WaveXNFT address
        const WaveXEventManager = await ethers.getContractFactory("WaveXEventManager");
        eventManager = await WaveXEventManager.deploy(await waveXNFT.getAddress());
        await eventManager.waitForDeployment();
        
        futureDate = (await time.latest()) + 86400;
    });

    it("should handle yacht check-in and benefit redemption", async function () {
        // 1. Authorize merchant first
        const authTx = await waveXNFT.connect(owner).setMerchantStatus(merchant.address, true);
        await authTx.wait();
        
        // 2. Create yacht event
        const eventTx = await eventManager.createEvent("Yacht Experience", "Marina Bay", futureDate, 10);
        await eventTx.wait();
        
        // 3. Mint NFT to user1
        const TOKEN_ID = 1;
        const mintTx = await waveXNFT.connect(user1).mint();
        await mintTx.wait();

        // Verify NFT ownership
        const nftOwner = await waveXNFT.ownerOf(TOKEN_ID);
        expect(nftOwner).to.equal(user1.address);

        // 4. Add yacht benefit to NFT
        const BENEFIT_VALUE = 1;
        const BENEFIT_DURATION = 30; // days
        
        await waveXNFT.connect(owner).addBenefit(
            TOKEN_ID,
            BenefitType.YACHT_EVENT,
            BENEFIT_VALUE,
            BENEFIT_DURATION,
            { gasLimit: 500000 }
        );

        // 5. Book the event
        const bookTx = await eventManager.connect(user1).bookEntrance(TOKEN_ID, 0);
        await bookTx.wait();

        // Verify booking was successful
        const isBooked = await eventManager.nftEventBookings(TOKEN_ID, 0);
        expect(isBooked).to.be.true;

        // 6. Advance time to event
        await time.increaseTo(futureDate);

        // 7. Perform check-in
        const checkInTx = await eventManager.connect(owner).checkIn(TOKEN_ID, 0);
        await checkInTx.wait();

        // 8. Redeem benefit through the token owner (user1)
        // Get current benefit status before redemption
        const beforeBenefits = await waveXNFT.getBenefits(TOKEN_ID);
        expect(beforeBenefits[0].isRedeemed).to.be.false;
        expect(beforeBenefits[0].value).to.equal(BENEFIT_VALUE);

        // User1 (token owner) redeems the benefit instead of merchant
        const redeemTx = await waveXNFT.connect(user1).redeemBenefit(
            TOKEN_ID,
            0, // benefit index
            BENEFIT_VALUE,
            { gasLimit: 500000 }
        );
        await redeemTx.wait();

        // 9. Verify benefit status after redemption
        const afterBenefits = await waveXNFT.getBenefits(TOKEN_ID);
        expect(afterBenefits[0].isRedeemed).to.be.true;
        expect(afterBenefits[0].value).to.equal(BENEFIT_VALUE);
    });
});