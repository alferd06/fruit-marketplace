const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createQrisCharge } = require('../services/midtrans.service');

router.post('/create-qris', async (req, res) => {
  try {
    const { order_code } = req.body;

    const orderResult = await pool.query('SELECT * FROM orders WHERE order_code = $1', [order_code]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }
    const order = orderResult.rows[0];

    // Cek kalau sudah pernah ada payment record untuk order ini (hindari duplikat charge)
    const existingPayment = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [order.id]
    );
    if (existingPayment.rows.length > 0 && existingPayment.rows[0].transaction_status === 'pending') {
      // Kembalikan data existing daripada charge ulang — Midtrans akan reject order_id duplikat
      return res.json({ raw: existingPayment.rows[0].raw_notification });
    }

    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    const chargeResponse = await createQrisCharge(order, itemsResult.rows);

    await pool.query(
      `INSERT INTO payments (order_id, midtrans_order_id, transaction_id, payment_type, gross_amount, transaction_status, raw_notification)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [order.id, order.order_code, chargeResponse.transaction_id, 'qris', order.total_amount, chargeResponse.transaction_status, JSON.stringify(chargeResponse)]
    );

    res.json({ raw: chargeResponse });
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