const hre = require("hardhat");
const { ethers } = require("hardhat");

async function checkTokenOwnership(waveXNFT, tokenId, owner) {
    try {
        const tokenOwner = await waveXNFT.ownerOf(tokenId);
        console.log(`Token ${tokenId} owner:`, tokenOwner);
        return tokenOwner.toLowerCase() === owner.address.toLowerCase();
    } catch (error) {
        console.log(`Error checking token ${tokenId} ownership:`, error.message);
        return false;
    }
}

async function main() {
    try {
        const deploymentInfo = require('../deployments/polygonAmoy_eventmanager_deployment.json');
        const eventManager = await hre.ethers.getContractAt(
            "WaveXEventManager",
            deploymentInfo.contractAddress
        );

        const [owner] = await ethers.getSigners();
        console.log("Testing with address:");
        console.log("Owner:", owner.address);

        // Check if we're the contract owner
        const contractOwner = await eventManager.owner();
        console.log("\nContract owner:", contractOwner);
        const isOwner = contractOwner.toLowerCase() === owner.address.toLowerCase();
        console.log("Are we the owner?", isOwner);

        // Get WaveXNFT contract
        const waveXNFTAddress = await eventManager.waveXNFT();
        const waveXNFT = await hre.ethers.getContractAt("IERC721", waveXNFTAddress);
        console.log("WaveXNFT contract address:", waveXNFTAddress);

        // First, let's check what tokens we actually own
        console.log("\nChecking owned tokens...");
        let ownedTokens = [];
        // Let's check tokens 1-10 for example
        for (let tokenId = 1; tokenId <= 10; tokenId++) {
            try {
                const ownsToken = await checkTokenOwnership(waveXNFT, tokenId, owner);
                if (ownsToken) {
                    ownedTokens.push(tokenId);
                }
            } catch (error) {
                continue;
            }
        }
        console.log("Owned tokens:", ownedTokens);

        if (ownedTokens.length === 0) {
            console.log("No owned tokens found. Please mint some tokens first.");
            return;
        }

        // 1. Test Multiple Tokens Booking
        console.log("\n1. Testing Multiple Tokens Booking");
        console.log("----------------------------------");
        
        if (isOwner) {
            // Set entrances for owned tokens
            console.log("Setting entrances for owned tokens...");
            for (const tokenId of ownedTokens) {
                try {
                    const tx = await eventManager.setTokenEntrances(tokenId, 2);
                    await tx.wait();
                    console.log(`Set 2 entrances for token ${tokenId}`);

                    const availableEntrances = await eventManager.getAvailableEntrances(tokenId);
                    console.log(`Verified available entrances for token ${tokenId}: ${availableEntrances}`);
                } catch (error) {
                    console.log(`Failed to set entrances for token ${tokenId}:`, error.message);
                }
            }
        } else {
            console.log("Skipping entrance setting - not contract owner");
        }

        // 2. Create New Test Event (only if owner)
        console.log("\n2. Creating New Test Event");
        console.log("-------------------------");
        
        if (isOwner) {
            const currentTime = Math.floor(Date.now() / 1000);
            const eventDate = currentTime + (24 * 60 * 60); // 1 day from now
            
            try {
                const tx = await eventManager.createEvent(
                    "Limited Capacity Event",
                    "Virtual Location",
                    eventDate,
                    2 // max capacity of 2
                );
                const receipt = await tx.wait();
                console.log("Created new event with max capacity of 2");
            } catch (error) {
                console.log("Failed to create event:", error.message);
            }
        } else {
            console.log("Skipping event creation - not contract owner");
        }

        // 3. Test Event Capacity
        console.log("\n3. Testing Event Capacity");
        console.log("------------------------");
        
        const eventCount = await eventManager.getEventCount();
        const eventId = Number(eventCount.toString()) - 1; // Convert BigNumber to regular number
        console.log(`Testing capacity for event ${eventId}...`);
        
        for (const tokenId of ownedTokens) {
            try {
                const tx = await eventManager.bookEntrance(tokenId, eventId);
                const receipt = await tx.wait();
                
                if (receipt.status === 1) {
                    console.log(`Successfully booked event ${eventId} for token ${tokenId}`);
                } else {
                    console.log(`Booking failed for token ${tokenId}`);
                }
            } catch (error) {
                console.log(`Booking failed for token ${tokenId}:`, error.message);
            }
        }

        // 4. Print Final Status
        console.log("\n4. Final Status");
        console.log("---------------");
        
        try {
            const event0 = await eventManager.getEventDetails(0);
            console.log("Event 0 Status:");
            console.log("- Name:", event0.name);
            console.log("- Booked Count:", event0.bookedCount.toString());
            console.log("- Max Capacity:", event0.maxCapacity.toString());
            console.log("- Is Active:", event0.isActive);
            
            if (eventId > 0) {
                const lastEvent = await eventManager.getEventDetails(eventId);
                console.log(`\nEvent ${eventId} Status:`);
                console.log("- Name:", lastEvent.name);
                console.log("- Booked Count:", lastEvent.bookedCount.toString());
                console.log("- Max Capacity:", lastEvent.maxCapacity.toString());
                console.log("- Is Active:", lastEvent.isActive);
            }

            // Check final status for owned tokens
            for (const tokenId of ownedTokens) {
                const available = await eventManager.getAvailableEntrances(tokenId);
                const bookings = await eventManager.getTokenBookings(tokenId);
                
                console.log(`\nToken ${tokenId} Final Status:`);
                console.log("- Available Entrances:", available.toString());
                console.log("- Total Bookings:", bookings.length);
                console.log("- Active Bookings:", bookings.filter(b => b.isActive).length);
            }
        } catch (error) {
            console.log("Error getting final status:", error.message);
        }

        // 5. Testing Cancellation
        console.log("\n5. Testing Cancellation");
        console.log("----------------------");
        try {
            // Get token 1's bookings to find the correct entrance number
            const token1Bookings = await eventManager.getTokenBookings(1);
            console.log("Token 1 bookings:", token1Bookings);
            
            // Get event details to check the date
            const event6 = await eventManager.getEventDetails(6);
            const eventDate = Number(event6.date.toString());
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (currentTime <= eventDate - 48 * 3600) {
                const tx = await eventManager.cancelBooking(1, 6, token1Bookings.length - 1);
                const receipt = await tx.wait();
                if (receipt.status === 1) {
                    console.log("Successfully cancelled booking");
                    
                    // Verify cancellation
                    const updatedBookings = await eventManager.getTokenBookings(1);
                    console.log("Updated token 1 bookings:", updatedBookings);
                    
                    const cancellationCount = await eventManager.getCancellationCount(1, 6);
                    console.log("Cancellation count for token 1, event 6:", cancellationCount.toString());
                }
            } else {
                console.log("Cannot cancel - within 48 hours of event");
            }
        } catch (error) {
            console.log("Cancellation failed:", error.message);
        }

        // 6. Testing Check-in
        console.log("\n6. Testing Check-in");
        console.log("------------------");
        try {
            // Get event details to verify timing
            const event6 = await eventManager.getEventDetails(6);
            const eventDate = Number(event6.date.toString());
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (currentTime >= eventDate) {
                const tx = await eventManager.checkIn(2, 6, 0); // Using token 2's booking
                const receipt = await tx.wait();
                if (receipt.status === 1) {
                    console.log("Successfully checked in token 2 for event 6");
                }
            } else {
                console.log("Cannot check in - event hasn't started yet");
                console.log("Event starts in:", (eventDate - currentTime) / 3600, "hours");
            }
        } catch (error) {
            console.log("Check-in failed:", error.message);
        }

        // 7. Testing Event Expiration
        console.log("\n7. Testing Event Expiration");
        console.log("-------------------------");
        try {
            const tx = await eventManager.expireEvent(6);
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log("Successfully expired event 6");
                
                // Verify event status
                const event6 = await eventManager.getEventDetails(6);
                console.log("Event 6 active status:", event6.isActive);
            }
        } catch (error) {
            console.log("Event expiration failed:", error.message);
        }

        // 8. Final Comprehensive Status
        console.log("\n8. Final Comprehensive Status");
        console.log("----------------------------");
        try {
            const event6 = await eventManager.getEventDetails(6);
            console.log("\nEvent 6 Final Status:");
            console.log("- Name:", event6.name);
            console.log("- Booked Count:", event6.bookedCount.toString());
            console.log("- Max Capacity:", event6.maxCapacity.toString());
            console.log("- Is Active:", event6.isActive);
            console.log("- Date:", new Date(Number(event6.date.toString()) * 1000).toLocaleString());

            for (const tokenId of ownedTokens) {
                const available = await eventManager.getAvailableEntrances(tokenId);
                const bookings = await eventManager.getTokenBookings(tokenId);
                const cancellations = await eventManager.getCancellationCount(tokenId, 6);
                
                console.log(`\nToken ${tokenId} Final Status:`);
                console.log("- Available Entrances:", available.toString());
                console.log("- Total Bookings:", bookings.length);
                console.log("- Active Bookings:", bookings.filter(b => b.isActive).length);
                console.log("- Cancellations for Event 6:", cancellations.toString());
            }
        } catch (error) {
            console.log("Error getting final comprehensive status:", error.message);
        }

    } catch (error) {
        console.error("\nTest error:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });