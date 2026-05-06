const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// GET all menu items
router.get('/', async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run('MATCH (n:Menu) RETURN n');
        const records = result.records.map(record => {
            const node = record.get('n');
            return { _neo4jId: node.identity.toNumber(), ...node.properties };
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// GET menu by id
router.get('/:id', async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (n:Menu {id: $id}) RETURN n',
            { id: req.params.id }
        );
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

// POST create menu item
router.post('/', async (req, res) => {
    const session = getSession();
    try {
        const props = Object.keys(req.body).map(k => `${k}: $${k}`).join(', ');
        const query = `CREATE (n:Menu {${props}}) RETURN n`;
        const result = await session.run(query, req.body);
        const node = result.records[0].get('n');
        res.status(201).json({ _neo4jId: node.identity.toNumber(), ...node.properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// PUT update menu item
router.put('/:id', async (req, res) => {
    const session = getSession();
    try {
        const sets = Object.keys(req.body).map(k => `n.${k} = $${k}`).join(', ');
        const query = `MATCH (n:Menu {id: $id}) SET ${sets} RETURN n`;
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

// DELETE menu item
router.delete('/:id', async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (n:Menu {id: $id}) DETACH DELETE n RETURN count(n) AS deleted',
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
