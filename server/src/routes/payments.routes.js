const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createSnapTransaction } = require('../services/midtrans.service');

// POST buat Snap token untuk order tertentu
router.post('/create-snap', async (req, res) => {
  try {
    const { order_code } = req.body;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE order_code = $1',
      [order_code]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }
    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    const transaction = await createSnapTransaction(order, itemsResult.rows);

    // Simpan record awal di tabel payments, status masih 'pending'
    await pool.query(
      `INSERT INTO payments (order_id, midtrans_order_id, payment_type, gross_amount, transaction_status)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.id, order.order_code, 'qris', order.total_amount, 'pending']
    );

    res.json({ snap_token: transaction.token, redirect_url: transaction.redirect_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat transaksi pembayaran' });
  }
});

// POST — dipanggil Midtrans, BUKAN dari frontend
router.post('/notification', async (req, res) => {
  try {
    const notification = req.body;
    const orderCode = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log(`Notifikasi diterima untuk ${orderCode}: ${transactionStatus}`);

    // Tentukan status final
    let finalStatus = transactionStatus;
    if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
      finalStatus = 'settlement';
    }

    // Update tabel payments
    await pool.query(
      `UPDATE payments 
       SET transaction_status = $1, transaction_id = $2, raw_notification = $3, updated_at = NOW()
       WHERE midtrans_order_id = $4`,
      [finalStatus, notification.transaction_id, JSON.stringify(notification), orderCode]
    );

    // Kalau pembayaran sukses, update delivery_status order jadi 'diproses'
    if (finalStatus === 'settlement') {
      await pool.query(
        `UPDATE orders SET delivery_status = 'diproses', updated_at = NOW() WHERE order_code = $1`,
        [orderCode]
      );
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing notification');
  }
});

module.exports = router;