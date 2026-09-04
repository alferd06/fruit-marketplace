const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const productsRoutes = require('./routes/products.routes');
const ordersRoutes = require('./routes/orders.routes');
const paymentsRoutes = require('./routes/payments.routes');
app.use('/api/payments', paymentsRoutes);

const app = express();
app.use(cors());
app.use(express.json());


// Route test — cek koneksi database jalan atau tidak
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});