const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// บันทึกการชำระเงิน (เชื่อม Order -> Payment)
router.post('/', async (req, res) => {
    const { orderId, amount, method } = req.body;
    const session = getSession();
    try {
        const query = `
            MATCH (o:Order {id: $orderId})
            CREATE (p:Payment {
                id: randomUUID(),
                amount: $amount,
                method: $method,
                timestamp: timestamp()
            })
            CREATE (o)-[:PAID_BY]->(p)
            SET o.status = 'paid'
            RETURN p
        `;
        const result = await session.run(query, { orderId, amount: parseFloat(amount), method });
        res.json({ message: 'ชำระเงินสำเร็จ', payment: result.records[0].get('p').properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
