const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { driver } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/cats', require('./routes/cats'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/boardgames', require('./routes/boardgames'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/graph', require('./routes/graph'));
app.use('/api/actions', require('./routes/actions'));

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await driver.verifyConnectivity();
    console.log('Connected to Neo4j Graph Database');
  } catch (error) {
    console.error('Neo4j connection error:', error);
  }
});
