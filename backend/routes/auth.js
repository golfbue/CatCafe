const express = require('express');
const router = express.Router();
const { getSession } = require('../db');

// POST register — สร้าง Customer หรือ Staff node ใน Neo4j
router.post('/register', async (req, res) => {
    const { name, phone, password, role, email } = req.body;
    const session = getSession();

    try {
        if (role === 'staff') {
            const staffId = 'S' + Date.now();
            const query = `
                CREATE (s:Staff {
                    id: $id,
                    name: $name,
                    role: 'Staff',
                    password: $password
                })
                RETURN s
            `;
            const result = await session.run(query, { id: staffId, name, password });
            const node = result.records[0].get('s');
            return res.json({ user: node.properties, role: 'staff' });
        } else {
            const customerId = 'C' + Date.now();
            const query = `
                CREATE (c:Customer {
                    id: $id,
                    name: $name,
                    phone: $phone,
                    email: $email,
                    register_date: date(),
                    password: $password
                })
                RETURN c
            `;
            const result = await session.run(query, {
                id: customerId,
                name,
                phone: phone || '',
                email: email || '',
                password
            });
            const node = result.records[0].get('c');
            return res.json({ user: node.properties, role: 'customer' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// POST login — ค้นหา Customer หรือ Staff ที่ตรงกับ credentials
router.post('/login', async (req, res) => {
    const { phone_or_name, password } = req.body;
    const session = getSession();

    try {
        // ตรวจ Staff ก่อน
        const staffResult = await session.run(
            'MATCH (s:Staff) WHERE s.name = $input AND s.password = $password RETURN s',
            { input: phone_or_name, password }
        );
        if (staffResult.records.length > 0) {
            const node = staffResult.records[0].get('s');
            return res.json({ user: node.properties, role: 'staff' });
        }

        // ตรวจ Customer (ด้วย phone หรือ name)
        const customerResult = await session.run(
            `MATCH (c:Customer)
             WHERE (c.phone = $input OR c.name = $input) AND c.password = $password
             RETURN c`,
            { input: phone_or_name, password }
        );
        if (customerResult.records.length > 0) {
            const node = customerResult.records[0].get('c');
            return res.json({ user: node.properties, role: 'customer' });
        }

        res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
