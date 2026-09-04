const midtransClient = require('midtrans-client');
require('dotenv').config();

const snap = new midtransClient.Snap({
  isProduction: false, // sandbox
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

async function createSnapTransaction(order, items) {
  const parameter = {
    transaction_details: {
      order_id: order.order_code,
      gross_amount: order.total_amount,
    },
    item_details: items.map((item) => ({
      id: item.product_id.toString(),
      price: item.price,
      quantity: item.quantity,
      name: item.product_name.substring(0, 50), // Midtrans batasi max 50 char
    })),
    customer_details: {
      first_name: order.buyer_name,
      phone: order.buyer_phone,
    },
    enabled_payments: ['qris'], // batasi cuma QRIS, sesuai kebutuhanmu
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction; // berisi { token, redirect_url }
}

module.exports = { createSnapTransaction };