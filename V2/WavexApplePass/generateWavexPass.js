require('dotenv').config({ path: require('path').join(__dirname, '../V2.env') }); // Load V2.env
const fs = require('fs');
const path = require('path'); // Ensure 'path' is declared before use
const crypto = require('crypto');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const PASS_DIR = path.join(__dirname);
const PASS_JSON_PATH = path.join(PASS_DIR, 'pass.json');

// Load certificate and key paths from V2.env
const CERT_PATH = process.env.CERT_PATH?.trim();
const KEY_PATH = process.env.KEY_PATH?.trim();

if (!CERT_PATH || !KEY_PATH) {
    console.error('❌ CERT_PATH or KEY_PATH is missing from V2.env');
    process.exit(1);
}

console.log(`🔍 Using Certificate Path: ${CERT_PATH}`);
console.log(`🔍 Using Key Path: ${KEY_PATH}`);

// List of required image assets
const IMAGE_FILES = [
    'background.png', 'background@2x.png', 'background@3x.png',
    'icon.png', 'icon@2x.png', 'icon@3x.png',
    'thumbnail.png', 'thumbnail@2x.png', 'thumbnail@3x.png'
];

// Verify all required files exist
function verifyFiles() {
    const files = [PASS_JSON_PATH, CERT_PATH, KEY_PATH, ...IMAGE_FILES.map(file => path.join(PASS_DIR, file))];
    for (const file of files) {
        if (!fs.existsSync(file)) {
            console.error(`❌ Missing required file: ${file}`);
            process.exit(1);
        }
    }
    console.log('✅ All required files are present.');
}

// Verify certificate and key
function verifyCertificate(certPath, keyPath) {
    try {
        execSync(`openssl x509 -noout -modulus -in "${certPath}" | openssl md5`);
        execSync(`openssl rsa -noout -modulus -in "${keyPath}" | openssl md5`);
        console.log('✅ Certificate and key are valid.');
    } catch (error) {
        console.error('❌ Certificate or key verification failed.');
        process.exit(1);
    }
}

// Generate manifest.json
function generateManifest(files, outputPath) {
    const manifest = {};
    files.forEach(file => {
        const data = fs.readFileSync(file);
        const hash = crypto.createHash('sha1').update(data).digest('hex');
        manifest[path.basename(file)] = hash;
    });
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Manifest generated.');
}

// Sign manifest with OpenSSL
function signManifest(manifestPath, certPath, keyPath, signaturePath) {
    const command = `openssl smime -binary -sign -certfile "${certPath}" -signer "${certPath}" -inkey "${keyPath}" -in "${manifestPath}" -out "${signaturePath}" -outform DER`;
    execSync(command);
    console.log('✅ Manifest signed.');
}

// Package files into a .pkpass archive
function packagePass(files, outputPath) {
    const zip = new AdmZip();
    files.forEach(file => zip.addLocalFile(file));
    zip.writeZip(outputPath);
    console.log(`🎉 .pkpass generated at: ${outputPath}`);
}

// Main execution
async function main() {
    verifyFiles();
    verifyCertificate(CERT_PATH, KEY_PATH);

    const manifestPath = path.join(PASS_DIR, 'manifest.json');
    const signaturePath = path.join(PASS_DIR, 'signature');

    const filesToHash = [
        PASS_JSON_PATH,
        ...IMAGE_FILES.map(file => path.join(PASS_DIR, file))
    ];

    generateManifest(filesToHash, manifestPath);
    signManifest(manifestPath, CERT_PATH, KEY_PATH, signaturePath);

    try {
        execSync(`openssl smime -verify -in "${signaturePath}" -inform DER -content "${manifestPath}" -noverify`);
        console.log('✅ Signature verification successful.');
    } catch (err) {
        console.error('❌ Signature verification failed:', err.message);
        process.exit(1);
    }

    packagePass([...filesToHash, manifestPath, signaturePath], path.join(PASS_DIR, 'WavexApplePass.pkpass'));
}

main().catch(console.error);
