require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const ICON_PATH = process.env.ICON_PATH;
const LOGO_PATH = process.env.LOGO_PATH;
const PASS_JSON_PATH = process.env.PASS_JSON_PATH;
const CERT_PATH = process.env.CERT_PATH;
const KEY_PATH = process.env.KEY_PATH;

function verifyFiles() {
    const files = [ICON_PATH, LOGO_PATH, PASS_JSON_PATH, CERT_PATH, KEY_PATH];
    for (const file of files) {
        if (!fs.existsSync(file)) {
            console.error(`❌ Missing required file: ${file}`);
            process.exit(1);
        }
    }
    console.log('✅ All required files are present.');
}

function verifyCertificate(certPath, keyPath) {
    try {
        execSync(`openssl x509 -noout -modulus -in ${certPath} | openssl md5`);
        execSync(`openssl rsa -noout -modulus -in ${keyPath} | openssl md5`);
        console.log('✅ Certificate and key are valid.');
    } catch (error) {
        console.error('❌ Certificate or key verification failed.');
        process.exit(1);
    }
}

function generateManifest(files, outputPath) {
    const manifest = {};
    files.forEach(file => {
        const data = fs.readFileSync(file);
        const hash = crypto.createHash('sha1').update(data).digest('hex');
        manifest[path.basename(file)] = hash;
    });
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Manifest generated.');
    console.log('📋 Manifest Content:', JSON.stringify(manifest, null, 2));  // Display manifest content
}

function signManifest(manifestPath, certPath, keyPath, signaturePath) {
    const command = `openssl smime -binary -sign -certfile ${certPath} -signer ${certPath} -inkey ${keyPath} -in ${manifestPath} -out ${signaturePath} -outform DER`;
    execSync(command);
    console.log('✅ Manifest signed.');
}

function packagePass(files, outputPath) {
    const zip = new AdmZip();
    files.forEach(file => zip.addLocalFile(file));
    zip.writeZip(outputPath);
    console.log(`🎉 .pkpass generated at: ${outputPath}`);
}

async function main() {
    verifyFiles();
    verifyCertificate(CERT_PATH, KEY_PATH);

    const tempDir = path.join(__dirname, 'glowTime.pass');
    const imageFiles = fs.readdirSync(tempDir).filter(file => /\.(png|@2x\.png|@3x\.png)$/.test(file));

    const filesToHash = [
        path.join(tempDir, 'pass.json'),
        ...imageFiles.map(img => path.join(tempDir, img))
    ];

    const manifestPath = path.join(tempDir, 'manifest.json');
    const signaturePath = path.join(tempDir, 'signature');

    generateManifest(filesToHash, manifestPath);
    signManifest(manifestPath, CERT_PATH, KEY_PATH, signaturePath);

    try {
        execSync(`openssl smime -verify -in ${signaturePath} -inform DER -content ${manifestPath} -noverify`);
        console.log('✅ Signature verification successful.');
    } catch (err) {
        console.error('❌ Signature verification failed:', err.message);
        process.exit(1);
    }

    packagePass([...filesToHash, manifestPath, signaturePath], path.join(__dirname, 'WavexGlow.pkpass'));
}

main().catch(console.error);
