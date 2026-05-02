const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// ดึงข้อมูล Graph ทั้งหมดเพื่อไปวาดรูป (Nodes + Links)
router.get('/', async (req, res) => {
    const session = getSession();
    try {
        const query = `
            MATCH (n)-[r]->(m)
            RETURN 
                { id: id(n), label: labels(n)[0], properties: properties(n) } AS source,
                { id: id(m), label: labels(m)[0], properties: properties(m) } AS target,
                type(r) AS relType
            LIMIT 200
        `;
        const result = await session.run(query);
        
        const nodes = new Map();
        const links = [];

        result.records.forEach(record => {
            const source = record.get('source');
            const target = record.get('target');
            
            if (!nodes.has(source.id)) nodes.set(source.id, { id: source.id, label: source.label, name: source.properties.name || source.properties.id });
            if (!nodes.has(target.id)) nodes.set(target.id, { id: target.id, label: target.label, name: target.properties.name || target.properties.id });
            
            links.push({
                source: source.id,
                target: target.id,
                type: record.get('relType')
            });
        });

        res.json({ nodes: Array.from(nodes.values()), links });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
