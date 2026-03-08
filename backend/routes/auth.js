const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, name: user.name, role: user.role, isFirstLogin: user.isFirstLogin },
        process.env.JWT_SECRET || 'super_secret',
        { expiresIn: '12h' }
    );
};

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

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, active: true });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials or inactive account' });
        }

        await addAuthLog(user.id, user.name, 'USER_LOGIN', `Successful login from ${username}`);

        res.json({
            token: generateToken(user),
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                isFirstLogin: user.isFirstLogin,
                language: user.language || 'en'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret');
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findOne({ id: decoded.id });

        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        await addAuthLog(user.id, user.name, 'PASSWORD_RESET', `User ${user.name} reset their password`);

        res.json({
            token: generateToken(user),
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                isFirstLogin: user.isFirstLogin,
                language: user.language || 'en'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/language', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret');
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { language } = req.body;
        if (!['en', 'si'].includes(language)) {
            return res.status(400).json({ error: 'Invalid language' });
        }

        const user = await User.findOneAndUpdate({ id: decoded.id }, { language }, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ success: true, language: user.language });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
