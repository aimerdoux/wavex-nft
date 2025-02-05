const express = require('express');
const { handleEventCheckIn } = require('../events/checkIn');

const router = express.Router();

// Endpoint for generating Apple Wallet pass
router.post('/event/check-in', async (req, res) => {
    try {
        const { tokenId, eventId } = req.body;
        
        // Generate pass
        const passData = await handleEventCheckIn(tokenId, eventId);
        
        // Send pass file
        res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename=wavex-event-${tokenId}.pkpass`
        });
        res.send(passData);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Endpoint for redeeming benefits during event
router.post('/event/redeem-benefit', async (req, res) => {
    try {
        const { tokenId, eventId, benefitType, amount } = req.body;
        
        // Implement benefit redemption logic
        // This will be expanded in the next phase
        
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;