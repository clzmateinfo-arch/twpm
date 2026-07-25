const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const User = require('./models/User');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

const pharmacyRouter = require('./routes/pharmacy');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/pharmacy', pharmacyRouter);

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const startServer = async () => {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
    }

    try {
        await mongoose.connect(uri);
        console.log(`Connected to MongoDB at ${uri}`);

        const adminCount = await User.countDocuments({ role: 'ADMIN' });
        if (adminCount === 0) {
            console.log('Seeding initial admin user...');
            const adminUser = new User({
                id: 'U000',
                name: 'System Admin',
                role: 'ADMIN',
                username: 'admin',
                password: 'password123',
                isFirstLogin: false
            });
            await adminUser.save();
            console.log('Admin user seeded successfully.');
        }

        app.use('/api', require('./routes'));

        // First minimal periodic-job infra in this codebase: expiry alerts can't
        // rely purely on request-triggered checks (a drug could sit unfetched for
        // days), but a 6-hourly unthrottled loop would spam alerts, hence the
        // once-per-day dedup inside runExpiryCheck itself (see routes/pharmacy.js).
        pharmacyRouter.runExpiryCheck(io).catch(err => console.error('Initial expiry check failed', err));
        setInterval(() => {
            pharmacyRouter.runExpiryCheck(io).catch(err => console.error('Periodic expiry check failed', err));
        }, 6 * 60 * 60 * 1000);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
};

startServer();
