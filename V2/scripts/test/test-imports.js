// V2/scripts/test/test-imports.js
const { expect } = require("chai");
const hre = require("hardhat");

describe("WaveX V2 Imports", function () {
    this.timeout(60000); // Increased timeout to 60 seconds

    let imports = {};

    before(async function() {
        try {
            imports.configValidator = require('../utils/configValidator');
            imports.pinataUtils = require('../utils/pinataUtils');
            imports.metadataConfig = require('../config/metadataConfig');
            imports.templateConfig = require('../config/templateConfig');
        } catch (error) {
            console.error('Error loading imports:', error);
            throw error;
        }
    });

    describe("Contract Imports", function () {
        it("Should import OpenZeppelin contracts", async function () {
            try {
                const [owner] = await hre.ethers.getSigners();
                const NFTContract = await hre.ethers.getContractFactory("WaveXNFTV2");
                expect(NFTContract).to.not.be.undefined;
            } catch (error) {
                console.error('Error importing contract:', error);
                throw error;
            }
        });
    });

    describe("Configuration Imports", function () {
        it("Should import metadata configuration", function () {
            expect(imports.metadataConfig.TEMPLATE_METADATA).to.not.be.undefined;
            expect(imports.metadataConfig.TEMPLATE_METADATA).to.be.an('object');
        });

        it("Should import template configuration", function () {
            const { TEMPLATE_BASE } = imports.templateConfig;
            expect(TEMPLATE_BASE).to.not.be.undefined;
            expect(TEMPLATE_BASE).to.be.an('object');
            expect(TEMPLATE_BASE.GOLD).to.not.be.undefined;
            expect(TEMPLATE_BASE.PLATINUM).to.not.be.undefined;
            expect(TEMPLATE_BASE.BLACK).to.not.be.undefined;
            expect(TEMPLATE_BASE.EVENTBRITE).to.not.be.undefined;
        });
    });

    describe("Utility Imports", function () {
        it("Should import config validator", function () {
            expect(imports.configValidator.validateMetadata).to.be.a('function');
        });

        it("Should import Pinata utils", function () {
            expect(imports.pinataUtils.uploadToIPFS).to.be.a('function');
        });
    });

    describe("Environment Variables", function () {
        const requiredEnvVars = [
            'ALCHEMY_API_KEY',
            'PRIVATE_KEY',
            'POLYGONSCAN_API_KEY',
            'PINATA_API_KEY',
            'PINATA_API_SECRET',
            'PINATA_JWT',
            'WAVEX_NFT_V2_ADDRESS',
            'MERCHANT_ADDRESS',
            'MERCHANT_ADMIN_KEY'
        ];

        requiredEnvVars.forEach(envVar => {
            it(`Should have ${envVar} set`, function () {
                const value = process.env[envVar];
                expect(value, `${envVar} is not set`).to.not.be.undefined;
                expect(value.trim(), `${envVar} is empty`).to.not.equal('');
            });
        });
    });

    describe("Template Validation", function () {
        it("Should validate template metadata structure", function () {
            const { TEMPLATE_METADATA } = imports.metadataConfig;
            const templateIds = Object.keys(TEMPLATE_METADATA);
            expect(templateIds.length, 'No templates found').to.be.greaterThan(0);

            templateIds.forEach(id => {
                const template = TEMPLATE_METADATA[id];
                expect(template, `Template ${id} is invalid`).to.have.property('name');
                expect(template).to.have.property('baseBalance');
                expect(template).to.have.property('price');
                expect(template).to.have.property('discount');
                expect(template).to.have.property('isVIP');
                expect(template).to.have.property('metadata');
            });
        });

        it("Should validate template base structure", function () {
            const { TEMPLATE_BASE } = imports.templateConfig;
            const templates = Object.values(TEMPLATE_BASE);
            expect(templates.length, 'No template bases found').to.be.greaterThan(0);

            templates.forEach((template, index) => {
                expect(template, `Template base ${index} is invalid`).to.have.property('id');
                expect(template).to.have.property('name');
                expect(template).to.have.property('baseBalance');
                expect(template).to.have.property('price');
                expect(template).to.have.property('discount');
                expect(template).to.have.property('isVIP');
                expect(template).to.have.property('design');
                expect(template).to.have.property('benefits');
                expect(template.benefits).to.be.an('array');
                expect(template.benefits.length, `Template ${template.name} has no benefits`).to.be.greaterThan(0);
            });
        });
    });
});