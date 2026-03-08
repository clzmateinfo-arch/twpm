const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const addAuthLog = async (userId, userName, action, details) => {
    await AuditLog.create({
        id: `L${Date.now()}`,
        timestamp: new Date(),
        userId,
        userName,
        action,
        details
    });
};

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Requires Admin privileges' });
    }
};

const authMiddleware = require('../middleware/auth');
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, role, username } = req.body;

        let existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: 'Username already exists' });

        const count = await User.countDocuments();
        const newId = `U${count + 1}`.padStart(4, '0');
        const tempPassword = Math.random().toString(36).slice(-8);

        const user = new User({
            id: newId,
            name,
            role,
            username,
            password: tempPassword,
            isFirstLogin: true
        });

        await user.save();
        await addAuthLog(req.user.id, req.user.name, 'USER_CREATED', `Created new user ${user.username} (${user.role})`);

        res.json({
            id: user.id,
            name: user.name,
            role: user.role,
            username: user.username,
            tempPassword // Return temp password to display in UI once
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { id: req.params.id },
            { active: false },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });

        await addAuthLog(req.user.id, req.user.name, 'USER_DEACTIVATED', `Deactivated user ${user.username}`);
        res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
