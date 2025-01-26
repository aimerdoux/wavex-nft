// scripts/utils/processCardImages.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processAndSaveImage(sourcePath, targetDir, filename, options = {}) {
    try {
        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const targetPath = path.join(targetDir, filename);

        // Process image with sharp
        await sharp(sourcePath)
            .resize(options.width || 1024, options.height || 648, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .jpeg({ quality: 90 })
            .toFile(targetPath);

        return targetPath;
    } catch (error) {
        console.error(`Error processing image ${sourcePath}:`, error);
        throw error;
    }
}

async function setupCardImages() {
    try {
        console.log("\nSetting up card images...");
        
        // Define base directories
        const sourceDir = path.join(__dirname, '../../source-images');
        const targetBaseDir = path.join(__dirname, '../../assets/card-designs');

        // Create directories if they don't exist
        if (!fs.existsSync(sourceDir)) {
            fs.mkdirSync(sourceDir, { recursive: true });
        }

        // Define card configurations
        const cards = [
            { tier: 'black', sourceFile: 'black_card.jpg' },
            { tier: 'platinum', sourceFile: 'platinum_card.jpg' },
            { tier: 'gold', sourceFile: 'gold_card.jpg' }
        ];

        console.log("\nPlease copy your card images to:");
        console.log(sourceDir);
        console.log("\nExpected filenames:");
        cards.forEach(card => console.log(`- ${card.sourceFile}`));

        // Process each card
        for (const card of cards) {
            const sourcePath = path.join(sourceDir, card.sourceFile);
            const targetDir = path.join(targetBaseDir, card.tier);

            if (!fs.existsSync(sourcePath)) {
                console.log(`\nMissing ${card.tier} card image: ${sourcePath}`);
                continue;
            }

            console.log(`\nProcessing ${card.tier} card...`);
            const processedPath = await processAndSaveImage(
                sourcePath,
                targetDir,
                `${card.tier}.jpg`,
                { width: 1024, height: 648 }
            );
            console.log(`Saved to: ${processedPath}`);
        }

        console.log("\nImage processing complete!");
        console.log("\nNext steps:");
        console.log("1. Verify the processed images in:");
        console.log(`   ${targetBaseDir}`);
        console.log("2. Run the card design upload script:");
        console.log("   npx hardhat run scripts/metadata/uploadCardDesigns.js");

    } catch (error) {
        console.error("\nError processing images:", error);
        throw error;
    }
}

if (require.main === module) {
    // Install required packages if not present
    try {
        require('sharp');
    } catch {
        console.log("\nInstalling required packages...");
        require('child_process').execSync('npm install --save-dev sharp');
        console.log("Packages installed successfully!");
    }

    setupCardImages()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    processAndSaveImage,
    setupCardImages
};