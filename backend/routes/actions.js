const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// API สำหรับการสั่งอาหาร (สร้าง Order และเชื่อมความสัมพันธ์ใน Graph)
router.post('/order', async (req, res) => {
    const { customerName, menuName } = req.body;
    const session = getSession();
    
    try {
        // Cypher Query: ค้นหาลูกค้าและเมนู -> สร้าง Visit -> สร้าง Order -> เชื่อมความสัมพันธ์
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

// API สำหรับการยืมบอร์ดเกม
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

module.exports = router;
