/**
 * Verifies (not just claims) that the pharmacy dispense stock decrement is
 * safe under concurrency: Drug.stock must never go negative and the sum of
 * successful decrements must never exceed the starting stock, even when
 * many requests race the same document simultaneously.
 *
 * Uses mongodb-memory-server (already a backend dependency, already used as
 * server.js's no-MONGODB_URI fallback) to spin up an isolated in-memory
 * MongoDB instance - no test framework, no shared state with a real DB.
 *
 * Run: node scripts/verify-pharmacy.js
 */
const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Drug = require('../models/Drug');

const atomicDispense = async (drugId, quantity) => {
    return Drug.findOneAndUpdate(
        { id: drugId, active: true, expiryDate: { $gte: new Date() }, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
    );
};

const seedDrug = async (stock) => {
    await Drug.deleteMany({ id: 'D-TEST' });
    return Drug.create({
        id: 'D-TEST',
        name: 'Test Drug',
        form: 'TABLET',
        strength: '500mg',
        unit: 'tablet',
        stock,
        reorderThreshold: 5,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
};

const run = async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log('Connected to in-memory MongoDB for verification.\n');

    let failures = 0;
    const check = (label, condition, detail) => {
        if (condition) {
            console.log(`PASS: ${label}`);
        } else {
            console.log(`FAIL: ${label}${detail ? ' — ' + detail : ''}`);
            failures++;
        }
    };

    // --- Scenario 1: 20 concurrent dispenses of quantity 1 against stock=10 ---
    // Evenly-dividing case: expect exactly 10 successes, 10 rejections, stock -> 0.
    await seedDrug(10);
    const results1 = await Promise.all(
        Array.from({ length: 20 }, () => atomicDispense('D-TEST', 1))
    );
    const succeeded1 = results1.filter(r => r !== null).length;
    const finalDrug1 = await Drug.findOne({ id: 'D-TEST' });

    check('Scenario 1: exactly 10 of 20 concurrent quantity=1 dispenses succeed', succeeded1 === 10, `got ${succeeded1}`);
    check('Scenario 1: final stock is exactly 0 (never negative)', finalDrug1.stock === 0, `got ${finalDrug1.stock}`);
    check('Scenario 1: stock never negative', finalDrug1.stock >= 0, `got ${finalDrug1.stock}`);

    // --- Scenario 2: 4 concurrent dispenses of quantity 3 against stock=10 ---
    // Non-evenly-dividing boundary case: 3 succeed (9 consumed), 1 rejected (1 remains, needs 3).
    await seedDrug(10);
    const results2 = await Promise.all(
        Array.from({ length: 4 }, () => atomicDispense('D-TEST', 3))
    );
    const succeeded2 = results2.filter(r => r !== null).length;
    const finalDrug2 = await Drug.findOne({ id: 'D-TEST' });

    check('Scenario 2: exactly 3 of 4 concurrent quantity=3 dispenses succeed against stock=10', succeeded2 === 3, `got ${succeeded2}`);
    check('Scenario 2: final stock is exactly 1 (10 - 3*3)', finalDrug2.stock === 1, `got ${finalDrug2.stock}`);
    check('Scenario 2: stock never negative', finalDrug2.stock >= 0, `got ${finalDrug2.stock}`);

    // --- Scenario 3: single request for more than available stock is rejected ---
    await seedDrug(5);
    const results3 = await atomicDispense('D-TEST', 6);
    const finalDrug3 = await Drug.findOne({ id: 'D-TEST' });
    check('Scenario 3: over-quantity single dispense is rejected (returns null)', results3 === null);
    check('Scenario 3: stock unchanged after rejected dispense', finalDrug3.stock === 5, `got ${finalDrug3.stock}`);

    // --- Scenario 4: expired drug is excluded by the atomic filter itself ---
    await Drug.deleteMany({ id: 'D-TEST' });
    await Drug.create({
        id: 'D-TEST', name: 'Expired Drug', form: 'TABLET', strength: '500mg', unit: 'tablet',
        stock: 10, reorderThreshold: 5, expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });
    const results4 = await atomicDispense('D-TEST', 1);
    check('Scenario 4: atomic filter itself excludes expired drugs', results4 === null);

    console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);

    await mongoose.disconnect();
    await mongoServer.stop();
    process.exit(failures === 0 ? 0 : 1);
};

run().catch(err => {
    console.error('Verification script crashed:', err);
    process.exit(1);
});
