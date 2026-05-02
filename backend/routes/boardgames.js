const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// GET all
router.get('/', async (req, res) => {
  const session = getSession();
  try {
    const label = 'Boardgames';
    // special logic for graph
    if ('boardgames' === 'graph') {
      const result = await session.run('MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100');
      const nodes = [];
      const links = [];
      const nodeIds = new Set();

      result.records.forEach(record => {
        const n = record.get('n');
        const m = record.get('m');
        const r = record.get('r');

        if (!nodeIds.has(n.identity.toNumber())) {
          nodes.push({ id: n.identity.toNumber(), label: n.labels[0], properties: n.properties });
          nodeIds.add(n.identity.toNumber());
        }
        if (!nodeIds.has(m.identity.toNumber())) {
          nodes.push({ id: m.identity.toNumber(), label: m.labels[0], properties: m.properties });
          nodeIds.add(m.identity.toNumber());
        }

        links.push({
          source: r.start.toNumber(),
          target: r.end.toNumber(),
          type: r.type,
          properties: r.properties
        });
      });
      return res.json({ nodes, links });
    }

    const result = await session.run(`MATCH (n:${label}) RETURN n`);
    const records = result.records.map(record => {
        const node = record.get('n');
        return { id: node.identity.toNumber(), ...node.properties };
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// POST create
router.post('/', async (req, res) => {
  const session = getSession();
  try {
    const label = 'Boardgames';
    if ('boardgames' === 'graph') return res.status(400).json({error: 'Invalid operation'});
    
    // Convert properties to string string mapping
    const props = Object.keys(req.body).map(k => `${k}: $${k}`).join(', ');
    const query = `CREATE (n:${label} {${props}}) RETURN n`;
    const result = await session.run(query, req.body);
    const node = result.records[0].get('n');
    res.json({ id: node.identity.toNumber(), ...node.properties });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
