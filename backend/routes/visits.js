const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// GET all visits (with customer and staff info from graph)
router.get('/', async (req, res) => {
    const session = getSession();
    try {
        const query = `
            MATCH (v:Visit)
            OPTIONAL MATCH (c:Customer)-[:VISITS]->(v)
            OPTIONAL MATCH (v)-[:HANDLED_BY]->(s:Staff)
            RETURN v, c.name AS customerName, s.name AS staffName
            ORDER BY v.date DESC
        `;
        const result = await session.run(query);
        const records = result.records.map(record => ({
            _neo4jId: record.get('v').identity.toNumber(),
            ...record.get('v').properties,
            customerName: record.get('customerName'),
            staffName: record.get('staffName')
        }));
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// GET visit by id
router.get('/:id', async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (v:Visit {id: $id}) RETURN v',
            { id: req.params.id }
        );
        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Not found' });
        }
        const node = result.records[0].get('v');
        res.json({ _neo4jId: node.identity.toNumber(), ...node.properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// POST create visit
router.post('/', async (req, res) => {
    const session = getSession();
    try {
        const props = Object.keys(req.body).map(k => `${k}: $${k}`).join(', ');
        const query = `CREATE (n:Visit {${props}}) RETURN n`;
        const result = await session.run(query, req.body);
        const node = result.records[0].get('n');
        res.status(201).json({ _neo4jId: node.identity.toNumber(), ...node.properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// PUT update visit
router.put('/:id', async (req, res) => {
    const session = getSession();
    try {
        const sets = Object.keys(req.body).map(k => `n.${k} = $${k}`).join(', ');
        const query = `MATCH (n:Visit {id: $id}) SET ${sets} RETURN n`;
        const result = await session.run(query, { id: req.params.id, ...req.body });
        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Not found' });
        }
        const node = result.records[0].get('n');
        res.json({ _neo4jId: node.identity.toNumber(), ...node.properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// DELETE visit
router.delete('/:id', async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (n:Visit {id: $id}) DETACH DELETE n RETURN count(n) AS deleted',
            { id: req.params.id }
        );
        const deleted = result.records[0].get('deleted').toNumber();
        if (deleted === 0) {
            return res.status(404).json({ message: 'Not found' });
        }
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
