const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Helper: generate order_code unik, misal ORD-20260904-AB12
function generateOrderCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${random}`;
}

// POST buat order baru (dipanggil saat checkout)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { buyer_name, buyer_phone, buyer_address, latitude, longitude, location_accuracy, items } = req.body;

    // Validasi dasar
    if (!buyer_name || !buyer_phone || !buyer_address || !items || items.length === 0) {
      return res.status(400).json({ message: 'Data pemesanan tidak lengkap' });
    }

    await client.query('BEGIN'); // mulai transaksi

    // Ambil harga & stok terbaru dari DB (jangan percaya harga dari frontend!)
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );
      const product = productResult.rows[0];

      if (!product) {
        throw new Error(`Produk id ${item.product_id} tidak ditemukan`);
      }
      if (!product.is_available || product.stock < item.quantity) {
        throw new Error(`Stok "${product.name}" tidak mencukupi`);
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    const orderCode = generateOrderCode();

    const orderResult = await client.query(
      `INSERT INTO orders 
        (order_code, buyer_name, buyer_phone, buyer_address, latitude, longitude, location_accuracy, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [orderCode, buyer_name, buyer_phone, buyer_address, latitude || null, longitude || null, location_accuracy || null, totalAmount]
    );
    const order = orderResult.rows[0];

    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]
      );

      // Kurangi stok
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ order, items: validatedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ message: err.message || 'Gagal membuat order' });
  } finally {
    client.release();
  }
});

// GET status order by order_code (untuk halaman status pesanan)
router.get('/:orderCode', async (req, res) => {
  try {
    const { orderCode } = req.params;
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE order_code = $1',
      [orderCode]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }
    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    res.json({ order, items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data order' });
  }
});

module.exports = router;