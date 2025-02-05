const PASS_TEMPLATES = {
    EVENT: {
        formatVersion: 1,
        passTypeIdentifier: "pass.com.wavex.event",
        teamIdentifier:  process.env.APPLE_TEAM_ID, // From Apple Developer Account
        backgroundColor: "rgb(48, 48, 48)",
        foregroundColor: "rgb(255, 255, 255)",
        labelColor: "rgb(255, 255, 255)",
        generic: {
            primaryFields: [
                {
                    key: "event",
                    label: "EVENT",
                    value: ""
                }
            ],
            secondaryFields: [
                {
                    key: "date",
                    label: "DATE",
                    value: ""
                },
                {
                    key: "time",
                    label: "TIME",
                    value: ""
                }
            ],
            auxiliaryFields: [
                {
                    key: "location",
                    label: "LOCATION",
                    value: ""
                },
                {
                    key: "tokenId",
                    label: "TOKEN ID",
                    value: ""
                }
            ],
            backFields: [
                {
                    key: "benefits",
                    label: "AVAILABLE BENEFITS",
                    value: ""
                },
                {
                    key: "terms",
                    label: "TERMS",
                    value: "This pass must be presented at check-in."
                }
            ]
        }
    }
};

module.exports = { PASS_TEMPLATES };