const express = require('express');
const cors = require('cors');
const jsonDb = require('./jsonDb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Helper for dynamic CRUD routes
const setupCrud = (collection, idField = 'id') => {
    app.get(`/api/${collection}`, (req, res) => {
        res.json(jsonDb.getAll(collection));
    });

    app.get(`/api/${collection}/:id`, (req, res) => {
        const item = jsonDb.getById(collection, req.params.id, idField);
        item ? res.json(item) : res.status(404).json({ message: 'Not found' });
    });

    app.post(`/api/${collection}`, (req, res) => {
        const payload = req.body;
        if (!payload[idField]) {
            payload[idField] = Date.now(); // Auto-generate ID
        }
        const newItem = jsonDb.create(collection, payload);
        res.status(201).json(newItem);
    });

    app.put(`/api/${collection}/:id`, (req, res) => {
        const updated = jsonDb.update(collection, req.params.id, req.body, idField);
        updated ? res.json(updated) : res.status(404).json({ message: 'Not found' });
    });

    app.delete(`/api/${collection}/:id`, (req, res) => {
        const deleted = jsonDb.delete(collection, req.params.id, idField);
        deleted ? res.json({ message: 'Deleted' }) : res.status(404).json({ message: 'Not found' });
    });
};

// Setup all entities from ERD
const entities = [
    { name: 'customers', id: 'customer_id' },
    { name: 'visits', id: 'visit_id' },
    { name: 'staff', id: 'staff_id' },
    { name: 'cats', id: 'cat_id' },
    { name: 'menu', id: 'menu_id' },
    { name: 'orders', id: 'order_id' },
    { name: 'order_details', id: 'order_detail_id' },
    { name: 'payments', id: 'payment_id' },
    { name: 'boardgames', id: 'game_id' },
    { name: 'game_borrow', id: 'borrow_id' }
];

entities.forEach(entity => setupCrud(entity.name, entity.id));

// --- Authentication Logic ---

app.post('/api/auth/register', (req, res) => {
    const { name, phone, password, role } = req.body;
    
    if (role === 'staff') {
        const staff_id = Date.now();
        const newStaff = jsonDb.create('staff', {
            staff_id,
            staff_name: name,
            position: 'Staff',
            password
        });
        return res.json({ user: newStaff, role: 'staff' });
    } else {
        const customer_id = Date.now();
        const newCustomer = jsonDb.create('customers', {
            customer_id,
            name,
            phone,
            register_date: new Date().toISOString().split('T')[0],
            password
        });
        return res.json({ user: newCustomer, role: 'customer' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { phone_or_name, password } = req.body;
    
    // Check staff first
    const staff = jsonDb.getAll('staff').find(s => s.staff_name === phone_or_name && s.password === password);
    if (staff) return res.json({ user: staff, role: 'staff' });
    
    // Check customers
    const customer = jsonDb.getAll('customers').find(c => (c.phone === phone_or_name || c.name === phone_or_name) && c.password === password);
    if (customer) return res.json({ user: customer, role: 'customer' });
    
    res.status(401).json({ message: 'Invalid credentials' });
});

// --- Advanced Logic ---

// Start a Visit (Check-in)
app.post('/api/actions/checkin', (req, res) => {
    const { customer_id, staff_id } = req.body;
    const visit_id = Date.now();
    const newVisit = jsonDb.create('visits', {
        visit_id,
        customer_id,
        staff_id,
        check_in: new Date().toISOString(),
        check_out: null,
        service_fee: 50
    });
    res.json(newVisit);
});

app.post('/api/actions/order', (req, res) => {
    const { visit_id, items } = req.body;
    const order_id = Date.now();
    const newOrder = jsonDb.create('orders', {
        order_id,
        visit_id,
        order_time: new Date().toISOString(),
        status: 'pending'
    });
    
    items.forEach(item => {
        jsonDb.create('order_details', {
            order_detail_id: Date.now() + Math.random(),
            order_id,
            menu_id: item.menu_id,
            quantity: item.quantity
        });
    });
    
    res.json(newOrder);
});

app.post('/api/actions/borrow', (req, res) => {
    const { visit_id, game_id } = req.body;
    jsonDb.create('game_borrow', {
        borrow_id: Date.now(),
        visit_id,
        game_id,
        borrow_time: new Date().toISOString(),
        return_time: null
    });
    jsonDb.update('boardgames', game_id, { status: 'borrowed' }, 'game_id');
    res.json({ message: 'Game borrowed' });
});

app.get('/api/actions/payment-summary/:visit_id', (req, res) => {
    const { visit_id } = req.params;
    const visit = jsonDb.getById('visits', visit_id, 'visit_id');
    const orders = jsonDb.getAll('orders').filter(o => o.visit_id == visit_id);
    const orderDetails = jsonDb.getAll('order_details');
    const menu = jsonDb.getAll('menu');
    
    let foodTotal = 0;
    const items = [];
    
    orders.forEach(o => {
        const details = orderDetails.filter(d => d.order_id == o.order_id);
        details.forEach(d => {
            const menuItem = menu.find(m => m.menu_id == d.menu_id);
            if (menuItem) {
                const subtotal = menuItem.price * d.quantity;
                foodTotal += subtotal;
                items.push({ name: menuItem.menu_name, quantity: d.quantity, price: menuItem.price, subtotal });
            }
        });
    });
    
    const serviceFee = visit ? visit.service_fee : 0;
    const grandTotal = foodTotal + serviceFee;
    
    res.json({ items, foodTotal, serviceFee, grandTotal });
});

app.get('/api/seed', (req, res) => {
    if (jsonDb.getAll('customers').length === 0) {
        jsonDb.create('customers', { customer_id: 1, name: 'John Doe', phone: '0812345678', register_date: '2024-05-01', password: 'password123' });
        jsonDb.create('staff', { staff_id: 1, staff_name: 'Wichai', position: 'Manager', password: 'admin' });
        jsonDb.create('cats', { cat_id: 1, cat_name: 'Mochi', breed: 'British Shorthair', staff_id: 1 });
        jsonDb.create('menu', { menu_id: 1, menu_name: 'Matcha Latte', price: 85, category: 'Drink' });
        jsonDb.create('menu', { menu_id: 2, menu_name: 'Cat Cookie', price: 45, category: 'Food' });
        jsonDb.create('boardgames', { game_id: 1, game_name: 'Catan', category: 'Strategy', status: 'available' });
        return res.json({ message: 'Seed successful' });
    }
    res.json({ message: 'Data already exists' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
