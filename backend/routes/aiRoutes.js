const express = require('express');
const router = express.Router();
const { chatWithAi } = require('../controllers/aiChatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, chatWithAi);

module.exports = router;
