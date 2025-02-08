// scripts/utils/configValidator.js

const validateMetadata = async (metadata) => {
    if (!metadata || typeof metadata !== 'object') {
        throw new Error('Invalid metadata object');
    }

    // Validate basic metadata fields
    const requiredFields = ['name', 'description', 'image'];
    for (const field of requiredFields) {
        if (!metadata[field] || typeof metadata[field] !== 'string') {
            throw new Error(`Missing or invalid ${field} field`);
        }
    }

    // Validate attributes
    if (!Array.isArray(metadata.attributes)) {
        throw new Error('Attributes must be an array');
    }

    for (const attribute of metadata.attributes) {
        if (!attribute.trait_type || !attribute.value) {
            throw new Error('Each attribute must have trait_type and value');
        }
    }

    // Validate properties
    if (metadata.properties) {
        if (typeof metadata.properties !== 'object') {
            throw new Error('Properties must be an object');
        }

        const requiredProperties = ['tier', 'benefits', 'baseBalance', 'price', 'discount', 'isVIP'];
        for (const prop of requiredProperties) {
            if (metadata.properties[prop] === undefined) {
                throw new Error(`Missing required property: ${prop}`);
            }
        }

        if (!Array.isArray(metadata.properties.benefits)) {
            throw new Error('Benefits must be an array');
        }
    }

    return true;
};

const validateTemplateConfig = (config) => {
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid template config object');
    }

    // Validate required fields
    const requiredFields = ['id', 'name', 'baseBalance', 'price', 'discount', 'isVIP'];
    for (const field of requiredFields) {
        if (config[field] === undefined) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    // Validate numeric fields
    const numericFields = ['id', 'discount'];
    for (const field of numericFields) {
        if (typeof config[field] !== 'number') {
            throw new Error(`${field} must be a number`);
        }
    }

    // Validate string fields
    const stringFields = ['name', 'baseBalance', 'price'];
    for (const field of stringFields) {
        if (typeof config[field] !== 'string') {
            throw new Error(`${field} must be a string`);
        }
    }

    // Validate boolean fields
    if (typeof config.isVIP !== 'boolean') {
        throw new Error('isVIP must be a boolean');
    }

    // Validate design if present
    if (config.design) {
        const requiredDesignFields = ['image', 'backgroundColor', 'foregroundColor', 'labelColor', 'primaryColor', 'textColor'];
        for (const field of requiredDesignFields) {
            if (!config.design[field] || typeof config.design[field] !== 'string') {
                throw new Error(`Missing or invalid design field: ${field}`);
            }
        }
    }

    // Validate benefits if present
    if (config.benefits) {
        if (!Array.isArray(config.benefits)) {
            throw new Error('Benefits must be an array');
        }
        if (config.benefits.some(benefit => typeof benefit !== 'string')) {
            throw new Error('All benefits must be strings');
        }
    }

    return true;
};

const validateEventConfig = (config) => {
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid event config object');
    }

    const requiredFields = ['name', 'price', 'capacity', 'eventType'];
    for (const field of requiredFields) {
        if (config[field] === undefined) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    if (typeof config.name !== 'string') {
        throw new Error('Event name must be a string');
    }

    if (typeof config.capacity !== 'number' || config.capacity <= 0) {
        throw new Error('Event capacity must be a positive number');
    }

    if (typeof config.eventType !== 'number') {
        throw new Error('Event type must be a number');
    }

    return true;
};

module.exports = {
    validateMetadata,
    validateTemplateConfig,
    validateEventConfig
};