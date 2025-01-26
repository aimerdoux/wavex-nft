// scripts/utils/benefitTypes.js
const BenefitType = {
    MERCHANT_ALLOWANCE: 0,
    YACHT_EVENT: 1,
    DISCOUNT: 2
};

const BenefitConfig = {
    [BenefitType.MERCHANT_ALLOWANCE]: {
        minValue: 1,
        maxValue: 10000,
        minDuration: 1,  // days
        maxDuration: 365, // days
        isPartialRedeemable: true,
        requiresMerchant: true
    },
    [BenefitType.YACHT_EVENT]: {
        minValue: 1,
        maxValue: 10,
        minDuration: 1,
        maxDuration: 180,
        isPartialRedeemable: false,
        requiresMerchant: false
    },
    [BenefitType.DISCOUNT]: {
        minValue: 1,
        maxValue: 100,
        minDuration: 1,
        maxDuration: 365,
        isPartialRedeemable: false,
        requiresMerchant: true
    }
};

function validateBenefitParams(type, value, duration) {
    const config = BenefitConfig[type];
    if (!config) {
        throw new Error(`Invalid benefit type: ${type}`);
    }

    if (value < config.minValue || value > config.maxValue) {
        throw new Error(
            `Value must be between ${config.minValue} and ${config.maxValue} for ${Object.keys(BenefitType)[type]}`
        );
    }

    if (duration < config.minDuration || duration > config.maxDuration) {
        throw new Error(
            `Duration must be between ${config.minDuration} and ${config.maxDuration} days for ${Object.keys(BenefitType)[type]}`
        );
    }

    return true;
}

module.exports = {
    BenefitType,
    BenefitConfig,
    validateBenefitParams
};