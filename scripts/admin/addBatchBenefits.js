const hre = require("hardhat");
require('dotenv').config();
const { ethers } = hre;

async function investigateRevert(contract, tokenIds, benefitType, value, duration) {
    console.log("\n🕵️ Detailed Revert Investigation 🕵️");
    console.log("====================================");

    try {
        // Detailed contract interactions
        const signer = await hre.ethers.provider.getSigner();
        const signerAddress = await signer.getAddress();
        console.log("Signer Address:", signerAddress);

        // Check contract owner
        let contractOwner;
        try {
            contractOwner = await contract.owner();
            console.log("Contract Owner:", contractOwner);
            console.log("Is Signer the Owner:", signerAddress.toLowerCase() === contractOwner.toLowerCase());
        } catch (ownerError) {
            console.error("Could not retrieve contract owner:", ownerError);
        }

        // Individual token checks
        console.log("\nToken Ownership and Validation:");
        console.log("--------------------------------");
        for (const tokenId of tokenIds) {
            try {
                const owner = await contract.ownerOf(tokenId);
                console.log(`Token ${tokenId}:`);
                console.log(`  Owner: ${owner}`);
                
                // Check current benefits
                const benefits = await contract.getBenefits(tokenId);
                console.log(`  Current Benefit Count: ${benefits.length}`);
                
                benefits.forEach((benefit, index) => {
                    console.log(`  Benefit #${index}:`);
                    console.log(`    Type: ${benefit.benefitType}`);
                    console.log(`    Value: ${benefit.value.toString()}`);
                    console.log(`    Remaining Value: ${benefit.remainingValue.toString()}`);
                    console.log(`    Is Redeemed: ${benefit.isRedeemed}`);
                });
            } catch (tokenError) {
                console.error(`Error checking Token ${tokenId}:`, tokenError.message);
            }
        }

        // Attempt to decode revert reason
        console.log("\nAttempting to Decode Revert Reason:");
        console.log("-----------------------------------");
        try {
            const encodedData = contract.interface.encodeFunctionData(
                'addBatchBenefits', 
                [tokenIds, benefitType, value, duration]
            );
            console.log("Encoded Function Data:", encodedData);
        } catch (encodeError) {
            console.error("Could not encode function data:", encodeError);
        }

        // Static call investigation
        console.log("\nStatic Call Investigation:");
        console.log("---------------------------");
        try {
            await contract.callStatic.addBatchBenefits(
                tokenIds,
                benefitType,
                value,
                duration
            );
            console.log("Static call unexpectedly succeeded!");
        } catch (staticCallError) {
            console.error("Static Call Failure Details:");
            console.error("Error Message:", staticCallError.message);
            
            if (staticCallError.reason) {
                console.error("Revert Reason:", staticCallError.reason);
            }
            if (staticCallError.code) {
                console.error("Error Code:", staticCallError.code);
            }
            if (staticCallError.error) {
                console.error("Nested Error:", staticCallError.error);
            }
        }

    } catch (error) {
        console.error("Unexpected error during investigation:", error);
    }
}

async function addBatchBenefits(contract, tokenIds, benefitType, value, duration) {
    try {
        console.log("\nInitiating batch benefit addition...");
        console.log("================================");
        console.log("Target Token IDs:", tokenIds);
        
        const benefitTypeNames = ['MERCHANT_ALLOWANCE', 'YACHT_EVENT', 'DISCOUNT'];
        console.log(`Benefit Type: ${benefitType} (${benefitTypeNames[benefitType] || 'UNKNOWN'})`);
        
        console.log("Benefit Value:", value);
        console.log("Duration (days):", duration);

        // Confirm before proceeding
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve, reject) => {
            readline.question('\nDo you want to proceed with adding benefits to these tokens? (yes/no): ', async (answer) => {
                readline.close();

                if (answer.toLowerCase() !== 'yes') {
                    console.log("Operation cancelled.");
                    resolve(false);
                    return;
                }

                try {
                    // Attempt transaction
                    console.log("\nSubmitting batch benefits transaction...");
                    const tx = await contract.addBatchBenefits(
                        tokenIds,
                        benefitType,
                        value,
                        duration
                    );

                    console.log("\nTransaction submitted. Waiting for confirmation...");
                    const receipt = await tx.wait();
                    
                    console.log("\nBatch processed successfully!");
                    console.log("Transaction Hash:", receipt.hash);
                    console.log("Gas Used:", receipt.gasUsed.toString());

                    resolve(true);

                } catch (error) {
                    console.error("\nTransaction Error:", error);
                    
                    // Detailed revert investigation
                    await investigateRevert(
                        contract, 
                        tokenIds, 
                        benefitType, 
                        value, 
                        duration
                    );
                    
                    reject(error);
                }
            });
        });

    } catch (error) {
        console.error("\nInitial Error in batch benefit addition:", error);
        throw error;
    }
}

// Rest of the script remains the same

async function main() {
    try {
        // Check required environment variables
        const requiredEnvVars = {
            CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
            BATCH_BENEFIT_TYPE: process.env.BATCH_BENEFIT_TYPE,
            BATCH_BENEFIT_VALUE: process.env.BATCH_BENEFIT_VALUE,
            BATCH_BENEFIT_DURATION: process.env.BATCH_BENEFIT_DURATION,
            TOKEN_RANGE: process.env.TOKEN_RANGE
        };

        // Validate all required environment variables
        const missingVars = Object.entries(requiredEnvVars)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Parse token range
        let tokenIds;
        if (requiredEnvVars.TOKEN_RANGE.includes('-')) {
            const [start, end] = requiredEnvVars.TOKEN_RANGE.split('-').map(Number);
            tokenIds = Array.from({length: end - start + 1}, (_, i) => start + i);
        } else {
            tokenIds = requiredEnvVars.TOKEN_RANGE.split(',').map(id => parseInt(id.trim()));
        }

        // Validate parsed values
        if (tokenIds.some(id => isNaN(id))) {
            throw new Error("Invalid token IDs in TOKEN_RANGE. Format should be '1-5' or '1,2,3,4,5'");
        }

        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(requiredEnvVars.CONTRACT_ADDRESS);

        // Process batch benefit addition
        await addBatchBenefits(
            contract,
            tokenIds,
            parseInt(requiredEnvVars.BATCH_BENEFIT_TYPE),
            parseInt(requiredEnvVars.BATCH_BENEFIT_VALUE),
            parseInt(requiredEnvVars.BATCH_BENEFIT_DURATION)
        );

        console.log("\nBatch benefit addition completed successfully!");

    } catch (error) {
        console.error("\nError in main process:", error);
        console.error("\nPlease make sure your .env file includes:");
        console.error("CONTRACT_ADDRESS=0x...");
        console.error("TOKEN_RANGE=1-5 (or 1,2,3,4,5)");
        console.error("BATCH_BENEFIT_TYPE=0");
        console.error("BATCH_BENEFIT_VALUE=1000");
        console.error("BATCH_BENEFIT_DURATION=90");
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    addBatchBenefits
};