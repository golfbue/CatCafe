const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// ดึงข้อมูลแมว พร้อมสถิติการถูกเยี่ยมชม (Popularity Graph)
router.get('/', async (req, res) => {
    const session = getSession();
    try {
        const query = `
            MATCH (c:Cat)
            OPTIONAL MATCH (v:Visit)-[r:SEES]->(c)
            RETURN c, count(v) AS visitCount
            ORDER BY visitCount DESC
        `;
        const result = await session.run(query);
        const cats = result.records.map(record => ({
            ...record.get('c').properties,
            popularity: record.get('visitCount').toNumber()
        }));
        res.json(cats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
