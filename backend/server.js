const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { driver } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('../frontend'));

// --- Import Neo4j Route Files ---
const customersRouter = require('./routes/customers');
const catsRouter = require('./routes/cats');
const menuRouter = require('./routes/menu');
const boardgamesRouter = require('./routes/boardgames');
const staffRouter = require('./routes/staff');
const visitsRouter = require('./routes/visits');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const graphRouter = require('./routes/graph');
const actionsRouter = require('./routes/actions');
const authRouter = require('./routes/auth');

// --- Mount Routes ---
app.use('/api/customers', customersRouter);
app.use('/api/cats', catsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/boardgames', boardgamesRouter);
app.use('/api/staff', staffRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/graph', graphRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/auth', authRouter);

// --- Health Check ---
app.get('/api/health', async (req, res) => {
    try {
        const session = driver.session();
        await session.run('RETURN 1');
        await session.close();
        res.json({ status: 'ok', database: 'neo4j connected' });
    } catch (error) {
        res.status(503).json({ status: 'error', database: error.message });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🐈 NekoCafe Backend running on http://localhost:${PORT}`);
    console.log(`📊 Neo4j URI: ${process.env.NEO4J_URI || 'bolt://localhost:7687'}`);
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
    console.log('\n🔌 Shutting down... closing Neo4j driver.');
    await driver.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔌 Shutting down... closing Neo4j driver.');
    await driver.close();
    process.exit(0);
});
