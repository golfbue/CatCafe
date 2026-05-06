const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// POST /checkin — เช็คอิน: สร้าง Visit + เชื่อม Customer, Staff
router.post('/checkin', async (req, res) => {
    const { customerName, staffName } = req.body;
    const session = getSession();

    try {
        const visitId = 'V' + Date.now();
        const query = `
            MATCH (c:Customer {name: $customerName})
            MATCH (s:Staff {name: $staffName})
            CREATE (v:Visit {id: $visitId, date: date(), duration: 0, active: true})
            CREATE (c)-[:VISITS]->(v)
            CREATE (v)-[:HANDLED_BY]->(s)
            RETURN v, c, s
        `;
        const result = await session.run(query, { customerName, staffName, visitId });

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลลูกค้าหรือพนักงาน' });
        }

        res.json({
            message: 'เช็คอินสำเร็จ!',
            visit: result.records[0].get('v').properties
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// POST /order — สั่งอาหาร: สร้าง Order + เชื่อมกับ Visit และ Menu
router.post('/order', async (req, res) => {
    const { customerName, menuName } = req.body;
    const session = getSession();

    try {
        const query = `
            MATCH (c:Customer {name: $customerName})
            MATCH (m:Menu {name: $menuName})
            MERGE (v:Visit {date: date(), active: true})
            MERGE (c)-[:VISITS]->(v)
            CREATE (o:Order {id: randomUUID(), status: 'pending', timestamp: timestamp()})
            CREATE (v)-[:ORDERED]->(o)
            CREATE (o)-[:CONTAINS]->(m)
            RETURN o, c, m
        `;

        const result = await session.run(query, { customerName, menuName });

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลลูกค้าหรือเมนู' });
        }

        res.json({ message: 'สั่งซื้อสำเร็จ!', order: result.records[0].get('o').properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// POST /borrow — ยืมบอร์ดเกม
router.post('/borrow', async (req, res) => {
    const { customerName, gameName } = req.body;
    const session = getSession();

    try {
        const query = `
            MATCH (c:Customer {name: $customerName})
            MATCH (g:BoardGame {name: $gameName})
            CREATE (c)-[:BORROWS {timestamp: timestamp()}]->(g)
            SET g.status = 'unavailable'
            RETURN c, g
        `;

        const result = await session.run(query, { customerName, gameName });

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลลูกค้าหรือบอร์ดเกม' });
        }

        res.json({ message: 'ยืมบอร์ดเกมสำเร็จ!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// POST /return — คืนบอร์ดเกม
router.post('/return', async (req, res) => {
    const { gameName } = req.body;
    const session = getSession();

    try {
        const query = `
            MATCH (g:BoardGame {name: $gameName})
            SET g.status = 'available'
            WITH g
            OPTIONAL MATCH (c)-[r:BORROWS]->(g)
            DELETE r
            RETURN g
        `;

        const result = await session.run(query, { gameName });

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'ไม่พบบอร์ดเกม' });
        }

        res.json({ message: 'คืนบอร์ดเกมสำเร็จ!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// GET /payment-summary/:visitId — สรุปยอดชำระเงินจาก Graph
router.get('/payment-summary/:visitId', async (req, res) => {
    const { visitId } = req.params;
    const session = getSession();

    try {
        const query = `
            MATCH (v:Visit {id: $visitId})
            OPTIONAL MATCH (v)-[:ORDERED]->(o:Order)-[:CONTAINS]->(m:Menu)
            RETURN v, collect({name: m.name, price: m.price, orderId: o.id}) AS items
        `;

        const result = await session.run(query, { visitId });

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'ไม่พบการเข้าใช้บริการ' });
        }

        const record = result.records[0];
        const items = record.get('items').filter(i => i.name !== null);

        let foodTotal = 0;
        const itemList = items.map(item => {
            const price = typeof item.price === 'object' ? item.price.toNumber() : item.price;
            foodTotal += price;
            return { name: item.name, price, orderId: item.orderId };
        });

        const serviceFee = 50;
        const grandTotal = foodTotal + serviceFee;

        res.json({ items: itemList, foodTotal, serviceFee, grandTotal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// POST /checkout — เช็คเอาท์: ปิด Visit
router.post('/checkout', async (req, res) => {
    const { visitId } = req.body;
    const session = getSession();

    try {
        const query = `
            MATCH (v:Visit {id: $visitId})
            SET v.active = false, v.checkout_time = timestamp()
            RETURN v
        `;

        const result = await session.run(query, { visitId });

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'ไม่พบการเข้าใช้บริการ' });
        }

        res.json({
            message: 'เช็คเอาท์เรียบร้อย',
            visit: result.records[0].get('v').properties
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
