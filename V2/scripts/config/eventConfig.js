const EVENT_METADATA = {
    "name": "Wavex Event",
    "description": "A standard Wavex event",
    "image": "ipfs://QmYourEventImageHash",
    "attributes": [
        {
            "trait_type": "Type",
            "value": "Standard"
        },
        {
            "trait_type": "Capacity",
            "value": "100"
        }
    ]
};

const EVENT_TYPES = {
    STANDARD: 0,
    VIP: 1,
    EXCLUSIVE: 2
};

const EVENT_CONFIG = {
    metadataPath: "metadata/events",
    eventsPath: "data/events"
};

async function getEventMetadata(eventId, options = {}) {
    const metadata = {
        ...EVENT_METADATA,
        name: options.name || `${EVENT_METADATA.name} #${eventId}`,
        description: options.description || EVENT_METADATA.description,
        image: options.image || EVENT_METADATA.image,
        attributes: [
            ...EVENT_METADATA.attributes,
            ...(options.attributes || [])
        ]
    };

    return metadata;
}

module.exports = {
    EVENT_METADATA,
    EVENT_TYPES,
    EVENT_CONFIG,
    getEventMetadata
};