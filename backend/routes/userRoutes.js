const express = require('express');
const router = express.Router();
const { updateProfile, updateBusinessProfile, updatePassword, updateNotifications, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.put('/profile', protect, updateProfile);
router.put('/business', protect, updateBusinessProfile);
router.put('/password', protect, updatePassword);
router.put('/notifications', protect, updateNotifications);
router.delete('/account', protect, deleteAccount);

module.exports = router;
