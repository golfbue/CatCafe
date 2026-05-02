const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// ดึงรายการออเดอร์ทั้งหมด พร้อมข้อมูล Menu และ Customer (Graph Query)
router.get('/', async (req, res) => {
    const session = getSession();
    try {
        const query = `
            MATCH (o:Order)
            OPTIONAL MATCH (v:Visit)-[:ORDERED]->(o)
            OPTIONAL MATCH (c:Customer)-[:VISITS]->(v)
            OPTIONAL MATCH (o)-[:CONTAINS]->(m:Menu)
            RETURN o, c.name AS customerName, collect(m.name) AS items, sum(m.price) AS total
            ORDER BY o.timestamp DESC
        `;
        const result = await session.run(query);
        const orders = result.records.map(record => ({
            id: record.get('o').properties.id,
            status: record.get('o').properties.status,
            customer: record.get('customerName'),
            items: record.get('items'),
            total: record.get('total')
        }));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// อัปเดตสถานะออเดอร์
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const session = getSession();
    try {
        const query = `
            MATCH (o:Order {id: $id})
            SET o.status = $status
            RETURN o
        `;
        await session.run(query, { id, status });
        res.json({ message: 'อัปเดตสถานะสำเร็จ' });
    } finally {
        await session.close();
    }
});

module.exports = router;
