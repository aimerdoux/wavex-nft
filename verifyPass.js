const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PASS_PATH = path.join(__dirname, 'WavexGlow.pkpass');
const TEMP_DIR = path.join(__dirname, 'WavexGlow');

function extractPass() {
    if (!fs.existsSync(PASS_PATH)) {
        console.error('❌ WavexGlow.pkpass not found.');
        process.exit(1);
    }

    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true });
    }

    fs.mkdirSync(TEMP_DIR);

    try {
        execSync(`tar -xf "${PASS_PATH}" -C "${TEMP_DIR}"`);
        console.log('✅ Pass extracted successfully.');
    } catch (error) {
        console.error('❌ Error extracting pass:', error.message);
        process.exit(1);
    }
}

function verifySignature() {
    const manifestPath = path.join(TEMP_DIR, 'manifest.json');
    const signaturePath = path.join(TEMP_DIR, 'signature');

    if (!fs.existsSync(manifestPath) || !fs.existsSync(signaturePath)) {
        console.error('❌ manifest.json or signature file is missing.');
        process.exit(1);
    }

    try {
        execSync(`openssl smime -verify -inform DER -in "${signaturePath}" -content "${manifestPath}" -noverify`);
        console.log('✅ Signature verification successful.');
    } catch (error) {
        console.error('❌ Signature verification failed:', error.message);
        process.exit(1);
    }
}

function listPassContents() {
    console.log('\n📦 Contents of WavexGlow.pkpass:');
    const files = fs.readdirSync(TEMP_DIR);
    files.forEach(file => {
        const stats = fs.statSync(path.join(TEMP_DIR, file));
        console.log(`- ${file} (${stats.size} bytes)`);
    });
}

function verifyPass() {
    extractPass();
    listPassContents();
    verifySignature();
}

verifyPass();
